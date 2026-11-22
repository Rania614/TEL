"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Draft, FileAsset, Task, TaskStatus, Achievement, Submission } from "@/lib/types";
import { fmtClock, youtubeId } from "@/lib/labels";
import { api, celebrate, uploadFile } from "@/components/client-api";
import { AudioRecorder } from "@/components/AudioRecorder";
import { FilePicker } from "@/components/FilePicker";
import { FileView, YouTubeCard } from "@/components/Media";
import { WritingDeskArt, ListeningArt, ReadingArt } from "@/components/art/Scenes";

type Props = { task: Task; status: TaskStatus; draft: Draft | null; draftFiles: FileAsset[]; glossary: Record<string, string>; media?: { title: string; url: string | null }[] };

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function Workspace({ task, status, draft, draftFiles, glossary, media = [] }: Props) {
  const router = useRouter();
  const [text, setText] = useState(draft?.text ?? "");
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>(draft?.answers ?? {});
  const [files, setFiles] = useState<FileAsset[]>(draftFiles);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(draft?.updatedAt ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [recSaving, setRecSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const dirty = useRef(false);
  const first = useRef(true);

  const payload = () => ({ text, notes, answers, fileIds: files.map((f) => f.id) });

  async function saveDraft(silent = false) {
    setSaveState("saving");
    try {
      const d = await api<Draft>(`/api/tasks/${task.id}/draft`, "PUT", payload());
      dirty.current = false; setSaveState("saved"); setSavedAt(d.updatedAt);
      if (!silent) setMsg({ kind: "ok", text: "Draft saved. You can come back to it any time." });
    } catch (e) { setSaveState("error"); setMsg({ kind: "error", text: `Draft not saved: ${(e as Error).message}` }); }
  }

  // autosave 1.5 s after the last change
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    dirty.current = true;
    const t = setTimeout(() => saveDraft(true), 1500);
    return () => clearTimeout(t);
  }, [text, notes, answers, files]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  async function submit() {
    setMsg(null); setSubmitting(true);
    try {
      const r = await api<{ submission: Submission; granted: Achievement[] }>(`/api/tasks/${task.id}/submit`, "POST", payload());
      dirty.current = false;
      celebrate(r.granted);
      setMsg({ kind: "ok", text: `Submitted as version ${r.submission.version}. Rabeha will see it on her desk. Your answer stays here — you can keep improving it.` });
      router.refresh();
      setTimeout(() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" }), 400);
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); }
    finally { setSubmitting(false); }
  }

  async function keepRecording(b: Blob, name: string) {
    setRecSaving(true); setMsg(null);
    try { const f = await uploadFile(b, name); setFiles((cur) => [...cur, f]); setMsg({ kind: "ok", text: "Recording saved to your draft. Listen to it below, then submit when you're happy." }); }
    catch (e) { setMsg({ kind: "error", text: `Recording not saved: ${(e as Error).message}` }); }
    finally { setRecSaving(false); }
  }

  const removeFile = (id: string) => setFiles((cur) => cur.filter((f) => f.id !== id));
  const addFile = (f: FileAsset) => setFiles((cur) => [...cur, f]);
  const audioFiles = files.filter((f) => f.kind === "AUDIO");
  const otherFiles = files.filter((f) => f.kind !== "AUDIO");

  // What the student hands in is driven by the task's submission types (set on import or by Rabeha).
  const types = task.submissionTypes?.length ? task.submissionTypes : task.skill === "SPEAKING" ? ["AUDIO"] : task.skill === "WRITING" ? ["TEXT", "IMAGE"] : ["TEXT"];
  const wantAudio = types.includes("AUDIO");
  const wantText = types.includes("TEXT");
  const wantImage = types.includes("IMAGE");
  const wantFile = types.includes("FILE");
  const answerBoxes = wantText && task.questions.length > 0;
  const mainText = wantText && (task.skill === "WRITING" || !answerBoxes);
  const audioOnly = types.length === 1 && wantAudio;
  const canSubmit = !submitting && (!audioOnly || audioFiles.length > 0);
  const resubmit = status === "SUBMITTED" || status === "REVIEWED" || status === "NEEDS_REVISION";
  const accept = [wantImage && "image/jpeg,image/png,image/webp", (wantFile || wantImage) && "application/pdf"].filter(Boolean).join(",");
  const mediaList = [...(task.mediaUrl ? [{ title: "Listening material", url: task.mediaUrl }] : []), ...media];

  return (
    <div className="paper stack" style={{ paddingBottom: 0, scrollMarginTop: "90px" }} id="workspace">
      <div className="spread">
        <h2 style={{ margin: 0 }}>{task.skill === "SPEAKING" ? "🎙 The recording corner" : task.skill === "WRITING" ? "✒ The writing desk" : task.skill === "LISTENING" ? "🎧 The listening room" : "📖 The reading nook"}</h2>
        <SaveBadge state={saveState} savedAt={savedAt} />
      </div>
      {task.skill === "WRITING" && <WritingDeskArt />}
      {task.skill === "LISTENING" && <ListeningArt />}
      {task.skill === "READING" && <ReadingArt />}

      {task.skill === "LISTENING" && (mediaList.length ? mediaList.map((m, i) => m.url && (
        youtubeId(m.url)
          ? <YouTubeCard key={i} m={{ title: m.title, description: "", url: m.url }} />
          : /\.(mp3|m4a|wav|ogg|webm)(\?|$)/i.test(m.url) ? <audio key={i} controls src={m.url} /> : <a key={i} className="btn ghost" href={m.url} target="_blank" rel="noopener noreferrer">Open listening material ↗</a>
      )) : <div className="empty">No listening video or audio is linked to this task yet.</div>)}

      {task.readingText && (
        <Block title="Read">
          <ReadingText text={task.readingText} words={task.highlightWords} glossary={glossary} />
        </Block>
      )}

      {task.skill === "SPEAKING" && (
        <Block title="Ideas notebook (draft — only you see this until you submit)">
          <textarea className="notebook" style={{ minHeight: 200 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Plan what you want to say…" aria-label="Ideas notebook" />
        </Block>
      )}

      {answerBoxes && (
        <Block title={task.skill === "WRITING" ? "Your answers" : "Questions"}>
          {task.questions.map((q, i) => (
            <label key={q.id} className="field">
              <span>{i + 1}. {q.prompt}</span>
              <textarea className="input" rows={2} value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
            </label>
          ))}
        </Block>
      )}

      {mainText && (
        <Block title={<span className="spread" style={{ width: "100%" }}><span>{task.skill === "WRITING" ? "Your writing" : "Your answer"}</span><span className="muted" style={{ fontWeight: 400 }}>{words(text)} words</span></span>}>
          <textarea className="notebook" style={{ minHeight: task.skill === "WRITING" ? 300 : 180 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write here…" aria-label="Your answer" />
        </Block>
      )}
      {answerBoxes && task.skill === "READING" && (
        <Block title="Notes (optional)">
          <textarea className="notebook" style={{ minHeight: 140 }} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes" />
        </Block>
      )}

      {wantAudio && <>
        <AudioRecorder onSave={keepRecording} saving={recSaving} />
        <FilePicker accept="audio/*" label="…or upload an existing audio file (MP3, M4A, WAV, OGG, WEBM)" onUploaded={addFile} />
        {audioFiles.length > 0 && <Block title={`Recordings ready to submit (${audioFiles.length})`}>
          <div className="file-list">{audioFiles.map((f) => <FileView key={f.id} f={f} onRemove={() => removeFile(f.id)} />)}</div>
        </Block>}
      </>}

      {(accept || otherFiles.length > 0) && (
        <Block title={wantImage ? "…or upload a photo of your notebook" : "Attach a file"}>
          {accept && <FilePicker accept={accept} label={wantImage ? "Upload JPG, PNG or PDF" : "Upload a PDF"} onUploaded={addFile} />}
          {otherFiles.length > 0 && <div className="file-list">{otherFiles.map((f) => <FileView key={f.id} f={f} onRemove={() => removeFile(f.id)} />)}</div>}
        </Block>
      )}

      {msg && <div className={`alert ${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</div>}

      <div className="sticky-actions">
        <button type="button" className="btn ghost" onClick={() => saveDraft()} disabled={saveState === "saving"}>💾 Save draft</button>
        <button type="button" className="btn" onClick={submit} disabled={!canSubmit}>
          {submitting ? <span className="spinner" /> : "✉"} {resubmit ? "Submit new version" : "Submit to Rabeha"}
        </button>
        {audioOnly && audioFiles.length === 0 && <span className="muted" style={{ fontSize: ".85rem" }}>Record or upload audio to submit.</span>}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <section className="stack" style={{ gap: ".5rem" }}><h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex" }}>{title}</h3>{children}</section>;
}

function SaveBadge({ state, savedAt }: { state: string; savedAt: string | null }) {
  const label = state === "saving" ? "Saving…" : state === "error" ? "Not saved" : savedAt ? `Draft saved ${fmtClock(savedAt)}` : "No draft yet";
  return <span className="chip" aria-live="polite">{state === "saving" && <span className="spinner" style={{ width: 12, height: 12 }} />}{label}</span>;
}

function ReadingText({ text, words, glossary }: { text: string; words: string[]; glossary: Record<string, string> }) {
  const parts = useMemo(() => {
    const list = words.filter(Boolean).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!list.length) return [text];
    return text.split(new RegExp(`\\b(${list.join("|")})\\b`, "gi"));
  }, [text, words]);
  const set = new Set(words.map((w) => w.toLowerCase()));
  return (
    <div className="reading-text">
      {parts.map((p, i) => set.has(p.toLowerCase())
        ? <mark key={i} className="hl" title={glossary[p.toLowerCase()] ?? "Key word"} tabIndex={0}>{p}</mark>
        : <span key={i} style={{ whiteSpace: "pre-wrap" }}>{p}</span>)}
    </div>
  );
}
