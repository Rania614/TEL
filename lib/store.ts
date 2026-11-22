import "server-only";
import { promises as fs, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Database } from "./types";
import { buildSeed } from "./seed";
import { migrate } from "./migrate";

/**
 * Demo persistence layer.
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
  await queue.catch(() => undefined);
  return load();
}

/** Serialised read-modify-write. Whatever `fn` returns is passed back. */
export function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
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
