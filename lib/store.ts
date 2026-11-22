import "server-only";
import { promises as fs, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Database } from "./types";
import { buildSeed } from "./seed";
import { migrate } from "./migrate";

/**
 * Persistence layer — two interchangeable backends behind read() / mutate():
 *
 * 1. PostgreSQL (when DATABASE_URL / POSTGRES_URL is set — e.g. Neon on Vercel).
 *    The whole library is one JSONB document in table app_state, updated inside a
 *    transaction with SELECT … FOR UPDATE, so concurrent saves never overwrite each other.
 * 2. A JSON file on disk (local development / any server with a persistent disk).
 *
 * Original notes for the file backend:
 *
 * A single JSON file on the SERVER (storage/db.json). Every browser that talks
 * to the same running server shares this data — it is not per-device
 * localStorage. It is meant for one class (5 people) on one machine/server.
 *
 * To move to PostgreSQL: implement the same `read` / `mutate` calls with
 * Prisma using docs/target-schema.prisma. Nothing outside /lib touches the file.
 */

const STORAGE_DIR = path.join(process.cwd(), "storage");
const DB_FILE = path.join(STORAGE_DIR, "db.json");
export const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");

let queue: Promise<unknown> = Promise.resolve();

/* ───────── PostgreSQL backend ───────── */
const PG_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
type PgPool = import("pg").Pool;
const g = globalThis as unknown as { __elPool?: PgPool; __elReady?: Promise<void> };
async function pg(): Promise<PgPool> {
  if (!g.__elPool) {
    const { Pool } = await import("pg");
    const local = /localhost|127\.0\.0\.1/.test(PG_URL);
    g.__elPool = new Pool({ connectionString: PG_URL.replace(/([?&])sslmode=require/, "$1sslmode=verify-full"), max: 3, ssl: local ? false : { rejectUnauthorized: false } });
  }
  g.__elReady ??= g.__elPool.query(`CREATE TABLE IF NOT EXISTS app_state (id int PRIMARY KEY, doc jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`).then(() => undefined);
  await g.__elReady;
  return g.__elPool;
}
async function pgRead(): Promise<Database> {
  const pool = await pg();
  let r = await pool.query("SELECT doc FROM app_state WHERE id = 1");
  if (!r.rows.length) {
    await pool.query("INSERT INTO app_state (id, doc) VALUES (1, $1) ON CONFLICT (id) DO NOTHING", [JSON.stringify(buildSeed())]);
    r = await pool.query("SELECT doc FROM app_state WHERE id = 1");
  }
  const db = r.rows[0].doc as Database;
  if (migrate(db)) await pool.query("UPDATE app_state SET doc = $1, updated_at = now() WHERE id = 1", [JSON.stringify(db)]);
  return db;
}
async function pgMutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  await pgRead(); // make sure the row exists and is migrated
  const pool = await pg();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query("SELECT doc FROM app_state WHERE id = 1 FOR UPDATE");
    const db = r.rows[0].doc as Database;
    migrate(db);
    const result = await fn(db);
    await client.query("UPDATE app_state SET doc = $1, updated_at = now() WHERE id = 1", [JSON.stringify(db)]);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}
export const storageBackend = () => (PG_URL ? "postgres" : "file");

function ensureDirs() {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function load(): Promise<Database> {
  ensureDirs();
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const db = JSON.parse(raw) as Database;
    if (migrate(db)) {
      // keep a one-time backup of the pre-migration file
      await fs.writeFile(`${DB_FILE}.v${JSON.parse(raw).schemaVersion ?? 1}.bak`, raw, "utf8").catch(() => undefined);
      await save(db);
    }
    return db;
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const seeded = buildSeed();
    await save(seeded);
    return seeded;
  }
}

async function save(db: Database) {
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE); // atomic replace
}

/** Read a consistent snapshot. */
export async function read(): Promise<Database> {
  if (PG_URL) return pgRead();
  await queue.catch(() => undefined);
  return load();
}

/** Serialised read-modify-write. Whatever `fn` returns is passed back. */
export function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  if (PG_URL) return pgMutate(fn);
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await save(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = () => randomUUID().replace(/-/g, "").slice(0, 20);
export const now = () => new Date().toISOString();
