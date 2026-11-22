import { mutate, newId, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { isOurBlobUrl } from "@/lib/files";
import { MAX_BYTES, STUDENT_TYPES, TEACHER_TYPES, kindOf } from "@/lib/upload-rules";
import type { FileAsset } from "@/lib/types";

/** After a direct-to-Blob upload, store the file's metadata (owner, name, type, size). */
export const POST = handle(async (req: Request) => {
  const user = await requireApiUser();
  const b = (await req.json()) as { url?: string; name?: string; mime?: string };
  if (!b.url || !isOurBlobUrl(b.url)) throw new HttpError(400, "Unknown upload location.");
  const mime = (b.mime || "application/octet-stream").split(";")[0];
  if (!(user.role === "TEACHER" ? TEACHER_TYPES : STUDENT_TYPES).test(mime)) throw new HttpError(415, "This file type isn't supported.");
  const head = await fetch(b.url, { method: "HEAD" }).catch(() => null);
  if (!head?.ok) throw new HttpError(400, "The uploaded file could not be found.");
  const size = Number(head.headers.get("content-length") || 0);
  if (!size || size > MAX_BYTES) throw new HttpError(413, "Files must be 25 MB or smaller.");
  const asset = await mutate((db) => {
    if (db.files.some((f) => f.storageKey === `blob:${b.url}`)) throw new HttpError(409, "This upload is already registered.");
    const a: FileAsset = {
      id: newId(), ownerId: user.id, originalName: String(b.name || "upload").slice(0, 200), mime, size,
      storageKey: `blob:${b.url}`, kind: kindOf(mime), createdAt: now(),
    };
    db.files.push(a);
    return a;
  });
  return Response.json(asset);
});
