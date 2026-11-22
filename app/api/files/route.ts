import { promises as fs } from "node:fs";
import path from "node:path";
import { mutate, newId, now, UPLOAD_DIR } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import type { FileKind } from "@/lib/types";

export const runtime = "nodejs";
const MAX_BYTES = 25 * 1024 * 1024;

const STUDENT_TYPES = /^(audio\/.+|image\/(jpeg|png|webp)|application\/pdf)$/;
const TEACHER_TYPES = /^(audio\/.+|image\/(jpeg|png|webp|gif)|application\/pdf|application\/(msword|vnd\.openxmlformats-officedocument\..+|vnd\.ms-powerpoint)|text\/plain)$/;

function kindOf(mime: string): FileKind {
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime === "application/pdf") return "PDF";
  return "OTHER";
}

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
  const storageKey = `${id}${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, storageKey), Buffer.from(await file.arrayBuffer()));

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
