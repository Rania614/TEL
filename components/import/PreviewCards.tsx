"use client";
import { useState } from "react";
import type { ParsedExpression, ParsedResource, ParsedTask } from "@/lib/import/types";
import { CATEGORY_LABEL, SKILL_LABEL, SUBMISSION_LABEL, TAG_LABEL } from "@/lib/labels";
import { TAGS, type Skill, type SubmissionType, type Tag } from "@/lib/types";
import { Markdown } from "../Markdown";

const SKILLS: Skill[] = ["SPEAKING", "LISTENING", "READING", "WRITING"];
const TYPES: SubmissionType[] = ["AUDIO", "TEXT", "IMAGE", "FILE"];

export function taskState(t: ParsedTask): "ok" | "review" | "missing" | "off" {
  if (!t.include) return "off";
  if (!t.primarySkill || !t.title.trim()) return "missing";
  if (t.status === "CLASSIFIED" || t.confirmed) return "ok";
  return "review";
}
export function resourceState(r: ParsedResource): "ok" | "review" | "off" {
  if (!r.include) return "off";
  return r.confirmed || r.skill ? "ok" : "review";
}

export function StatusBadge({ state }: { state: "ok" | "review" | "missing" | "off" }) {
  const map = { ok: ["✦", "Classified"], review: ["⚠", "Needs review"], missing: ["○", "Missing info"], off: ["–", "Not imported"] } as const;
  return <span className={`imp-badge imp-${state}`}>{map[state][0]} {map[state][1]}</span>;
}

export function TaskPreviewCard({ task, index, total, onChange, onRemove, onMove, moveTargets, onMoveTo }: {
  task: ParsedTask; index: number; total: number;
  onChange: (patch: Partial<ParsedTask>) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void;
  moveTargets?: { key: string; label: string }[]; onMoveTo?: (sessionKey: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const state = taskState(task);
  const toggleTag = (g: Tag) => onChange({ tags: task.tags.includes(g) ? task.tags.filter((x) => x !== g) : [...task.tags, g] });
  const toggleType = (x: SubmissionType) => onChange({ submissionTypes: task.submissionTypes.includes(x) ? task.submissionTypes.filter((y) => y !== x) : [...task.submissionTypes, x] });
  return (
    <article className={`imp-task imp-${state}`}>
      <div className="imp-task-head">
        <span className="imp-num">{index + 1}</span>
        <input className="input imp-title" value={task.title} onChange={(e) => onChange({ title: e.target.value })} aria-label="Task title" placeholder="Task title" />
        <StatusBadge state={state} />
      </div>
      {task.duplicateOfTaskId && <div className="alert ok">Already in the library — it won’t be imported again unless you tick “Import”.</div>}
      {task.reviewNote && state !== "off" && <div className={`imp-note${state === "ok" ? " resolved" : ""}`}>⚠ {task.reviewNote}</div>}
      <div className="imp-grid">
        <label className="field">Primary skill
          <select className="input" value={task.primarySkill ?? ""} onChange={(e) => onChange({ primarySkill: (e.target.value || null) as Skill | null, confirmed: !!e.target.value })}>
            <option value="">— choose —</option>
            {SKILLS.map((k) => <option key={k} value={k}>{SKILL_LABEL[k]}</option>)}
          </select>
        </label>
        <div className="field">Hand-in type
          <div className="toggle-row">{TYPES.map((x) => (
            <button key={x} type="button" className="toggle" aria-pressed={task.submissionTypes.includes(x)} onClick={() => toggleType(x)}>{SUBMISSION_LABEL[x]}</button>
          ))}</div>
        </div>
      </div>
      <div className="field">Tags
        <div className="toggle-row">{TAGS.map((g) => (
          <button key={g} type="button" className="toggle small" aria-pressed={task.tags.includes(g)} onClick={() => toggleTag(g)}>{TAG_LABEL[g]}</button>
        ))}</div>
      </div>
      <div className="row imp-actions">
        {state === "review" && <button type="button" className="btn small" onClick={() => onChange({ confirmed: true })}>✓ Confirm classification</button>}
        {state === "ok" && task.status !== "CLASSIFIED" && <button type="button" className="btn ghost small" onClick={() => onChange({ confirmed: false })}>Undo confirm</button>}
        {state === "ok" && task.status === "CLASSIFIED" && <button type="button" className="btn ghost small" onClick={() => onChange({ status: "REVIEW", confirmed: false, reviewNote: task.reviewNote || "Marked for review by the teacher." })}>⚠ Mark for review</button>}
        <label className="row" style={{ gap: ".35rem", fontWeight: 700 }}><input type="checkbox" checked={task.include} onChange={(e) => onChange({ include: e.target.checked })} /> Import</label>
        <button type="button" className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">↑</button>
        <button type="button" className="icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down">↓</button>
        {moveTargets && onMoveTo && moveTargets.length > 0 && (
          <select className="input" style={{ width: "auto", minHeight: 38 }} value="" onChange={(e) => e.target.value && onMoveTo(e.target.value)} aria-label="Move to another session">
            <option value="">Move to session…</option>
            {moveTargets.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        )}
        <button type="button" className="btn danger small" onClick={onRemove}>Delete</button>
        <button type="button" className="btn ghost small" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide details" : "Edit text & details"}</button>
      </div>
      {open && (
        <div className="stack imp-detail">
          <label className="field">Instructions (original wording — edit only to fix mistakes)
            <textarea className="input" rows={10} value={task.instructions} onChange={(e) => onChange({ instructions: e.target.value })} />
          </label>
          <label className="field">Questions with answer boxes (one per line)
            <textarea className="input" rows={4} value={task.questions.join("\n")} onChange={(e) => onChange({ questions: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
          </label>
          <label className="field">Required expressions (one per line)
            <textarea className="input" rows={3} value={task.requiredExpressions.join("\n")} onChange={(e) => onChange({ requiredExpressions: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
          </label>
          {task.readingText && <label className="field">Reading passage
            <textarea className="input" rows={5} value={task.readingText} onChange={(e) => onChange({ readingText: e.target.value })} />
          </label>}
          <details className="editor-block"><summary>How students will see the parts ({task.parts.length})</summary>
            <div className="parts">{task.parts.map((p) => (
              <section key={p.id} className={`part part-${p.kind.toLowerCase()}`}>{p.title && <h3 className="part-title">{p.title}</h3>}<Markdown source={p.body} /></section>
            ))}</div>
          </details>
          {task.reasons.length > 0 && <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>Why: {task.reasons.join(" · ")}</p>}
        </div>
      )}
    </article>
  );
}

export function ResourcePreviewRow({ r, tasks, onChange, onRemove }: {
  r: ParsedResource; tasks: { key: string; title: string }[]; onChange: (p: Partial<ParsedResource>) => void; onRemove: () => void;
}) {
  const state = resourceState(r);
  return (
    <div className={`imp-res imp-${state}`}>
      <div className="row" style={{ flexWrap: "nowrap", minWidth: 0 }}>
        <span aria-hidden>{r.type === "YOUTUBE" ? "▶" : "🔗"}</span>
        <input className="input" style={{ minHeight: 38 }} value={r.title} onChange={(e) => onChange({ title: e.target.value })} aria-label="Resource title" />
        <StatusBadge state={state} />
      </div>
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="imp-url">{r.url}</a>
      {r.note && <span className="muted" style={{ fontSize: ".82rem" }}>{r.note}</span>}
      <div className="row">
        <select className="input" style={{ width: "auto", minHeight: 38 }} value={r.skill ?? ""} onChange={(e) => onChange({ skill: (e.target.value || null) as ParsedResource["skill"] })} aria-label="Skill">
          <option value="">General session material</option>
          {SKILLS.map((k) => <option key={k} value={k}>{SKILL_LABEL[k]}</option>)}
          {TAGS.map((g) => <option key={g} value={g}>{TAG_LABEL[g]}</option>)}
        </select>
        <select className="input" style={{ width: "auto", minHeight: 38, maxWidth: 220 }} value={r.taskKey ?? ""} onChange={(e) => onChange({ taskKey: e.target.value || null })} aria-label="Task">
          <option value="">Not linked to a task</option>
          {tasks.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
        </select>
        {state === "review" && <button type="button" className="btn ghost small" onClick={() => onChange({ confirmed: true })}>Keep as general</button>}
        <label className="row" style={{ gap: ".3rem", fontWeight: 700 }}><input type="checkbox" checked={r.include} onChange={(e) => onChange({ include: e.target.checked })} /> Import</label>
        <button type="button" className="btn danger small" onClick={onRemove}>Delete</button>
      </div>
    </div>
  );
}

export function ExpressionChips({ list, onChange }: { list: ParsedExpression[]; onChange: (next: ParsedExpression[]) => void }) {
  if (!list.length) return null;
  return (
    <div className="expr-cloud">
      {list.map((e, i) => (
        <span key={e.key} className={`expr editable${e.include ? "" : " off"}`}>
          <span>{e.text}</span>
          <select value={e.category} onChange={(ev) => onChange(list.map((x, j) => (j === i ? { ...x, category: ev.target.value as ParsedExpression["category"] } : x)))} aria-label={`Category for ${e.text}`}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="button" onClick={() => onChange(list.map((x, j) => (j === i ? { ...x, include: !x.include } : x)))} aria-label={e.include ? "Exclude" : "Include"}>{e.include ? "✕" : "↺"}</button>
        </span>
      ))}
    </div>
  );
}
