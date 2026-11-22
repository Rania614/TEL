import path from "node:path";
import { mutate, newId, now } from "@/lib/store";
import { saveBytes } from "@/lib/files";
import { MAX_BYTES, STUDENT_TYPES, TEACHER_TYPES, kindOf } from "@/lib/upload-rules";
import { handle, HttpError, requireApiUser } from "@/lib/auth";

export const runtime = "nodejs";
export const POST = handle(async (req: Request) => {
  const user = await requireApiUser();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file received.");
  if (file.size === 0) throw new HttpError(400, "The file is empty.");
  if (file.size > MAX_BYTES) throw new HttpError(413, "Files must be 25 MB or smaller.");
  const mime = (file.type || "application/octet-stream").split(";")[0];
  const allowed = user.role === "TEACHER" ? TEACHER_TYPES : STUDENT_TYPES;
  if (!allowed.test(mime)) throw new HttpError(415, "This file type isn't supported. Use audio, JPG/PNG or PDF.");

  const id = newId();
  const ext = path.extname(file.name).replace(/[^.\w]/g, "").slice(0, 8);
  const storageKey = await saveBytes(id, ext, Buffer.from(await file.arrayBuffer()), mime);

  const asset = await mutate((db) => {
    const a = {
      id, ownerId: user.id, originalName: file.name.slice(0, 200) || "upload", mime,
      size: file.size, storageKey, kind: kindOf(mime), createdAt: now(),
    };
    db.files.push(a);
    return a;
  });
  return Response.json(asset);
});
