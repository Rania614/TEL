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

export async function uploadFile(file: Blob, name: string): Promise<FileAsset> {
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
