import type { Database, ExpressionEntry, LearningMaterial, Level, Session, Task } from "../types";
import type { ParsedImport, ParsedResource, ParsedSession, ParsedTask, ParsedExpression } from "./types";
import { normTitle } from "./parse";

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();

function similar(a: string, b: string) {
  const x = normTitle(a), y = normTitle(b);
  if (!x || !y) return false;
  return x === y || (x.length >= 8 && y.includes(x)) || (y.length >= 8 && x.includes(y));
}
function videoKey(url: string | null | undefined) {
  if (!url) return "";
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] ?? url.replace(/[?#].*$/, "");
}

/** Link parsed content to what is already in the library (sessions + duplicate tasks). */
export function matchAgainstLibrary(db: Database, data: ParsedImport) {
  for (const ps of data.sessions) {
    let best: { s: Session; hits: number } | null = null;
    for (const s of db.sessions) {
      const existing = db.tasks.filter((t) => t.sessionId === s.id);
      const hits = ps.tasks.filter((pt) => existing.some((et) => similar(pt.title, et.title))).length;
      if (hits && (!best || hits > best.hits)) best = { s, hits };
    }
    if (best) {
      ps.matchSessionId = best.s.id;
      ps.matchTitle = best.s.title;
      ps.action = "SKIP_EXISTING";
      if (!ps.title) { ps.title = best.s.title; ps.titleStatus = "CLASSIFIED"; ps.notes = ps.notes.filter((n) => !/has no title/.test(n)); ps.notes.push("Title taken from the matching session already in the library."); }
      const existing = db.tasks.filter((t) => t.sessionId === best!.s.id);
      for (const pt of ps.tasks) {
        const dup = existing.find((et) => similar(pt.title, et.title));
        if (dup) { pt.duplicateOfTaskId = dup.id; pt.include = false; }
      }
      const urls = new Set(db.materials.filter((m) => m.sessionId === best!.s.id).map((m) => videoKey(m.url)));
      for (const r of ps.resources) if (urls.has(videoKey(r.url))) { r.include = false; r.note = "Already in this session — skipped."; }
    }
  }
  return data;
}

export const taskResolved = (t: ParsedTask) => !t.include || (!!t.primarySkill && !!t.title.trim() && (t.status === "CLASSIFIED" || t.confirmed));
export const resourceResolved = (r: ParsedResource) => !r.include || r.confirmed || r.skill !== null;
export const sessionResolved = (s: ParsedSession & { confirmed?: boolean }) => !s.include || s.titleStatus === "CLASSIFIED" || !!s.confirmed;

export interface PublishProblem { where: string; problem: string }

export function validate(db: Database, data: ParsedImport): PublishProblem[] {
  const out: PublishProblem[] = [];
  const included = data.sessions.filter((s) => s.include);
  if (!included.length) out.push({ where: "Import", problem: "No sessions are selected for publishing." });
  for (const s of included) {
    const where = `Level ${s.levelNumber} · Session ${s.number}`;
    if (!sessionResolved(s)) out.push({ where, problem: "Session title needs review." });
    for (const t of s.tasks) if (!taskResolved(t)) out.push({ where: `${where} · ${t.title || "untitled task"}`, problem: !t.primarySkill ? "Choose a primary skill." : !t.title.trim() ? "Add a title." : "Classification needs your confirmation." });
    for (const r of s.resources) if (!resourceResolved(r)) out.push({ where: `${where} · ${r.title}`, problem: "Assign the resource to a skill or keep it as a general material." });
  }
  // slot conflicts (after planned moves)
  const taken = new Map<string, string>();
  const movedIds = new Set(included.filter((s) => s.action === "SKIP_EXISTING" && s.matchSessionId).map((s) => s.matchSessionId!));
  for (const s of db.sessions) if (!movedIds.has(s.id)) {
    const lv = db.levels.find((l) => l.id === s.levelId)?.number ?? 0;
    taken.set(`${lv}:${s.number}`, `“${s.title}” (already in the library)`);
  }
  for (const s of included) {
    const k = `${s.levelNumber}:${s.number}`;
    if (taken.has(k)) out.push({ where: `Level ${s.levelNumber} · Session ${s.number}`, problem: `This slot is already used by ${taken.get(k)}. Change the session number or level.` });
    else taken.set(k, `“${s.title || `Session ${s.number}`}” in this import`);
  }
  return out;
}

function toTask(pt: ParsedTask, sessionId: string, order: number, sourceDocumentId: string | null): Task {
  return {
    id: rid(), sessionId, title: pt.title.trim(), instructions: pt.instructions, skill: pt.primarySkill!,
    tags: pt.tags, parts: pt.parts.map((p) => ({ ...p, id: p.id || rid() })), requiredExpressions: pt.requiredExpressions,
    submissionTypes: pt.submissionTypes.length ? pt.submissionTypes : ["TEXT"], sourceDocumentId,
    classificationNote: pt.confirmed ? "Confirmed by the teacher during import." : pt.reasons.join("; "),
    difficulty: null, durationMin: 0, dueDate: null,
    questions: pt.questions.map((q, i) => ({ id: `q${i + 1}`, prompt: q })), readingText: pt.readingText, highlightWords: [],
    mediaUrl: null, attachmentIds: [], order, createdAt: now(),
  };
}

/** Adds parsed tasks/resources/expressions to an existing session. Returns counts. */
export function addContentToSession(db: Database, sessionId: string, tasks: ParsedTask[], resources: ParsedResource[], expressions: ParsedExpression[], sourceDocumentId: string | null) {
  const keyToId = new Map<string, string>();
  let order = db.tasks.filter((t) => t.sessionId === sessionId).length;
  let tCount = 0, rCount = 0, eCount = 0;
  for (const pt of tasks) {
    if (!pt.include) continue;
    const t = toTask(pt, sessionId, order++, sourceDocumentId);
    db.tasks.push(t); keyToId.set(pt.key, t.id); tCount++;
  }
  const existingUrls = new Set(db.materials.filter((m) => m.sessionId === sessionId).map((m) => videoKey(m.url)));
  for (const r of resources) {
    if (!r.include || existingUrls.has(videoKey(r.url))) continue;
    const m: LearningMaterial = {
      id: rid(), sessionId, sectionId: null, taskId: r.taskKey ? keyToId.get(r.taskKey) ?? null : null, skill: r.skill,
      type: r.type, title: r.title.trim() || r.url, description: "", url: r.url, fileId: null, createdAt: now(),
    };
    db.materials.push(m); existingUrls.add(videoKey(r.url)); rCount++;
  }
  for (const e of expressions) {
    if (!e.include || !e.text.trim()) continue;
    const found = db.expressions.find((x) => x.expression.trim().toLowerCase() === e.text.trim().toLowerCase());
    if (found) { if (!found.sessionIds.includes(sessionId)) found.sessionIds.push(sessionId); continue; }
    const entry: ExpressionEntry = { id: rid(), expression: e.text.trim(), meaning: "", example: "", category: e.category, sessionIds: [sessionId], createdAt: now() };
    db.expressions.push(entry); eCount++;
  }
  return { tasks: tCount, resources: rCount, expressions: eCount };
}

function levelFor(db: Database, n: number): Level {
  let l = db.levels.find((x) => x.number === n);
  if (!l) { l = { id: rid(), number: n, title: `Level ${n}`, createdAt: now() }; db.levels.push(l); }
  return l;
}

export function publishImport(db: Database, data: ParsedImport, sourceDocumentId: string | null) {
  const stats = { sessionsCreated: 0, sessionsMatched: 0, sessionsMoved: 0, tasks: 0, resources: 0, expressions: 0 };
  const included = data.sessions.filter((s) => s.include);
  // 1) moves of matched sessions first, so freed slots can be reused
  for (const ps of included) {
    if (ps.action !== "SKIP_EXISTING" || !ps.matchSessionId) continue;
    const s = db.sessions.find((x) => x.id === ps.matchSessionId);
    if (!s) { ps.action = "CREATE"; continue; }
    const lv = levelFor(db, ps.levelNumber);
    if (s.levelId !== lv.id || s.number !== ps.number) { s.levelId = lv.id; s.number = ps.number; stats.sessionsMoved++; }
    if (ps.lessonTitle && !s.lessonTitle) s.lessonTitle = ps.lessonTitle;
    s.updatedAt = now();
    stats.sessionsMatched++;
  }
  // 2) content
  for (const ps of included) {
    let sessionId: string;
    if (ps.action === "SKIP_EXISTING" && ps.matchSessionId && db.sessions.some((x) => x.id === ps.matchSessionId)) sessionId = ps.matchSessionId;
    else {
      const lv = levelFor(db, ps.levelNumber);
      const s: Session = {
        id: rid(), levelId: lv.id, number: ps.number, title: ps.title.trim() || `Session ${ps.number}`, lessonTitle: ps.lessonTitle,
        description: ps.description, objectives: [], published: true, sourceDocumentId, createdAt: now(), updatedAt: now(),
      };
      db.sessions.push(s); sessionId = s.id; stats.sessionsCreated++;
    }
    const c = addContentToSession(db, sessionId, ps.tasks, ps.resources, ps.expressions, sourceDocumentId);
    stats.tasks += c.tasks; stats.resources += c.resources; stats.expressions += c.expressions;
  }
  return stats;
}
