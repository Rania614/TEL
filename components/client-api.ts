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

let directMode: Promise<boolean> | null = null;
const isDirect = () => (directMode ??= fetch("/api/files/config").then((r) => r.json()).then((j) => !!j.direct).catch(() => false));

export async function uploadFile(file: Blob, name: string): Promise<FileAsset> {
  const mime = (file.type || "application/octet-stream").split(";")[0];
  if (await isDirect()) {
    // Cloud (Vercel): send the bytes straight to Vercel Blob, then register the metadata.
    const { upload } = await import("@vercel/blob/client");
    const safe = name.replace(/[^\w.\-]+/g, "_").slice(-80) || "upload";
    let blob: { url: string };
    try {
      blob = await upload(`uploads/${safe}`, file, { access: "public", handleUploadUrl: "/api/files/upload-token", contentType: mime, clientPayload: JSON.stringify({ mime }) });
    } catch (e) {
      throw new Error((e as Error).message?.replace(/^Vercel Blob: /, "") || "Upload failed");
    }
    return api<FileAsset>("/api/files/register", "POST", { url: blob.url, name, mime });
  }
  const fd = new FormData();
  fd.append("file", file instanceof File ? file : new File([file], name, { type: file.type }));
  const res = await fetch("/api/files", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
  return data as FileAsset;
}

/** Fire the achievement toast from anywhere. */
export function celebrate(list: Achievement[] | undefined) {
  if (list?.length) window.dispatchEvent(new CustomEvent("el:achievements", { detail: list }));
}
