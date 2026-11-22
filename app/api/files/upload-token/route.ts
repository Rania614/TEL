import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { blobToken } from "@/lib/files";
import { MAX_BYTES, STUDENT_TYPES, TEACHER_TYPES } from "@/lib/upload-rules";

export const runtime = "nodejs";
const STUDENT_LIST = ["audio/*", "image/jpeg", "image/png", "image/webp", "application/pdf"];
const TEACHER_LIST = [...STUDENT_LIST, "image/gif", "text/plain", "application/msword", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];

/**
 * Issues a short-lived token so the browser can upload a file directly to Vercel Blob
 * (Vercel functions only accept request bodies up to 4.5 MB).
 */
export const POST = handle(async (req: Request) => {
  const body = (await req.json()) as HandleUploadBody;
  const json = await handleUpload({
    body, request: req, token: blobToken(),
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const user = await requireApiUser();
      const mime = (JSON.parse(clientPayload || "{}") as { mime?: string }).mime ?? "";
      const allowed = user.role === "TEACHER" ? TEACHER_TYPES : STUDENT_TYPES;
      if (!allowed.test(mime)) throw new HttpError(415, "This file type isn't supported. Use audio, JPG/PNG or PDF.");
      return {
        allowedContentTypes: user.role === "TEACHER" ? TEACHER_LIST : STUDENT_LIST,
        maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true, tokenPayload: user.id,
      };
    },
    // Metadata is recorded by /api/files/register right after the upload finishes.
    onUploadCompleted: async () => undefined,
  });
  return Response.json(json);
});
