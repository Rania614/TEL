import { promises as fs } from "node:fs";
import path from "node:path";
import { read, UPLOAD_DIR } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { canReadFile } from "@/lib/access";

export const runtime = "nodejs";

export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  const db = await read();
  const f = db.files.find((x) => x.id === id);
  if (!f || !canReadFile(db, user, id)) throw new HttpError(404, "File not found.");
  const buf = await fs.readFile(path.join(UPLOAD_DIR, f.storageKey)).catch(() => null);
  if (!buf) throw new HttpError(404, "The file is missing from storage.");

  const headers: Record<string, string> = {
    "Content-Type": f.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(f.originalName)}`,
  };
  // Range support so audio can be scrubbed in every browser.
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? parseInt(range[1], 10) : 0;
    const end = range[2] ? Math.min(parseInt(range[2], 10), buf.length - 1) : buf.length - 1;
    if (start <= end && start < buf.length) {
      return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${buf.length}`, "Content-Length": String(end - start + 1) },
      });
    }
  }
  return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Length": String(buf.length) } });
});
