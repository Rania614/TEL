"use client";
import { useEffect, useState } from "react";
import type { UploadProgress } from "./client-api";

/** Live text for the current upload, e.g. "Uploading 42%" — empty when nothing is uploading. */
export function useUploadProgress(active: boolean) {
  const [p, setP] = useState<UploadProgress | null>(null);
  useEffect(() => {
    if (!active) { setP(null); return; }
    const on = (e: Event) => {
      const d = (e as CustomEvent<UploadProgress>).detail;
      setP(d.percent < 0 ? null : d);
    };
    window.addEventListener("el:upload", on);
    return () => window.removeEventListener("el:upload", on);
  }, [active]);
  if (!active || !p) return "";
  return p.stage === "preparing" ? "Preparing…" : p.stage === "uploading" ? `Uploading ${p.percent}%` : "Saving…";
}
