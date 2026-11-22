"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client-api";
import type { Session } from "@/lib/types";

const DEFAULT_SECTIONS = ["SPEAKING", "READING", "LISTENING", "WRITING", "GRAMMAR", "VOCABULARY", "PHONICS", "IDIOMS", "PHRASAL_VERBS", "GAMES_VIDEOS"];
const LABEL: Record<string, string> = { SPEAKING: "Speaking", READING: "Reading", LISTENING: "Listening", WRITING: "Writing", GRAMMAR: "Grammar", VOCABULARY: "Vocabulary", PHONICS: "Phonics & Pronunciation", IDIOMS: "Idioms", PHRASAL_VERBS: "Phrasal Verbs", GAMES_VIDEOS: "Games & Videos" };

type L = { id: string; number: number; title: string; next: number };
export default function NewSession({ levels }: { levels: L[] }) {
  const router = useRouter();
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const [number, setNumber] = useState(String(levels[0]?.next ?? 1));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<string[]>(["SPEAKING", "VOCABULARY", "IDIOMS", "PHRASAL_VERBS"]);
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const s = await api<Session>("/api/teacher/sessions", "POST", { levelId, number: Number(number), title, description, published });
      for (const [i, skill] of DEFAULT_SECTIONS.filter((x) => sections.includes(x)).entries()) {
        await api("/api/teacher/sections", "POST", { sessionId: s.id, skill, title: LABEL[skill], body: "", order: i });
      }
      router.push(`/teacher/sessions/${s.id}`);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return (
    <form className="paper stack" onSubmit={create}>
      <h2 style={{ margin: 0 }}>＋ New session</h2>
      <div className="form-grid">
        <label className="field">Level
          <select className="input" value={levelId} onChange={(e) => { setLevelId(e.target.value); setNumber(String(levels.find((l) => l.id === e.target.value)?.next ?? 1)); }}>
            {levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </label>
        <label className="field">Number<input className="input" type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} required /></label>
        <label className="field">Title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
      </div>
      <label className="field">Description<textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: ".4rem" }}>Content sections</legend>
        <div className="row">{DEFAULT_SECTIONS.map((s) => (
          <label key={s} className="chip" style={{ cursor: "pointer", minHeight: 36 }}>
            <input type="checkbox" checked={sections.includes(s)} onChange={(e) => setSections(e.target.checked ? [...sections, s] : sections.filter((x) => x !== s))} /> {LABEL[s]}
          </label>
        ))}</div>
      </fieldset>
      <label className="row" style={{ gap: ".5rem" }}><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Visible to students now</label>
      {error && <div className="alert error" role="alert">{error}</div>}
      <button className="btn" disabled={busy || !title.trim() || !levelId}>{busy && <span className="spinner" />} Create session</button>
      <NewLevel next={levels.reduce((n, l) => Math.max(n, l.number), 0) + 1} />
    </form>
  );
}

function NewLevel({ next }: { next: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="row" style={{ borderTop: "2px dashed var(--lav-mist)", paddingTop: ".8rem" }}>
      <span className="muted">Need another level?</span>
      <button type="button" className="btn ghost small" disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        try { await api("/api/teacher/levels", "POST", { number: next }); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
      }}>＋ Add Level {next}</button>
      {err && <span className="alert error">{err}</span>}
    </div>
  );
}
