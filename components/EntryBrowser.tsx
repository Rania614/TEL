"use client";
import { useMemo, useState } from "react";
import { api, celebrate } from "./client-api";
import type { Achievement, StudentEntryState } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/labels";

export type EntryRow = {
  id: string; title: string; meaning: string; example: string; pronunciation?: string; related?: string[];
  category?: string; sessions: { id: string; label: string }[]; createdAt: string;
  state: { learned: boolean; favorite: boolean; note: string };
};

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = 0.9;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch { /* not supported */ }
}

export function EntryBrowser({ rows, entryType, canEdit, categories }: {
  rows: EntryRow[]; entryType: "VOCAB" | "EXPRESSION"; canEdit: boolean; categories?: string[];
}) {
  const [items, setItems] = useState(rows);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [session, setSession] = useState("");
  const [show, setShow] = useState<"all" | "learned" | "todo" | "fav">("all");
  const [sort, setSort] = useState<"az" | "new" | "session">("session");
  const [error, setError] = useState("");
  const sessions = useMemo(() => [...new Map(rows.flatMap((r) => r.sessions).map((s) => [s.id, s])).values()], [rows]);

  const visible = items
    .filter((r) => !q || `${r.title} ${r.meaning} ${r.example}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => !cat || r.category === cat)
    .filter((r) => !session || r.sessions.some((s) => s.id === session))
    .filter((r) => show === "all" || (show === "learned" ? r.state.learned : show === "todo" ? !r.state.learned : r.state.favorite))
    .sort((a, b) => sort === "az" ? a.title.localeCompare(b.title) : sort === "new" ? b.createdAt.localeCompare(a.createdAt) : (a.sessions[0]?.label ?? "").localeCompare(b.sessions[0]?.label ?? ""));

  async function update(id: string, patch: Partial<EntryRow["state"]>) {
    setError("");
    const before = items;
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, state: { ...r.state, ...patch } } : r)));
    try {
      const r = await api<{ state: StudentEntryState; granted: Achievement[] }>("/api/entries", "PUT", { entryType, entryId: id, ...patch });
      celebrate(r.granted);
    } catch (e) { setItems(before); setError((e as Error).message); }
  }

  return (
    <>
      <div className="toolbar dark-form">
        <input className="input" type="search" placeholder="Search words, meanings, examples…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        {categories ? (
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        ) : (
          <select className="input" value={session} onChange={(e) => setSession(e.target.value)} aria-label="Session">
            <option value="">All sessions</option>{sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
        <select className="input" value={show} onChange={(e) => setShow(e.target.value as typeof show)} aria-label="Filter" disabled={canEdit}>
          <option value="all">All entries</option><option value="todo">Still learning</option><option value="learned">Learned</option><option value="fav">Favourites</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
          <option value="session">Sort: by session</option><option value="az">Sort: A–Z</option><option value="new">Sort: newest</option>
        </select>
      </div>
      {error && <div className="alert error" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
      <p className="muted" style={{ fontSize: ".88rem" }}>{visible.length} of {items.length} entries{!canEdit && ` · ${items.filter((r) => r.state.learned).length} learned`}</p>
      {visible.length === 0 ? <div className="empty"><span className="glyph">🔍</span>Nothing matches these filters.</div> : (
        <div className="grid-3">
          {visible.map((r) => (
            <article key={r.id} className={`card entry${r.state.learned ? " learned" : ""}`}>
              <div className="spread" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="word">{r.title}</div>
                  <div className="row" style={{ gap: ".35rem" }}>
                    {r.pronunciation && <span className="ipa">{r.pronunciation}</span>}
                    <button className="icon-btn" style={{ minWidth: 32, minHeight: 32, fontSize: ".9rem" }} onClick={() => speak(r.title)} aria-label={`Hear “${r.title}”`}>🔊</button>
                  </div>
                </div>
                {!canEdit && (
                  <div className="row" style={{ gap: ".3rem" }}>
                    <button className="icon-btn" aria-pressed={r.state.favorite} onClick={() => update(r.id, { favorite: !r.state.favorite })} aria-label="Favourite">★</button>
                    <button className="icon-btn" aria-pressed={r.state.learned} onClick={() => update(r.id, { learned: !r.state.learned })} aria-label="Mark as learned">✓</button>
                  </div>
                )}
              </div>
              {r.category && <span className="chip" style={{ justifySelf: "start" }}>{CATEGORY_LABEL[r.category]}</span>}
              {r.meaning ? <p style={{ margin: 0 }}>{r.meaning}</p> : <p className="muted" style={{ margin: 0, fontSize: ".88rem" }}>Meaning not given in the course material yet.</p>}
              {r.example && <p className="ex" style={{ margin: 0 }}>{r.example}</p>}
              {r.related && r.related.length > 0 && <p className="muted" style={{ margin: 0, fontSize: ".85rem" }}>Related: {r.related.join(", ")}</p>}
              <div className="meta">{r.sessions.map((s) => <span key={s.id} className="chip">📖 {s.label}</span>)}</div>
              {!canEdit && <NoteField value={r.state.note} onSave={(note) => update(r.id, { note })} />}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function NoteField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const [open, setOpen] = useState(!!value);
  if (!open) return <button className="btn ghost small" style={{ justifySelf: "start" }} onClick={() => setOpen(true)}>✎ Add my note</button>;
  return (
    <label className="field" style={{ fontWeight: 400 }}>
      <span className="muted" style={{ fontSize: ".8rem" }}>My note (saved when you click away)</span>
      <textarea className="input hand" rows={2} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} />
    </label>
  );
}
