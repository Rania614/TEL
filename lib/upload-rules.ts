import type { FileKind } from "./types";

/** Shared by the direct form upload and the Vercel Blob client-upload routes. */
export const MAX_BYTES = 25 * 1024 * 1024;

export const STUDENT_TYPES = /^(audio\/.+|image\/(jpeg|png|webp)|application\/pdf)$/;
export const TEACHER_TYPES = /^(audio\/.+|image\/(jpeg|png|webp|gif)|application\/pdf|application\/(msword|vnd\.openxmlformats-officedocument\..+|vnd\.ms-powerpoint)|text\/plain)$/;

export function kindOf(mime: string): FileKind {
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime === "application/pdf") return "PDF";
  return "OTHER";
}

