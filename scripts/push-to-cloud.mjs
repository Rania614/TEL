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

// Values in .env.local / .env WIN over variables already set on the computer,
// so an old global DATABASE_URL can't send this script to the wrong place.
const fromFile = {};
for (const f of [".env", ".env.local"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const v = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (v) { fromFile[m[1]] = f; process.env[m[1]] = v; }
  }
}
const urlVar = ["DATABASE_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"].find((k) => process.env[k]);
const url = urlVar ? process.env[urlVar] : "";
if (!url) {
  console.error("✗ DATABASE_URL / POSTGRES_URL is missing or empty in .env.local.");
  console.error("  If `vercel env pull` wrote them as empty, they are marked Sensitive in Vercel —");
  console.error("  copy the connection string from Vercel → Storage → your Neon database → .env.local tab.");
  process.exit(1);
}
let host = "?";
try { host = new URL(url).hostname; } catch { host = "(not a valid URL)"; }
console.log(`→ Database: ${urlVar} from ${fromFile[urlVar] ?? "your computer's environment"} → host ${host}`);
if (!/^postgres(ql)?:\/\//.test(url) || !host.includes(".") && !/localhost|127\.0\.0\.1/.test(host)) {
  console.error(`✗ ${urlVar} doesn't look like a Neon connection string (host "${host}").`);
  console.error("  It should look like postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require");
  process.exit(1);
}
const blobToken = process.env.BLOB_READ_WRITE_TOKEN || "";
if (!blobToken.startsWith("vercel_blob_rw_")) {
  console.error(`✗ BLOB_READ_WRITE_TOKEN in .env.local is ${blobToken ? `"${blobToken.slice(0, 12)}…"` : "missing"} — it must be the real token`);
  console.error("  (starts with vercel_blob_rw_). Copy it from Vercel → Storage → your Blob store → .env.local tab → Show secret.");
  process.exit(1);
}
// Use the token directly — never fall back to Vercel's OIDC login from this computer.
delete process.env.VERCEL_OIDC_TOKEN;
if (!existsSync("storage/db.json")) { console.error("✗ storage/db.json not found — run this inside the project folder."); process.exit(1); }

const db = JSON.parse(readFileSync("storage/db.json", "utf8"));
const local = /localhost|127\.0\.0\.1/.test(url);
const client = new pg.Client({ connectionString: url.replace(/([?&])sslmode=require/, "$1sslmode=verify-full"), ssl: local ? false : { rejectUnauthorized: false } });
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
  const r = await put(`uploads/${f.storageKey}`, readFileSync(p), { access: "public", contentType: f.mime, addRandomSuffix: true, token: blobToken });
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
