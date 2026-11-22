"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ParsedImport, ParsedSession, ParsedTask } from "@/lib/import/types";
import { SKILL_LABEL, fmtDate } from "@/lib/labels";
import { api } from "@/components/client-api";
import { ExpressionChips, ResourcePreviewRow, StatusBadge, TaskPreviewCard, resourceState, taskState } from "@/components/import/PreviewCards";

type Problem = { where: string; problem: string };
type Props = {
  draftId: string; fileName: string; fileId: string | null; status: "DRAFT" | "PUBLISHED"; initial: ParsedImport;
  initialProblems: Problem[]; alreadyImported: { name: string; at: string } | null; sessionLinks: Record<string, string>;
};

const sessionState = (s: ParsedSession) => (!s.include ? "off" : s.titleStatus === "CLASSIFIED" || s.confirmed ? "ok" : s.titleStatus === "MISSING" ? "missing" : "review") as "ok" | "review" | "missing" | "off";

export default function ImportPreview({ draftId, fileName, fileId, status, initial, initialProblems, alreadyImported, sessionLinks }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ParsedImport>(initial);
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(initial.sessions[0]?.key ?? null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  const first = useRef(true);
  const readOnly = status === "PUBLISHED" || !!result;

  useEffect(() => {
    if (first.current || readOnly) { first.current = false; return; }
    setSave("saving");
    const t = setTimeout(async () => {
      try { const r = await api<{ problems: Problem[] }>(`/api/teacher/import/${draftId}`, "PUT", { data }); setProblems(r.problems); setSave("saved"); }
      catch (e) { setSave("error"); setError((e as Error).message); }
    }, 700);
    return () => clearTimeout(t);
  }, [data, draftId, readOnly]);

  const setSession = (key: string, patch: Partial<ParsedSession>) =>
    setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));
  const setTask = (sKey: string, tKey: string, patch: Partial<ParsedTask>) =>
    setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.key !== sKey ? s : { ...s, tasks: s.tasks.map((t) => (t.key === tKey ? { ...t, ...patch } : t)) })) }));

  const all = useMemo(() => {
    const inc = data.sessions.filter((s) => s.include);
    const tasks = inc.flatMap((s) => s.tasks.filter((t) => t.include));
    const res = inc.flatMap((s) => s.resources.filter((r) => r.include));
    return {
      sessions: inc.length, tasks: tasks.length, resources: res.length, expressions: inc.reduce((n, s) => n + s.expressions.filter((e) => e.include).length, 0),
      ok: tasks.filter((t) => taskState(t) === "ok").length, review: tasks.filter((t) => taskState(t) === "review").length + res.filter((r) => resourceState(r) === "review").length + inc.filter((s) => sessionState(s) === "review").length,
      missing: tasks.filter((t) => taskState(t) === "missing").length + inc.filter((s) => sessionState(s) === "missing").length,
      bySkill: (["SPEAKING", "LISTENING", "READING", "WRITING"] as const).map((k) => [k, tasks.filter((t) => t.primarySkill === k).length] as const),
    };
  }, [data]);

  async function publish() {
    setPublishing(true); setError("");
    try {
      const r = await api<Record<string, number>>(`/api/teacher/import/${draftId}/publish`, "POST", { allowSameFile: false });
      setResult(r); router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setPublishing(false); }
  }

  const sessionLabel = (s: ParsedSession) => `Level ${s.levelNumber} · Session ${s.number}`;

  return (
    <div className="stack" style={{ gap: "1.2rem" }}>
      <section className="signboard import-summary">
        <div className="spread">
          <div>
            <span className="hand" style={{ fontSize: "1.3rem", color: "var(--lav-deep)" }}>② Preview & edit · ③ Publish</span>
            <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>📄 {fileName}</h1>
          </div>
          <div className="row">
            {fileId && <a className="btn ghost small" href={`/api/files/${fileId}`}>⇩ Original file</a>}
            {!readOnly && <span className="chip">{save === "saving" ? "Saving…" : save === "error" ? "Not saved" : save === "saved" ? "All changes saved" : "Draft"}</span>}
          </div>
        </div>
        <div className="imp-stats">
          <div><b>{all.sessions}</b><span>sessions</span></div>
          <div><b>{all.tasks}</b><span>tasks</span></div>
          <div><b>{all.resources}</b><span>resources</span></div>
          <div><b>{all.expressions}</b><span>expressions</span></div>
          <div className="s-ok"><b>{all.ok}</b><span>✦ classified tasks</span></div>
          <div className="s-review"><b>{all.review}</b><span>⚠ need review</span></div>
          <div className="s-missing"><b>{all.missing}</b><span>○ missing info</span></div>
        </div>
        <div className="row" style={{ fontSize: ".88rem" }}>
          {all.bySkill.map(([k, n]) => <span key={k} className="chip">{SKILL_LABEL[k]} · {n}</span>)}
          <span className="muted">Organised by rules (no AI). Every line of the document is kept in the task text.</span>
        </div>
        {alreadyImported && <div className="alert error">This exact file was already imported ({alreadyImported.name}, {fmtDate(alreadyImported.at)}). Publishing it again is blocked to prevent duplicates.</div>}
        {result ? (
          <div className="alert ok">
            ✦ Published! {result.sessionsCreated} new session(s), {result.sessionsMatched} matched to existing ({result.sessionsMoved} moved), {result.tasks} tasks, {result.resources} resources, {result.expressions} new expressions.
            {" "}<Link href="/library/sessions">Open the Sessions Archive →</Link>
          </div>
        ) : status === "PUBLISHED" ? (
          <div className="alert ok">✦ This import is published. Its content is now in the library.</div>
        ) : (
          <div className="row">
            <button className="btn" onClick={publish} disabled={publishing || problems.length > 0 || !!alreadyImported || save === "saving"}>
              {publishing ? <span className="spinner" /> : "✦"} Publish to students
            </button>
            <label className="row" style={{ gap: ".35rem", fontWeight: 700 }}><input type="checkbox" checked={onlyAttention} onChange={(e) => setOnlyAttention(e.target.checked)} /> Show only items that need attention</label>
            {problems.length > 0 && <span className="muted">{problems.length} item(s) need your attention before publishing.</span>}
          </div>
        )}
        {error && <div className="alert error" role="alert">{error}</div>}
        {!readOnly && problems.length > 0 && (
          <details className="editor-block"><summary>What still needs attention ({problems.length})</summary>
            <ul style={{ margin: 0, paddingInlineStart: "1.2rem" }}>{problems.slice(0, 60).map((p, i) => <li key={i}><strong>{p.where}:</strong> {p.problem}</li>)}</ul>
          </details>
        )}
      </section>

      <fieldset disabled={readOnly} className="imp-fieldset">
        {data.sessions.map((s) => {
          const st = sessionState(s);
          const needs = s.tasks.some((t) => ["review", "missing"].includes(taskState(t))) || s.resources.some((r) => resourceState(r) === "review") || ["review", "missing"].includes(st);
          if (onlyAttention && !needs) return null;
          const open = openKey === s.key;
          const link = sessionLinks[`${s.levelNumber}:${s.number}`];
          return (
            <section key={s.key} className={`imp-session${s.include ? "" : " excluded"}`}>
              <button type="button" className="imp-session-head" onClick={() => setOpenKey(open ? null : s.key)} aria-expanded={open}>
                <span className="imp-lvl">L{s.levelNumber}·S{s.number}</span>
                <span className="imp-stitle">{s.title || <em className="muted">Untitled session</em>}</span>
                <span className="muted" style={{ fontSize: ".85rem" }}>{s.tasks.filter((t) => t.include).length} tasks · {s.resources.filter((r) => r.include).length} resources</span>
                {s.action === "SKIP_EXISTING" && <span className="imp-badge imp-ok">↔ already in library</span>}
                <StatusBadge state={needs && st === "ok" ? "review" : st} />
                {link && <Link href={`/library/sessions/${link}`} onClick={(e) => e.stopPropagation()} className="chip">Open →</Link>}
                <span className="imp-caret" aria-hidden>{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="stack imp-session-body">
                  {s.notes.map((n, i) => <div key={i} className="imp-note">⚠ {n}</div>)}
                  {s.matchSessionId && (
                    <div className="alert ok">
                      This session matches <strong>“{s.matchTitle}”</strong>, which is already in the library (with any student work on it).
                      {" "}It will be linked and moved to {sessionLabel(s)}, not created twice. Tasks that already exist are switched off.
                      <label className="row" style={{ gap: ".35rem", marginTop: ".4rem" }}>
                        <input type="checkbox" checked={s.action === "CREATE"} onChange={(e) => setSession(s.key, { action: e.target.checked ? "CREATE" : "SKIP_EXISTING" })} /> Create it as a separate new session instead
                      </label>
                    </div>
                  )}
                  <div className="imp-grid">
                    <label className="field">Session title
                      <input className="input" value={s.title} onChange={(e) => setSession(s.key, { title: e.target.value, titleStatus: e.target.value.trim() ? "CLASSIFIED" : "MISSING" })} placeholder={`Session ${s.number}`} />
                    </label>
                    <div className="form-grid">
                      <label className="field">Level<input className="input" type="number" min={1} value={s.levelNumber} onChange={(e) => setSession(s.key, { levelNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })} /></label>
                      <label className="field">Session no.<input className="input" type="number" min={1} value={s.number} onChange={(e) => setSession(s.key, { number: Math.max(1, parseInt(e.target.value, 10) || 1) })} /></label>
                    </div>
                  </div>
                  <div className="row">
                    {st !== "ok" && st !== "off" && <button type="button" className="btn small" onClick={() => setSession(s.key, { confirmed: true })}>✓ Accept {s.title ? "this title" : `“Session ${s.number}”`}</button>}
                    <label className="row" style={{ gap: ".35rem", fontWeight: 700 }}><input type="checkbox" checked={s.include} onChange={(e) => setSession(s.key, { include: e.target.checked })} /> Import this session</label>
                  </div>
                  {s.description && <details className="editor-block"><summary>Session introduction (from the document)</summary><p style={{ whiteSpace: "pre-line", margin: 0 }}>{s.description}</p></details>}

                  <h3 style={{ margin: ".4rem 0 0" }}>Resources ({s.resources.length})</h3>
                  {!s.resources.length && <span className="muted">No links in this session.</span>}
                  {s.resources.some((r) => resourceState(r) === "review") && (
                    <button type="button" className="btn ghost small" style={{ justifySelf: "start" }}
                      onClick={() => setSession(s.key, { resources: s.resources.map((r) => (r.skill ? r : { ...r, confirmed: true })) })}>Keep all unassigned links as general session materials</button>
                  )}
                  {s.resources.map((r, i) => (
                    <ResourcePreviewRow key={r.key} r={r} tasks={s.tasks.map((t) => ({ key: t.key, title: t.title }))}
                      onChange={(p) => setSession(s.key, { resources: s.resources.map((x, j) => (j === i ? { ...x, ...p } : x)) })}
                      onRemove={() => confirm("Delete this link from the import?") && setSession(s.key, { resources: s.resources.filter((_, j) => j !== i) })} />
                  ))}

                  <h3 style={{ margin: ".4rem 0 0" }}>Tasks ({s.tasks.length})</h3>
                  {s.tasks.map((t, i) => {
                    const st2 = taskState(t);
                    if (onlyAttention && !["review", "missing"].includes(st2)) return null;
                    return (
                      <TaskPreviewCard key={t.key} task={t} index={i} total={s.tasks.length}
                        onChange={(p) => setTask(s.key, t.key, p)}
                        onRemove={() => confirm(`Delete “${t.title}” from the import?`) && setSession(s.key, { tasks: s.tasks.filter((x) => x.key !== t.key) })}
                        onMove={(dir) => { const arr = [...s.tasks]; const j = i + dir; [arr[i], arr[j]] = [arr[j], arr[i]]; setSession(s.key, { tasks: arr }); }}
                        moveTargets={data.sessions.filter((x) => x.key !== s.key).map((x) => ({ key: x.key, label: `${sessionLabel(x)} ${x.title}` }))}
                        onMoveTo={(target) => setData((d) => ({ ...d, sessions: d.sessions.map((x) => x.key === s.key ? { ...x, tasks: x.tasks.filter((y) => y.key !== t.key) } : x.key === target ? { ...x, tasks: [...x.tasks, t] } : x) }))}
                      />
                    );
                  })}

                  {s.expressions.length > 0 && <>
                    <h3 style={{ margin: ".4rem 0 0" }}>Expressions for the vault ({s.expressions.filter((e) => e.include).length})</h3>
                    <p className="muted" style={{ margin: 0, fontSize: ".85rem" }}>Taken from the tasks’ “use these” lists. The document gives no meanings, so none are added. Choose a category if you know it.</p>
                    <ExpressionChips list={s.expressions} onChange={(next) => setSession(s.key, { expressions: next })} />
                  </>}
                </div>
              )}
            </section>
          );
        })}
      </fieldset>

      <details className="paper">
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>Lines not turned into content ({data.skipped.length})</summary>
        <p className="muted">These are template or marker lines. Every other line of the document is kept in a session or task.</p>
        <ul style={{ fontSize: ".88rem" }}>{data.skipped.map((x, i) => <li key={i}><code>{x.line}</code> — {x.reason}</li>)}</ul>
      </details>
    </div>
  );
}
