import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "./store";

/**
 * Where uploaded bytes live.
 * - Vercel (BLOB_READ_WRITE_TOKEN set): Vercel Blob. storageKey = "blob:<url>".
 *   /api/files/[id] checks permission first, then streams a private blob (or redirects to a public one).
 * - Local / any server with a disk: storage/uploads/<key>.
 */
/** The read-write token, only if it is a real one (not Vercel's "[SENSITIVE]" placeholder). */
export const blobToken = () => {
  const t = process.env.BLOB_READ_WRITE_TOKEN || "";
  return t.startsWith("vercel_blob_rw_") ? t : "";
};
export const blobEnabled = () => !!blobToken();
/**
 * Must match the Blob store's own setting in Vercel. Private (the default) keeps student
 * recordings unreachable without signing in; set BLOB_ACCESS=public only for a public store.
 */
export const blobAccess = (): "public" | "private" => (process.env.BLOB_ACCESS === "public" ? "public" : "private");
export const blobUrlOf = (storageKey: string) => (storageKey.startsWith("blob:") ? storageKey.slice(5) : null);
export const isOurBlobUrl = (url: string) => {
  try { const u = new URL(url); return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com"); } catch { return false; }
};

export async function saveBytes(id: string, ext: string, buf: Buffer, mime: string): Promise<string> {
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    const r = await put(`uploads/${id}${ext}`, buf, { access: blobAccess(), contentType: mime, addRandomSuffix: true, token: blobToken() });
    return `blob:${r.url}`;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, `${id}${ext}`), buf);
  return `${id}${ext}`;
}

/** Bytes from local disk (blob files are served by redirect instead). */
export async function readLocalBytes(storageKey: string): Promise<Buffer | null> {
  if (blobUrlOf(storageKey)) return null;
  return fs.readFile(path.join(UPLOAD_DIR, storageKey)).catch(() => null);
}
