"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm({ levels }: { levels: { number: number; title: string }[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState(String(levels[0]?.number ?? 1));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Choose a document first.");
    setBusy(true); setError("");
    const fd = new FormData(); fd.append("file", file); fd.append("level", level);
    try {
      const res = await fetch("/api/teacher/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The import failed.");
      router.push(`/teacher/import/${data.id}${data.alreadyImported ? "?dup=1" : ""}`);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return (
    <form className="paper stack" onSubmit={go}>
      <h2 style={{ margin: 0 }}>① Upload a document</h2>
      <label className={`dropzone big${drag ? " drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
        <input type="file" className="sr-only" accept=".docx,.pdf,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file ? <>📄 <strong>{file.name}</strong> · {(file.size / 1024).toFixed(0)} KB — click to change</> : <>⇪ Drop the course document here, or click to choose (.docx, .pdf, .txt)</>}
      </label>
      <label className="field">Target level (used for sessions that don’t name their level in the document)
        <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
          {levels.map((l) => <option key={l.number} value={l.number}>{l.title}</option>)}
          <option value={String(Math.max(0, ...levels.map((l) => l.number)) + 1)}>New: Level {Math.max(0, ...levels.map((l) => l.number)) + 1}</option>
        </select>
      </label>
      {error && <div className="alert error" role="alert">{error}</div>}
      <button className="btn" disabled={busy || !file}>{busy ? <><span className="spinner" /> Reading the document…</> : "✦ Read & organise"}</button>
      <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>The original file is kept with the import as its source. Nothing is shown to students until you publish.</p>
    </form>
  );
}
