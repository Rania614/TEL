"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ExpressionEntry, FileAsset, LearningMaterial, Session, SessionSection, Task, VocabularyEntry } from "@/lib/types";
import { api } from "@/components/client-api";
import { FilePicker } from "@/components/FilePicker";
import { FileView } from "@/components/Media";
import { SKILL_LABEL, CATEGORY_LABEL, TAG_LABEL, SUBMISSION_LABEL, PART_STYLE } from "@/lib/labels";
import { TAGS, type PartKind, type SubmissionType, type Tag, type TaskPart } from "@/lib/types";
import OrganizePanel from "./OrganizePanel";

type Props = {
  session: Session; sections: SessionSection[]; materials: LearningMaterial[]; tasks: Task[];
  vocabulary: VocabularyEntry[]; expressions: ExpressionEntry[]; files: FileAsset[];
  otherVocabulary: VocabularyEntry[]; otherExpressions: ExpressionEntry[];
  levels: { id: string; title: string }[];
};

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  async function run(fn: () => Promise<unknown>, ok = "Saved.") {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ kind: "ok", text: ok }); router.refresh(); return true; }
    catch (e) { setMsg({ kind: "error", text: (e as Error).message }); return false; }
    finally { setBusy(false); }
  }
  const note = msg && <div className={`alert ${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</div>;
  return { busy, run, note };
}

const Section = ({ title, children, count }: { title: string; children: ReactNode; count?: number }) => (
  <section className="paper stack"><h2 style={{ margin: 0 }}>{title}{count !== undefined && <span className="muted" style={{ fontSize: "1rem" }}> ({count})</span>}</h2>{children}</section>
);

export default function SessionEditor(p: Props) {
  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <DetailsForm s={p.session} levels={p.levels} />
      <Section title="Content sections" count={p.sections.length}>
        {p.sections.map((s) => <SectionForm key={s.id} sessionId={p.session.id} s={s} />)}
        <SectionForm sessionId={p.session.id} />
      </Section>
      <Section title="Learning materials" count={p.materials.length}>
        {p.materials.map((m) => <MaterialRow key={m.id} m={m} file={p.files.find((f) => f.id === m.fileId)} sections={p.sections} tasks={p.tasks} />)}
        <MaterialForm sessionId={p.session.id} sections={p.sections} tasks={p.tasks} />
      </Section>
      <Section title="Tasks" count={p.tasks.length}>
        {p.tasks.map((x) => <TaskForm key={x.id} sessionId={p.session.id} t={x} files={p.files} />)}
        <TaskForm sessionId={p.session.id} files={p.files} />
        <OrganizePanel sessionId={p.session.id} />
      </Section>
      <Section title="Vocabulary" count={p.vocabulary.length}>
        {p.vocabulary.map((v) => <VocabForm key={v.id} sessionId={p.session.id} v={v} />)}
        <VocabForm sessionId={p.session.id} />
        <LinkExisting sessionId={p.session.id} entity="vocabulary" options={p.otherVocabulary.map((v) => ({ id: v.id, label: v.word, sessionIds: v.sessionIds }))} />
      </Section>
      <Section title="Idioms, phrasal verbs & expressions" count={p.expressions.length}>
        {p.expressions.map((e) => <ExprForm key={e.id} sessionId={p.session.id} e={e} />)}
        <ExprForm sessionId={p.session.id} />
        <LinkExisting sessionId={p.session.id} entity="expressions" options={p.otherExpressions.map((e) => ({ id: e.id, label: `${e.expression} (${CATEGORY_LABEL[e.category]})`, sessionIds: e.sessionIds }))} />
      </Section>
      <DangerZone s={p.session} />
    </div>
  );
}

function DetailsForm({ s, levels }: { s: Session; levels: { id: string; title: string }[] }) {
  const a = useAction();
  const [f, setF] = useState({ levelId: s.levelId, lessonTitle: s.lessonTitle ?? "", number: String(s.number), title: s.title, description: s.description, objectives: s.objectives.join("\n"), published: s.published });
  return (
    <form className="paper stack" onSubmit={(e) => { e.preventDefault(); a.run(() => api(`/api/teacher/sessions/${s.id}`, "PUT", { ...f, number: Number(f.number), objectives: f.objectives.split("\n").map((x) => x.trim()).filter(Boolean) })); }}>
      <h2 style={{ margin: 0 }}>Session details</h2>
      <div className="form-grid">
        <label className="field">Level<select className="input" value={f.levelId} onChange={(e) => setF({ ...f, levelId: e.target.value })}>{levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
        <label className="field">Number<input className="input" type="number" min={1} value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></label>
        <label className="field">Title<input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="field">Lesson title (optional)<input className="input" value={f.lessonTitle} onChange={(e) => setF({ ...f, lessonTitle: e.target.value })} /></label>
      </div>
      <label className="field">Description<textarea className="input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <label className="field">Learning objectives (one per line)<textarea className="input" rows={4} value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></label>
      <label className="row" style={{ gap: ".5rem" }}><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Visible to students</label>
      {a.note}
      <button className="btn" style={{ justifySelf: "start" }} disabled={a.busy}>Save details</button>
    </form>
  );
}

const SECTION_SKILLS = ["SPEAKING", "READING", "LISTENING", "WRITING", "GRAMMAR", "VOCABULARY", "PHONICS", "IDIOMS", "PHRASAL_VERBS", "GAMES_VIDEOS"];

function SectionForm({ sessionId, s }: { sessionId: string; s?: SessionSection }) {
  const a = useAction();
  const [f, setF] = useState({ skill: s?.skill ?? "GRAMMAR", title: s?.title ?? "", body: s?.body ?? "", order: String(s?.order ?? 99) });
  const save = () => a.run(async () => {
    const body = { ...f, sessionId, title: f.title || SKILL_LABEL[f.skill], order: Number(f.order) };
    if (s) await api(`/api/teacher/sections/${s.id}`, "PUT", body);
    else { await api("/api/teacher/sections", "POST", body); setF({ skill: "GRAMMAR", title: "", body: "", order: "99" }); }
  }, s ? "Section saved." : "Section added.");
  return (
    <details className="editor-block" open={!s ? false : undefined}>
      <summary>{s ? `${SKILL_LABEL[s.skill]}${s.title && s.title !== SKILL_LABEL[s.skill] ? ` — ${s.title}` : ""}${s.body.trim() ? "" : " (empty)"}` : "＋ Add a section"}</summary>
      <div className="form-grid">
        <label className="field">Skill<select className="input" value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value as SessionSection["skill"] })}>{SECTION_SKILLS.map((k) => <option key={k} value={k}>{SKILL_LABEL[k]}</option>)}</select></label>
        <label className="field">Heading<input className="input" value={f.title} placeholder={SKILL_LABEL[f.skill]} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="field">Order<input className="input" type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></label>
      </div>
      <label className="field">Content — supports ## headings, - lists, **bold**, *italic*, &gt; quotes and [links](https://…)
        <textarea className="input" rows={8} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </label>
      {a.note}
      <div className="row">
        <button type="button" className="btn small" onClick={save} disabled={a.busy}>{s ? "Save section" : "Add section"}</button>
        {s && <button type="button" className="btn danger small" disabled={a.busy} onClick={() => confirm("Delete this section? Its materials stay in the session.") && a.run(() => api(`/api/teacher/sections/${s.id}`, "DELETE"), "Deleted.")}>Delete</button>}
      </div>
    </details>
  );
}

const MAT_TYPES = ["YOUTUBE", "LINK", "AUDIO", "PDF", "IMAGE", "DOCUMENT"] as const;
const MAT_LABEL: Record<string, string> = { YOUTUBE: "YouTube video", LINK: "Web link", AUDIO: "Audio file", PDF: "PDF", IMAGE: "Image", DOCUMENT: "Other document" };

const SKILL_OPTIONS = [["", "General session material"], ...(["SPEAKING", "LISTENING", "READING", "WRITING"] as const).map((k) => [k, SKILL_LABEL[k]]), ...TAGS.map((g) => [g, TAG_LABEL[g]])];
function MaterialRow({ m, file, sections, tasks }: { m: LearningMaterial; file?: FileAsset; sections: SessionSection[]; tasks: Task[] }) {
  const a = useAction();
  const sec = sections.find((s) => s.id === m.sectionId);
  return (
    <div className="editor-block">
      <div className="spread"><strong>{MAT_LABEL[m.type]} · {m.title}</strong><span className="muted" style={{ fontSize: ".85rem" }}>{sec ? `in ${SKILL_LABEL[sec.skill]}` : "no section"}</span></div>
      {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: "anywhere" }}>{m.url}</a>}
      {file && <FileView f={file} />}
      <div className="row">
        <select className="input" style={{ width: "auto", minHeight: 38 }} value={m.skill ?? ""} aria-label="Skill" onChange={(e) => a.run(() => api(`/api/teacher/materials/${m.id}`, "PUT", { skill: e.target.value || null }), "Skill updated.")}>
          {SKILL_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className="input" style={{ width: "auto", minHeight: 38, maxWidth: 240 }} value={m.taskId ?? ""} aria-label="Task" onChange={(e) => a.run(() => api(`/api/teacher/materials/${m.id}`, "PUT", { taskId: e.target.value || null }), "Task link updated.")}>
          <option value="">Not linked to a task</option>{tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <button className="btn danger small" disabled={a.busy} onClick={() => confirm("Remove this material?") && a.run(() => api(`/api/teacher/materials/${m.id}`, "DELETE"), "Removed.")}>Remove</button>
      </div>
      {a.note}
    </div>
  );
}

function MaterialForm({ sessionId, sections, tasks }: { sessionId: string; sections: SessionSection[]; tasks: Task[] }) {
  const a = useAction();
  const empty = { type: "YOUTUBE" as string, title: "", description: "", url: "", sectionId: "", skill: "", taskId: "" };
  const [f, setF] = useState(empty);
  const [file, setFile] = useState<FileAsset | null>(null);
  const needsFile = ["AUDIO", "PDF", "IMAGE", "DOCUMENT"].includes(f.type);
  return (
    <details className="editor-block">
      <summary>＋ Add a material (video, link, PDF, audio, image)</summary>
      <div className="form-grid">
        <label className="field">Type<select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{MAT_TYPES.map((k) => <option key={k} value={k}>{MAT_LABEL[k]}</option>)}</select></label>
        <label className="field">Title<input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="field">Skill / category<select className="input" value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value })}>{SKILL_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="field">Linked task<select className="input" value={f.taskId} onChange={(e) => setF({ ...f, taskId: e.target.value })}><option value="">— none —</option>{tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      </div>
      <label className="field">Short description<input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      {needsFile ? (file ? <FileView f={file} onRemove={() => setFile(null)} /> : <FilePicker multiple={false} accept={f.type === "AUDIO" ? "audio/*" : f.type === "PDF" ? "application/pdf" : f.type === "IMAGE" ? "image/*" : "*/*"} label="Upload the file" onUploaded={setFile} />)
        : <label className="field">Link (https://…)<input className="input" type="url" dir="ltr" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></label>}
      {needsFile && <label className="field">…or a link instead<input className="input" type="url" dir="ltr" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></label>}
      {a.note}
      <button type="button" className="btn small" style={{ justifySelf: "start" }} disabled={a.busy}
        onClick={async () => { if (await a.run(() => api("/api/teacher/materials", "POST", { ...f, sessionId, sectionId: f.sectionId || null, skill: f.skill || null, taskId: f.taskId || null, url: f.url || null, fileId: file?.id ?? null }), "Material added.")) { setF(empty); setFile(null); } }}>Add material</button>
    </details>
  );
}

const PART_KINDS: PartKind[] = ["INTRO", "SITUATION", "PART", "QUESTIONS", "LANGUAGE", "EXAMPLE", "CHALLENGE", "SUBMISSION", "READING", "TEXT"];
const SUB_TYPES: SubmissionType[] = ["AUDIO", "TEXT", "IMAGE", "FILE"];

function TaskForm({ sessionId, t, files }: { sessionId: string; t?: Task; files: FileAsset[] }) {
  const a = useAction();
  const init = () => ({
    title: t?.title ?? "", skill: t?.skill ?? "WRITING", difficulty: (t?.difficulty ?? "") as string,
    durationMin: t?.durationMin ? String(t.durationMin) : "", dueDate: t?.dueDate?.slice(0, 10) ?? "", instructions: t?.instructions ?? "",
    questions: (t?.questions ?? []).map((q) => q.prompt).join("\n"), readingText: t?.readingText ?? "",
    highlightWords: (t?.highlightWords ?? []).join(", "), mediaUrl: t?.mediaUrl ?? "",
    requiredExpressions: (t?.requiredExpressions ?? []).join("\n"),
  });
  const [f, setF] = useState(init);
  const [tags, setTags] = useState<Tag[]>(t?.tags ?? []);
  const defaultTypes = (k: string): SubmissionType[] => (k === "SPEAKING" ? ["AUDIO"] : k === "WRITING" ? ["TEXT", "IMAGE"] : ["TEXT"]);
  const [types, setTypes] = useState<SubmissionType[]>(t?.submissionTypes ?? defaultTypes("WRITING"));
  const [parts, setParts] = useState<TaskPart[]>(t?.parts ?? []);
  const [attach, setAttach] = useState<FileAsset[]>(files.filter((x) => t?.attachmentIds.includes(x.id)));
  const [suggesting, setSuggesting] = useState(false);
  const set = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function suggest() {
    setSuggesting(true);
    try {
      const r = await api<{ tasks: { primarySkill: Task["skill"] | null; tags: Tag[]; submissionTypes: SubmissionType[] }[] }>("/api/teacher/organize", "POST", { text: `${f.title}\n${f.instructions}`, sessionId });
      const s = r.tasks[0];
      if (s) { if (s.primarySkill) setF((x) => ({ ...x, skill: s.primarySkill! })); setTags(s.tags); setTypes(s.submissionTypes); }
    } catch { /* suggestions are optional */ } finally { setSuggesting(false); }
  }

  const save = () => a.run(async () => {
    const prompts = f.questions.split("\n").map((x) => x.trim()).filter(Boolean);
    const body = {
      ...f, sessionId, durationMin: f.durationMin ? Number(f.durationMin) : 0, dueDate: f.dueDate ? new Date(f.dueDate).toISOString() : null,
      difficulty: f.difficulty || null, mediaUrl: f.mediaUrl || null, tags, submissionTypes: types, parts,
      questions: prompts.map((prompt, i) => ({ id: t?.questions[i]?.prompt === prompt ? t.questions[i].id : undefined, prompt })),
      highlightWords: f.highlightWords.split(",").map((x) => x.trim()).filter(Boolean),
      requiredExpressions: f.requiredExpressions.split("\n").map((x) => x.trim()).filter(Boolean),
      attachmentIds: attach.map((x) => x.id),
    };
    if (t) await api(`/api/teacher/tasks/${t.id}`, "PUT", body);
    else { await api("/api/teacher/tasks", "POST", body); setF(init()); setAttach([]); setParts([]); setTags([]); setTypes(defaultTypes("WRITING")); }
  }, t ? "Task saved." : "Task created.");

  const setPart = (i: number, p: Partial<TaskPart>) => setParts(parts.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <details className="editor-block">
      <summary>{t ? `${SKILL_LABEL[t.skill]} · ${t.title}` : "＋ Create a task by hand"}</summary>
      <div className="form-grid">
        <label className="field">Title<input className="input" value={f.title} onChange={set("title")} /></label>
        <label className="field">Primary skill<select className="input" value={f.skill} onChange={(e) => { setF({ ...f, skill: e.target.value as Task["skill"] }); if (!t) setTypes(defaultTypes(e.target.value)); }}>{["SPEAKING", "LISTENING", "READING", "WRITING"].map((k) => <option key={k} value={k}>{SKILL_LABEL[k]}</option>)}</select></label>
        <label className="field">Difficulty (optional)<select className="input" value={f.difficulty} onChange={set("difficulty")}><option value="">—</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="CHALLENGING">Challenging</option></select></label>
        <label className="field">Minutes (optional)<input className="input" type="number" min={1} value={f.durationMin} onChange={set("durationMin")} /></label>
        <label className="field">Due date (optional)<input className="input" type="date" value={f.dueDate} onChange={set("dueDate")} /></label>
      </div>
      <div className="field">Secondary tags
        <div className="toggle-row">{TAGS.map((g) => <button key={g} type="button" className="toggle small" aria-pressed={tags.includes(g)} onClick={() => setTags(tags.includes(g) ? tags.filter((x) => x !== g) : [...tags, g])}>{TAG_LABEL[g]}</button>)}</div>
      </div>
      <div className="field">Submission type
        <div className="toggle-row">{SUB_TYPES.map((x) => <button key={x} type="button" className="toggle" aria-pressed={types.includes(x)} onClick={() => setTypes(types.includes(x) ? types.filter((y) => y !== x) : [...types, x])}>{SUBMISSION_LABEL[x]}</button>)}</div>
      </div>
      <label className="field">Instructions (original wording; ## headings, - lists, **bold**)<textarea className="input" rows={8} value={f.instructions} onChange={set("instructions")} /></label>
      <button type="button" className="btn ghost small" style={{ justifySelf: "start" }} onClick={suggest} disabled={suggesting || !f.instructions.trim()}>{suggesting ? <span className="spinner" /> : "✦"} Suggest skill, tags & submission type from the instructions</button>

      <div className="field">Task parts (shown to students as separate cards; leave empty to show the instructions as they are)
        <div className="stack" style={{ gap: ".5rem" }}>
          {parts.map((p, i) => (
            <div key={p.id} className="part-edit">
              <div className="row">
                <select className="input" style={{ width: "auto", minHeight: 38 }} value={p.kind} onChange={(e) => setPart(i, { kind: e.target.value as PartKind })}>{PART_KINDS.map((k) => <option key={k} value={k}>{PART_STYLE[k].icon} {PART_STYLE[k].label || "Text"}</option>)}</select>
                <input className="input" style={{ flex: 1, minHeight: 38 }} placeholder="Heading (optional)" value={p.title} onChange={(e) => setPart(i, { title: e.target.value })} />
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => { const arr = [...parts]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setParts(arr); }} aria-label="Move up">↑</button>
                <button type="button" className="btn danger small" onClick={() => setParts(parts.filter((_, j) => j !== i))}>Remove</button>
              </div>
              <textarea className="input" rows={3} value={p.body} onChange={(e) => setPart(i, { body: e.target.value })} />
            </div>
          ))}
          <button type="button" className="btn ghost small" style={{ justifySelf: "start" }} onClick={() => setParts([...parts, { id: Math.random().toString(36).slice(2), kind: "QUESTIONS", title: "", body: "" }])}>＋ Add a part (questions, challenge, useful language…)</button>
        </div>
      </div>
      <label className="field">Questions with answer boxes (one per line)<textarea className="input" rows={3} value={f.questions} onChange={set("questions")} /></label>
      <label className="field">Required expressions (one per line)<textarea className="input" rows={3} value={f.requiredExpressions} onChange={set("requiredExpressions")} /></label>
      {f.skill === "LISTENING" && <label className="field">Audio / video link (YouTube or audio URL)<input className="input" dir="ltr" value={f.mediaUrl} onChange={set("mediaUrl")} /></label>}
      {f.skill === "READING" && <>
        <label className="field">Reading passage<textarea className="input" rows={6} value={f.readingText} onChange={set("readingText")} /></label>
        <label className="field">Words to highlight (comma-separated — meanings come from the Vocabulary Vault)<input className="input" value={f.highlightWords} onChange={set("highlightWords")} /></label>
      </>}
      <strong style={{ fontSize: ".92rem" }}>Attached resources for students</strong>
      {attach.length > 0 && <div className="file-list">{attach.map((x) => <FileView key={x.id} f={x} onRemove={() => setAttach(attach.filter((y) => y.id !== x.id))} />)}</div>}
      <FilePicker accept="audio/*,image/*,application/pdf" label="Attach audio, images or PDFs" onUploaded={(x) => setAttach((cur) => [...cur, x])} />
      {a.note}
      <div className="row">
        <button type="button" className="btn small" onClick={save} disabled={a.busy || !f.title.trim()}>{t ? "Save task" : "Create task"}</button>
        {t && <button type="button" className="btn danger small" disabled={a.busy} onClick={() => confirm("Delete this task AND all student submissions and feedback for it? This cannot be undone.") && a.run(() => api(`/api/teacher/tasks/${t.id}`, "DELETE"), "Task deleted.")}>Delete task</button>}
      </div>
    </details>
  );
}

function VocabForm({ sessionId, v }: { sessionId: string; v?: VocabularyEntry }) {
  const a = useAction();
  const init = () => ({ word: v?.word ?? "", meaning: v?.meaning ?? "", example: v?.example ?? "", pronunciation: v?.pronunciation ?? "", related: (v?.relatedWords ?? []).join(", ") });
  const [f, setF] = useState(init);
  const save = () => a.run(async () => {
    const body = { word: f.word, meaning: f.meaning, example: f.example, pronunciation: f.pronunciation, relatedWords: f.related.split(",").map((x) => x.trim()).filter(Boolean), sessionIds: v ? v.sessionIds : [sessionId] };
    if (v) await api(`/api/teacher/vocabulary/${v.id}`, "PUT", body);
    else { await api("/api/teacher/vocabulary", "POST", body); setF(init()); }
  }, v ? "Word saved." : "Word added.");
  return (
    <details className="editor-block">
      <summary>{v ? `${v.word} — ${v.meaning.slice(0, 60)}` : "＋ Add a word"}</summary>
      <div className="form-grid">
        <label className="field">Word<input className="input" value={f.word} onChange={(e) => setF({ ...f, word: e.target.value })} /></label>
        <label className="field">Pronunciation<input className="input" value={f.pronunciation} onChange={(e) => setF({ ...f, pronunciation: e.target.value })} placeholder="/ˈwɜːd/" /></label>
      </div>
      <label className="field">Meaning<input className="input" value={f.meaning} onChange={(e) => setF({ ...f, meaning: e.target.value })} /></label>
      <label className="field">Example sentence<input className="input" value={f.example} onChange={(e) => setF({ ...f, example: e.target.value })} /></label>
      <label className="field">Related words (comma-separated)<input className="input" value={f.related} onChange={(e) => setF({ ...f, related: e.target.value })} /></label>
      {a.note}
      <div className="row">
        <button type="button" className="btn small" onClick={save} disabled={a.busy || !f.word.trim()}>{v ? "Save" : "Add word"}</button>
        {v && v.sessionIds.length > 1 && <button type="button" className="btn ghost small" disabled={a.busy} onClick={() => a.run(() => api(`/api/teacher/vocabulary/${v.id}`, "PUT", { sessionIds: v.sessionIds.filter((x) => x !== sessionId) }), "Removed from this session.")}>Remove from this session</button>}
        {v && <button type="button" className="btn danger small" disabled={a.busy} onClick={() => confirm(`Delete “${v.word}” from every session?`) && a.run(() => api(`/api/teacher/vocabulary/${v.id}`, "DELETE"), "Deleted.")}>Delete</button>}
      </div>
    </details>
  );
}

function ExprForm({ sessionId, e }: { sessionId: string; e?: ExpressionEntry }) {
  const a = useAction();
  const init = () => ({ expression: e?.expression ?? "", meaning: e?.meaning ?? "", example: e?.example ?? "", category: e?.category ?? "IDIOM" });
  const [f, setF] = useState(init);
  const save = () => a.run(async () => {
    const body = { ...f, sessionIds: e ? e.sessionIds : [sessionId] };
    if (e) await api(`/api/teacher/expressions/${e.id}`, "PUT", body);
    else { await api("/api/teacher/expressions", "POST", body); setF(init()); }
  }, e ? "Expression saved." : "Expression added.");
  return (
    <details className="editor-block">
      <summary>{e ? `${CATEGORY_LABEL[e.category]} · ${e.expression}` : "＋ Add an idiom / phrasal verb / expression"}</summary>
      <div className="form-grid">
        <label className="field">Expression<input className="input" value={f.expression} onChange={(x) => setF({ ...f, expression: x.target.value })} /></label>
        <label className="field">Category<select className="input" value={f.category} onChange={(x) => setF({ ...f, category: x.target.value as ExpressionEntry["category"] })}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      </div>
      <label className="field">Meaning<input className="input" value={f.meaning} onChange={(x) => setF({ ...f, meaning: x.target.value })} /></label>
      <label className="field">Example in context<input className="input" value={f.example} onChange={(x) => setF({ ...f, example: x.target.value })} /></label>
      {a.note}
      <div className="row">
        <button type="button" className="btn small" onClick={save} disabled={a.busy || !f.expression.trim()}>{e ? "Save" : "Add expression"}</button>
        {e && e.sessionIds.length > 1 && <button type="button" className="btn ghost small" disabled={a.busy} onClick={() => a.run(() => api(`/api/teacher/expressions/${e.id}`, "PUT", { sessionIds: e.sessionIds.filter((x) => x !== sessionId) }), "Removed from this session.")}>Remove from this session</button>}
        {e && <button type="button" className="btn danger small" disabled={a.busy} onClick={() => confirm(`Delete “${e.expression}” from every session?`) && a.run(() => api(`/api/teacher/expressions/${e.id}`, "DELETE"), "Deleted.")}>Delete</button>}
      </div>
    </details>
  );
}

function LinkExisting({ sessionId, entity, options }: { sessionId: string; entity: "vocabulary" | "expressions"; options: { id: string; label: string; sessionIds: string[] }[] }) {
  const a = useAction();
  const [id, setId] = useState("");
  if (!options.length) return null;
  const pick = options.find((o) => o.id === id);
  return (
    <div className="editor-block">
      <strong>Reuse an entry from another session</strong>
      <div className="row">
        <select className="input" style={{ flex: "1 1 220px", width: "auto" }} value={id} onChange={(e) => setId(e.target.value)} aria-label="Existing entry">
          <option value="">Choose…</option>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button type="button" className="btn small" disabled={!pick || a.busy}
          onClick={async () => { if (pick && await a.run(() => api(`/api/teacher/${entity}/${pick.id}`, "PUT", { sessionIds: [...pick.sessionIds, sessionId] }), "Linked to this session.")) setId(""); }}>Link to this session</button>
      </div>
      {a.note}
    </div>
  );
}

function DangerZone({ s }: { s: Session }) {
  const a = useAction();
  const router = useRouter();
  return (
    <section className="panel stack">
      <h3 style={{ margin: 0 }}>Delete session</h3>
      <p className="muted" style={{ margin: 0 }}>Removes the session, its sections, materials, tasks and every student submission for those tasks. Earned rewards stay with the students.</p>
      {a.note}
      <button className="btn danger" style={{ justifySelf: "start" }} disabled={a.busy}
        onClick={async () => { if (confirm(`Delete Session ${s.number} and all its student work? This cannot be undone.`) && await a.run(() => api(`/api/teacher/sessions/${s.id}`, "DELETE"), "Deleted.")) router.push("/teacher/sessions"); }}>
        Delete Session {s.number}
      </button>
    </section>
  );
}
