import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { mutate, newId, now, UPLOAD_DIR } from "../store";
import type { FileAsset } from "../types";

/** Stores an uploaded source document like any other upload (metadata in the DB, bytes in storage/uploads). */
export async function storeSourceFile(file: File, ownerId: string) {
  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const id = newId();
  const ext = path.extname(file.name).replace(/[^.\w]/g, "").slice(0, 8);
  const storageKey = `${id}${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, storageKey), buf);
  const mime = (file.type || "application/octet-stream").split(";")[0];
  const asset: FileAsset = {
    id, ownerId, originalName: file.name.slice(0, 200), mime, size: buf.length, storageKey,
    kind: mime === "application/pdf" ? "PDF" : "OTHER", createdAt: now(),
  };
  await mutate((db) => { db.files.push(asset); });
  return { asset, buf, sha256 };
}
