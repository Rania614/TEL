"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedExpression, ParsedResource, ParsedTask } from "@/lib/import/types";
import { api } from "@/components/client-api";
import { ExpressionChips, ResourcePreviewRow, TaskPreviewCard, resourceState, taskState } from "@/components/import/PreviewCards";

/** Paste a WhatsApp message → same parser as Smart Session Import → editable preview → save into this session. */
export default function OrganizePanel({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<ParsedTask[] | null>(null);
  const [resources, setResources] = useState<ParsedResource[]>([]);
  const [expressions, setExpressions] = useState<ParsedExpression[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function organize() {
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ tasks: ParsedTask[]; resources: ParsedResource[]; expressions: ParsedExpression[] }>("/api/teacher/organize", "POST", { text, sessionId });
      setTasks(r.tasks); setResources(r.resources); setExpressions(r.expressions);
      if (!r.tasks.length) setMsg({ kind: "error", text: "No tasks were found in this message. Add a task by hand instead." });
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); } finally { setBusy(false); }
  }
  async function saveAll() {
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ tasks: number; resources: number; expressions: number }>("/api/teacher/organize/save", "POST", { sessionId, tasks, resources, expressions });
      setMsg({ kind: "ok", text: `Added ${r.tasks} task(s), ${r.resources} resource(s) and ${r.expressions} new expression(s) to this session.` });
      setTasks(null); setText(""); router.refresh();
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); } finally { setBusy(false); }
  }
  const pending = (tasks ?? []).filter((t) => ["review", "missing"].includes(taskState(t))).length + resources.filter((r) => resourceState(r) === "review").length;

  return (
    <details className="editor-block organize">
      <summary>✦ Paste the original WhatsApp message → Organize My Content</summary>
      <p className="muted" style={{ margin: 0 }}>Paste the whole message. It is split into separate tasks and sorted by skill with the same rules as Smart Session Import (no AI). Nothing is saved until you check the preview.</p>
      <textarea className="input" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the message here…" aria-label="Original WhatsApp message" />
      <button type="button" className="btn small" style={{ justifySelf: "start" }} onClick={organize} disabled={busy || !text.trim()}>{busy && !tasks ? <span className="spinner" /> : "✦"} Organize My Content</button>
      {tasks && tasks.length > 0 && (
        <div className="stack">
          <h3 style={{ margin: 0 }}>Proposed tasks ({tasks.length})</h3>
          {tasks.map((t, i) => (
            <TaskPreviewCard key={t.key} task={t} index={i} total={tasks.length}
              onChange={(p) => setTasks(tasks.map((x) => (x.key === t.key ? { ...x, ...p } : x)))}
              onRemove={() => setTasks(tasks.filter((x) => x.key !== t.key))}
              onMove={(d) => { const a = [...tasks]; [a[i], a[i + d]] = [a[i + d], a[i]]; setTasks(a); }} />
          ))}
          {resources.length > 0 && <><h3 style={{ margin: 0 }}>Links ({resources.length})</h3>
            {resources.map((r, i) => <ResourcePreviewRow key={r.key} r={r} tasks={tasks.map((t) => ({ key: t.key, title: t.title }))}
              onChange={(p) => setResources(resources.map((x, j) => (j === i ? { ...x, ...p } : x)))} onRemove={() => setResources(resources.filter((_, j) => j !== i))} />)}</>}
          {expressions.length > 0 && <><h3 style={{ margin: 0 }}>Expressions</h3><ExpressionChips list={expressions} onChange={setExpressions} /></>}
          <div className="row">
            <button type="button" className="btn" onClick={saveAll} disabled={busy || pending > 0}>Add {tasks.filter((t) => t.include).length} task(s) to this session</button>
            {pending > 0 && <span className="muted">{pending} item(s) need your confirmation first.</span>}
          </div>
        </div>
      )}
      {msg && <div className={`alert ${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</div>}
    </details>
  );
}
