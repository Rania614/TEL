import { read } from "@/lib/store";
import { blobAccess, blobToken, blobUrlOf, readLocalBytes } from "@/lib/files";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { canReadFile } from "@/lib/access";

export const runtime = "nodejs";

/** Signed read links, reused for ~50 minutes per file (each is valid for an hour). */
const signedCache = new Map<string, { url: string; until: number }>();
async function signedBlobUrl(blobUrl: string): Promise<string | null> {
  const hit = signedCache.get(blobUrl);
  if (hit && hit.until > Date.now()) return hit.url;
  try {
    const { issueSignedToken, presignUrl } = await import("@vercel/blob");
    const pathname = decodeURIComponent(new URL(blobUrl).pathname.replace(/^\//, ""));
    const validUntil = Date.now() + 60 * 60 * 1000;
    const tok = await issueSignedToken({ token: blobToken(), pathname, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(tok, { operation: "get", pathname, access: "private", validUntil });
    signedCache.set(blobUrl, { url: presignedUrl, until: Date.now() + 50 * 60 * 1000 });
    if (signedCache.size > 500) signedCache.delete(signedCache.keys().next().value as string);
    return presignedUrl;
  } catch (e) {
    console.warn("Signed blob link failed, streaming instead:", (e as Error).message);
    return null;
  }
}

export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireApiUser();
  const db = await read();
  const f = db.files.find((x) => x.id === id);
  if (!f || !canReadFile(db, user, id)) throw new HttpError(404, "File not found.");
  const blob = blobUrlOf(f.storageKey);
  if (blob && (blobAccess() === "public" || blob.includes(".public.blob."))) {
    // Public store: redirect to the (unguessable) blob URL, only after the access check above.
    return new Response(null, { status: 302, headers: { Location: blob, "Cache-Control": "private, no-store" } });
  }
  if (blob) {
    // Private store, fast path: a short-lived signed link, so the browser downloads straight
    // from Vercel's CDN (with seeking) instead of every byte passing through this function.
    const signed = await signedBlobUrl(blob);
    if (signed) return new Response(null, { status: 302, headers: { Location: signed, "Cache-Control": "private, no-store" } });
    // Fallback: stream the bytes through this route (forwarding Range so audio can be scrubbed).
    const { get } = await import("@vercel/blob");
    const range = req.headers.get("range");
    const r = await get(blob, { access: "private", token: blobToken(), ...(range ? { headers: { range } } : {}) }).catch(() => null);
    if (!r || !r.stream) throw new HttpError(404, "The file is missing from storage.");
    const out: Record<string, string> = {
      "Content-Type": f.mime,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(f.originalName)}`,
    };
    const len = r.headers.get("content-length");
    const cr = r.headers.get("content-range");
    if (len) out["Content-Length"] = len;
    if (cr) out["Content-Range"] = cr;
    return new Response(r.stream, { status: cr ? 206 : 200, headers: out });
  }
  const buf = await readLocalBytes(f.storageKey);
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
