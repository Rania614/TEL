// Copies your LOCAL library (storage/db.json + storage/uploads) to the cloud
// database (Postgres) and file storage (Vercel Blob) used by the Vercel deployment.
//
// 1. In Vercel: create/connect a Neon Postgres database and a Blob store (Storage tab).
// 2. Put DATABASE_URL (or POSTGRES_URL) and BLOB_READ_WRITE_TOKEN in .env.local
//    (easiest: `npx vercel link` then `npx vercel env pull .env.local`).
// 3. Run:  node scripts/push-to-cloud.mjs            (refuses to overwrite cloud data)
//          node scripts/push-to-cloud.mjs --force    (replace what is in the cloud)
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { put } from "@vercel/blob";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error("✗ DATABASE_URL / POSTGRES_URL is missing (.env.local)."); process.exit(1); }
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error("✗ BLOB_READ_WRITE_TOKEN is missing (.env.local)."); process.exit(1); }
if (!existsSync("storage/db.json")) { console.error("✗ storage/db.json not found — run this inside the project folder."); process.exit(1); }

const db = JSON.parse(readFileSync("storage/db.json", "utf8"));
const local = /localhost|127\.0\.0\.1/.test(url);
const client = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
await client.connect();
await client.query(`CREATE TABLE IF NOT EXISTS app_state (id int PRIMARY KEY, doc jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
const existing = await client.query("SELECT doc FROM app_state WHERE id = 1");
if (existing.rows.length && !process.argv.includes("--force")) {
  const c = existing.rows[0].doc;
  const work = (c.submissions?.length ?? 0) + (c.feedback?.length ?? 0);
  console.error(`✗ The cloud database already has data (${c.sessions?.length ?? 0} sessions, ${work} submissions/feedback).`);
  console.error("  Run again with --force to REPLACE it with your local copy.");
  await client.end(); process.exit(1);
}

let moved = 0, missing = 0;
for (const f of db.files ?? []) {
  if (String(f.storageKey).startsWith("blob:")) continue;
  const p = path.join("storage", "uploads", f.storageKey);
  if (!existsSync(p)) { missing++; console.warn(`  ! missing file: ${f.originalName}`); continue; }
  const r = await put(`uploads/${f.storageKey}`, readFileSync(p), { access: "public", contentType: f.mime, addRandomSuffix: true });
  f.storageKey = `blob:${r.url}`;
  moved++;
  process.stdout.write(`  ⇪ ${f.originalName}\n`);
}
await client.query(
  "INSERT INTO app_state (id, doc) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()",
  [JSON.stringify(db)],
);
await client.end();
console.log(`✓ Copied ${db.sessions.length} sessions, ${db.tasks.length} tasks, ${db.submissions.length} submissions and ${moved} files to the cloud${missing ? ` (${missing} files were missing locally)` : ""}.`);
console.log("  Your local storage/db.json was not changed.");
