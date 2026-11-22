"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Correction, FileAsset } from "@/lib/types";
import { api, uploadFile } from "@/components/client-api";
import { AudioRecorder } from "@/components/AudioRecorder";
import { FilePicker } from "@/components/FilePicker";
import { FileView } from "@/components/Media";

export default function ReviewForm({ submissionId, studentName }: { submissionId: string; studentName: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<FileAsset | null>(null);
  const [score, setScore] = useState("");
  const [rating, setRating] = useState(0);
  const [corr, setCorr] = useState<Correction[]>([]);
  const [busy, setBusy] = useState(false);
  const [recSaving, setRecSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function addFromSelection() {
    const sel = window.getSelection()?.toString().trim() ?? "";
    setCorr((c) => [...c, { original: sel, correction: "", note: "" }]);
  }
  const setC = (i: number, patch: Partial<Correction>) => setCorr((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function send(decision: "REVIEWED" | "NEEDS_REVISION" | "COMMENT") {
    setBusy(true); setMsg(null);
    try {
      await api(`/api/submissions/${submissionId}/feedback`, "POST", {
        text, audioFileId: audio?.id ?? null, score: score === "" ? null : Number(score), rating: rating || null, corrections: corr, decision,
      });
      setText(""); setAudio(null); setScore(""); setRating(0); setCorr([]);
      setMsg({ kind: "ok", text: decision === "REVIEWED" ? `Marked as reviewed. ${studentName} will see your feedback and her reward.` : decision === "NEEDS_REVISION" ? `Revision requested. ${studentName} will see your notes.` : "Comment sent." });
      router.refresh();
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="paper stack">
      <h2 style={{ margin: 0 }}>Your feedback for {studentName}</h2>
      <label className="field">Written feedback
        <textarea className="input" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="What went well, what to improve…" />
      </label>

      <section className="stack" style={{ gap: ".5rem" }}>
        <strong>Audio feedback</strong>
        {audio ? <FileView f={audio} onRemove={() => setAudio(null)} /> : <>
          <AudioRecorder compact saving={recSaving} onSave={async (b, name) => {
            setRecSaving(true);
            try { setAudio(await uploadFile(b, name)); } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); } finally { setRecSaving(false); }
          }} />
          <FilePicker accept="audio/*" multiple={false} label="…or upload an audio file" onUploaded={setAudio} />
        </>}
      </section>

      <section className="stack" style={{ gap: ".5rem" }}>
        <div className="spread"><strong>Mistakes & corrections</strong>
          <button type="button" className="btn ghost small" onMouseDown={(e) => e.preventDefault()} onClick={addFromSelection}>＋ Add selected text as correction</button></div>
        {corr.length === 0 && <span className="muted" style={{ fontSize: ".88rem" }}>Highlight words in the student's answer, then add them here — or add an empty row for spoken mistakes.</span>}
        {corr.map((c, i) => (
          <div key={i} className="editor-block" style={{ gap: ".5rem" }}>
            <div className="form-grid">
              <label className="field">Student wrote / said<input className="input" value={c.original} onChange={(e) => setC(i, { original: e.target.value })} /></label>
              <label className="field">Correct form<input className="input" value={c.correction} onChange={(e) => setC(i, { correction: e.target.value })} /></label>
            </div>
            <label className="field">Note (optional)<input className="input" value={c.note} onChange={(e) => setC(i, { note: e.target.value })} /></label>
            <button type="button" className="btn danger small" style={{ justifySelf: "start" }} onClick={() => setCorr((x) => x.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn ghost small" style={{ justifySelf: "start" }} onClick={() => setCorr((c) => [...c, { original: "", correction: "", note: "" }])}>＋ Empty correction row</button>
      </section>

      <div className="form-grid">
        <label className="field">Score (optional, 0–100)
          <input className="input" type="number" min={0} max={100} inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value)} />
        </label>
        <div className="field">Rating (optional)
          <div className="row" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} className="icon-btn" style={{ color: n <= rating ? "var(--gold)" : undefined }} onClick={() => setRating(rating === n ? 0 : n)} aria-label={`${n} stars`}>★</button>
            ))}
          </div>
        </div>
      </div>

      {msg && <div className={`alert ${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</div>}
      <div className="sticky-actions">
        <button className="btn" disabled={busy} onClick={() => send("REVIEWED")}>{busy ? <span className="spinner" /> : "✓"} Mark as reviewed</button>
        <button className="btn ghost" disabled={busy} onClick={() => send("NEEDS_REVISION")}>↺ Request revision</button>
        <button className="btn ghost" disabled={busy} onClick={() => send("COMMENT")}>✉ Comment only</button>
      </div>
    </div>
  );
}
