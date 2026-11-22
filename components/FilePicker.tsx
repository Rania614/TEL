"use client";
import { useRef, useState } from "react";
import { uploadFile } from "./client-api";
import { useUploadProgress } from "./useUploadProgress";
import type { FileAsset } from "@/lib/types";

/** Click-or-drop uploader. Calls onUploaded for each file stored on the server. */
export function FilePicker({ accept, label, onUploaded, multiple = true }: {
  accept: string; label: string; onUploaded: (f: FileAsset) => void; multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const progress = useUploadProgress(busy > 0);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    for (const f of Array.from(files)) {
      setBusy((n) => n + 1);
      try { onUploaded(await uploadFile(f, f.name)); }
      catch (e) { setError(`${f.name}: ${(e as Error).message}`); }
      finally { setBusy((n) => n - 1); }
    }
    if (input.current) input.current.value = "";
  }

  return (
    <div className="stack" style={{ gap: ".4rem" }}>
      <label className={`dropzone${drag ? " drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}>
        <input ref={input} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(e) => handle(e.target.files)} />
        {busy ? <><span className="spinner" /> {progress || "Uploading…"}</> : <>⇪ {label}</>}
      </label>
      {error && <div className="alert error" role="alert">{error}</div>}
    </div>
  );
}
