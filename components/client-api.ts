"use client";
import type { Achievement, FileAsset } from "@/lib/types";

export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

type UploadConfig = { direct: boolean; access: "public" | "private" };
let uploadConfig: Promise<UploadConfig> | null = null;
const getConfig = () => (uploadConfig ??= fetch("/api/files/config").then((r) => r.json())
  .then((j) => ({ direct: !!j.direct, access: j.access === "public" ? "public" : "private" } as UploadConfig))
  .catch(() => ({ direct: false, access: "private" } as UploadConfig)));

export type UploadProgress = { stage: "preparing" | "uploading" | "saving"; percent: number };
const emit = (p: UploadProgress) => window.dispatchEvent(new CustomEvent("el:upload", { detail: p }));

/** Give up instead of spinning forever: 45 s plus ~1 s per 100 KB (slow mobile data). */
const timeoutFor = (bytes: number) => 45_000 + Math.ceil(bytes / 100_000) * 1000;

function withTimeout<T>(p: Promise<T>, ms: number, ctrl: AbortController): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<T>((_, rej) => { t = setTimeout(() => { ctrl.abort(); rej(new Error("The upload took too long — check your internet connection and try again.")); }, ms); }),
  ]).finally(() => clearTimeout(t));
}

export async function uploadFile(file: Blob, name: string): Promise<FileAsset> {
  const mime = (file.type || "application/octet-stream").split(";")[0];
  const t0 = performance.now();
  const lap = (step: string) => console.info(`[upload] ${step} after ${Math.round(performance.now() - t0)} ms (${Math.round(file.size / 1024)} KB)`);
  const ctrl = new AbortController();
  emit({ stage: "preparing", percent: 0 });
  try {
    const cfg = await getConfig();
    if (cfg.direct) {
      // Cloud (Vercel): send the bytes straight to Vercel Blob, then register the metadata.
      const { upload } = await import("@vercel/blob/client");
      const safe = name.replace(/[^\w.\-]+/g, "_").slice(-80) || "upload";
      let blob: { url: string };
      try {
        blob = await withTimeout(upload(`uploads/${safe}`, file, {
          access: cfg.access, handleUploadUrl: "/api/files/upload-token", contentType: mime,
          clientPayload: JSON.stringify({ mime }), abortSignal: ctrl.signal,
          onUploadProgress: ({ percentage }) => emit({ stage: "uploading", percent: Math.round(percentage) }),
        }), timeoutFor(file.size), ctrl);
      } catch (e) {
        lap("failed while uploading");
        throw new Error((e as Error).message?.replace(/^Vercel Blob: /, "") || "Upload failed");
      }
      lap("bytes uploaded");
      emit({ stage: "saving", percent: 100 });
      const asset = await withTimeout(api<FileAsset>("/api/files/register", "POST", { url: blob.url, name, mime }), 30_000, ctrl);
      lap("saved");
      return asset;
    }
    const fd = new FormData();
    fd.append("file", file instanceof File ? file : new File([file], name, { type: file.type }));
    emit({ stage: "uploading", percent: 0 });
    const res = await withTimeout(fetch("/api/files", { method: "POST", body: fd, signal: ctrl.signal }), timeoutFor(file.size), ctrl);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
    lap("saved");
    return data as FileAsset;
  } finally {
    emit({ stage: "saving", percent: -1 }); // -1 = finished (success or not)
  }
}

/** Fire the achievement toast from anywhere. */
export function celebrate(list: Achievement[] | undefined) {
  if (list?.length) window.dispatchEvent(new CustomEvent("el:achievements", { detail: list }));
}
