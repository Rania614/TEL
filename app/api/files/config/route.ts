import { handle, requireApiUser } from "@/lib/auth";
import { blobEnabled } from "@/lib/files";

/** Tells the browser how to upload: straight to Vercel Blob (cloud) or through /api/files (local disk). */
export const GET = handle(async () => {
  await requireApiUser();
  return Response.json({ direct: blobEnabled() });
});
