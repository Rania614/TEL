import { HttpError } from "./auth";
import { newId, now } from "./store";
import type { Database } from "./types";

type Obj = Record<string, unknown>;
const str = (v: unknown, max = 20000) => (typeof v === "string" ? v.slice(0, max) : undefined);
const oneOf = <T extends string>(v: unknown, opts: readonly T[]) => (opts.includes(v as T) ? (v as T) : undefined);
const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => (x as string).slice(0, 500)) : undefined);
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : typeof v === "string" && v.trim() && !isNaN(+v) ? Math.round(+v) : undefined);
const clean = (o: Obj) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const SECTION_SKILLS = ["SPEAKING", "READING", "LISTENING", "WRITING", "GRAMMAR", "VOCABULARY", "PHONICS", "IDIOMS", "PHRASAL_VERBS", "GAMES_VIDEOS"] as const;
const SKILLS = ["SPEAKING", "LISTENING", "READING", "WRITING"] as const;
const DIFF = ["EASY", "MEDIUM", "CHALLENGING"] as const;
const MAT = ["YOUTUBE", "LINK", "AUDIO", "PDF", "IMAGE", "DOCUMENT"] as const;
const CAT = ["IDIOM", "PHRASAL_VERB", "COLLOCATION", "COMPOUND_NOUN", "EXPRESSION"] as const;
const TAGS = ["GRAMMAR", "VOCABULARY", "PHONICS", "IDIOMS", "PHRASAL_VERBS", "COLLOCATIONS", "GAMES", "VIDEOS", "EXTRA"] as const;
const SUB_TYPES = ["AUDIO", "TEXT", "IMAGE", "FILE"] as const;
const PART_KINDS = ["INTRO", "SITUATION", "PART", "QUESTIONS", "LANGUAGE", "EXAMPLE", "CHALLENGE", "SUBMISSION", "READING", "TEXT"] as const;
const oneOfArr = <T extends string>(v: unknown, opts: readonly T[]) => (Array.isArray(v) ? [...new Set(v.filter((x) => opts.includes(x as T)))] as T[] : undefined);

type Entity = keyof typeof ENTITIES;

function sessionIdsOk(db: Database, ids: string[] | undefined) {
  return ids?.filter((id) => db.sessions.some((s) => s.id === id));
}

export const ENTITIES = {
  levels: {
    table: "levels",
    pick: (b: Obj) => clean({ number: int(b.number), title: str(b.title, 120) }),
    create: (db: Database, d: Obj) => {
      const number = (d.number as number) ?? db.levels.reduce((n, l) => Math.max(n, l.number), 0) + 1;
      if (db.levels.some((l) => l.number === number)) throw new HttpError(400, `Level ${number} already exists.`);
      return { id: newId(), title: (d.title as string) || `Level ${number}`, createdAt: now(), ...d, number };
    },
  },
  sessions: {
    table: "sessions",
    pick: (b: Obj) => clean({
      number: int(b.number), levelId: str(b.levelId, 64), lessonTitle: str(b.lessonTitle, 200), title: str(b.title, 200), description: str(b.description),
      objectives: strArr(b.objectives), published: typeof b.published === "boolean" ? b.published : undefined,
    }),
    create: (db: Database, d: Obj) => {
      const levelId = (d.levelId as string) || db.levels[0]?.id;
      if (!db.levels.some((l) => l.id === levelId)) throw new HttpError(400, "Choose a level.");
      const inLevel = db.sessions.filter((s) => s.levelId === levelId);
      const number = (d.number as number) ?? inLevel.reduce((n, s) => Math.max(n, s.number), 0) + 1;
      if (inLevel.some((s) => s.number === number)) throw new HttpError(400, `Session ${number} already exists in this level.`);
      return { id: newId(), title: (d.title as string) || `Session ${number}`, description: "", objectives: [], published: true, sourceDocumentId: null, createdAt: now(), updatedAt: now(), ...d, number, levelId };
    },
  },
  sections: {
    table: "sections",
    pick: (b: Obj) => clean({ sessionId: str(b.sessionId, 64), skill: oneOf(b.skill, SECTION_SKILLS), title: str(b.title, 200), body: str(b.body), order: int(b.order) }),
    create: (db: Database, d: Obj) => {
      if (!db.sessions.some((s) => s.id === d.sessionId)) throw new HttpError(400, "Unknown session.");
      if (!d.skill) throw new HttpError(400, "Choose a skill for the section.");
      return { id: newId(), title: "", body: "", order: db.sections.filter((s) => s.sessionId === d.sessionId).length, ...d };
    },
  },
  materials: {
    table: "materials",
    pick: (b: Obj) => clean({
      sessionId: b.sessionId === null ? null : str(b.sessionId, 64), sectionId: b.sectionId === null ? null : str(b.sectionId, 64),
      type: oneOf(b.type, MAT), title: str(b.title, 300), description: str(b.description, 2000),
      url: b.url === null ? null : str(b.url, 2000), fileId: b.fileId === null ? null : str(b.fileId, 64),
      taskId: b.taskId === null || b.taskId === "" ? null : str(b.taskId, 64),
      skill: b.skill === null || b.skill === "" ? null : oneOf(b.skill, [...SKILLS, ...TAGS] as const),
    }),
    create: (db: Database, d: Obj) => {
      if (!d.type || !d.title) throw new HttpError(400, "A material needs a type and a title.");
      if (d.url && !/^https?:\/\//.test(d.url as string)) throw new HttpError(400, "Links must start with http:// or https://");
      if (!d.url && !d.fileId) throw new HttpError(400, "Add a link or upload a file.");
      return { id: newId(), sessionId: null, sectionId: null, taskId: null, skill: null, description: "", url: null, fileId: null, createdAt: now(), ...d };
    },
  },
  tasks: {
    table: "tasks",
    pick: (b: Obj) => clean({
      sessionId: str(b.sessionId, 64), title: str(b.title, 300), instructions: str(b.instructions, 50000),
      skill: oneOf(b.skill, SKILLS), tags: oneOfArr(b.tags, TAGS), submissionTypes: oneOfArr(b.submissionTypes, SUB_TYPES),
      requiredExpressions: strArr(b.requiredExpressions),
      parts: Array.isArray(b.parts)
        ? (b.parts as Obj[]).filter((p) => p && (str(p.body) || str(p.title))).map((p) => ({ id: str(p.id, 40) || newId(), kind: oneOf(p.kind, PART_KINDS) ?? "TEXT", title: str(p.title, 200) ?? "", body: str(p.body, 20000) ?? "" }))
        : undefined,
      difficulty: b.difficulty === null || b.difficulty === "" ? null : oneOf(b.difficulty, DIFF), durationMin: int(b.durationMin),
      dueDate: b.dueDate === null || b.dueDate === "" ? null : str(b.dueDate, 40),
      questions: Array.isArray(b.questions)
        ? (b.questions as Obj[]).filter((q) => typeof q?.prompt === "string" && (q.prompt as string).trim())
            .map((q) => ({ id: (str(q.id, 40) || newId()), prompt: (q.prompt as string).slice(0, 2000) }))
        : undefined,
      readingText: str(b.readingText, 50000), highlightWords: strArr(b.highlightWords),
      mediaUrl: b.mediaUrl === null || b.mediaUrl === "" ? null : str(b.mediaUrl, 2000),
      attachmentIds: strArr(b.attachmentIds), order: int(b.order),
    }),
    create: (db: Database, d: Obj) => {
      if (!db.sessions.some((s) => s.id === d.sessionId)) throw new HttpError(400, "Unknown session.");
      if (!d.title || !d.skill) throw new HttpError(400, "A task needs a title and a skill.");
      return {
        id: newId(), instructions: "", tags: [], parts: [], requiredExpressions: [], submissionTypes: [d.skill === "SPEAKING" ? "AUDIO" : "TEXT"], sourceDocumentId: null,
        difficulty: null, durationMin: 0, dueDate: null,
        questions: [], readingText: "", highlightWords: [], mediaUrl: null, attachmentIds: [],
        order: db.tasks.filter((t) => t.sessionId === d.sessionId).length, createdAt: now(), ...d,
      };
    },
  },
  vocabulary: {
    table: "vocabulary",
    pick: (b: Obj) => clean({ word: str(b.word, 200), meaning: str(b.meaning, 2000), example: str(b.example, 2000), pronunciation: str(b.pronunciation, 200), relatedWords: strArr(b.relatedWords), sessionIds: strArr(b.sessionIds) }),
    create: (db: Database, d: Obj) => {
      if (!d.word || !d.meaning) throw new HttpError(400, "A word needs the word and its meaning.");
      return { id: newId(), example: "", pronunciation: "", relatedWords: [], createdAt: now(), ...d, sessionIds: sessionIdsOk(db, d.sessionIds as string[]) ?? [] };
    },
  },
  expressions: {
    table: "expressions",
    pick: (b: Obj) => clean({ expression: str(b.expression, 300), meaning: str(b.meaning, 2000), example: str(b.example, 2000), category: oneOf(b.category, CAT), sessionIds: strArr(b.sessionIds) }),
    create: (db: Database, d: Obj) => {
      if (!d.expression || !d.category) throw new HttpError(400, "An expression needs its text and a category.");
      return { id: newId(), meaning: "", example: "", createdAt: now(), ...d, sessionIds: sessionIdsOk(db, d.sessionIds as string[]) ?? [] };
    },
  },
} as const;

export function entityOf(name: string): (typeof ENTITIES)[Entity] {
  const e = (ENTITIES as Record<string, (typeof ENTITIES)[Entity]>)[name];
  if (!e) throw new HttpError(404, "Unknown collection.");
  return e;
}

/** Cascade deletes for the demo store (Prisma does this via onDelete: Cascade). */
export function removeEntity(db: Database, name: string, id: string) {
  const list = (db as unknown as Record<string, { id: string }[]>)[entityOf(name).table];
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) throw new HttpError(404, "Not found.");
  if (name === "levels" && db.sessions.some((s) => s.levelId === id)) throw new HttpError(400, "Move or delete this level's sessions first.");
  list.splice(i, 1);
  if (name === "sessions") {
    const taskIds = new Set(db.tasks.filter((t) => t.sessionId === id).map((t) => t.id));
    const subIds = new Set(db.submissions.filter((s) => taskIds.has(s.taskId)).map((s) => s.id));
    db.sections = db.sections.filter((s) => s.sessionId !== id);
    db.materials = db.materials.filter((m) => m.sessionId !== id);
    db.tasks = db.tasks.filter((t) => t.sessionId !== id);
    db.drafts = db.drafts.filter((d) => !taskIds.has(d.taskId));
    db.submissions = db.submissions.filter((s) => !subIds.has(s.id));
    db.feedback = db.feedback.filter((f) => !subIds.has(f.submissionId));
    for (const v of db.vocabulary) v.sessionIds = v.sessionIds.filter((s) => s !== id);
    for (const e of db.expressions) e.sessionIds = e.sessionIds.filter((s) => s !== id);
  }
  if (name === "tasks") {
    const subIds = new Set(db.submissions.filter((s) => s.taskId === id).map((s) => s.id));
    db.drafts = db.drafts.filter((d) => d.taskId !== id);
    db.submissions = db.submissions.filter((s) => s.taskId !== id);
    db.feedback = db.feedback.filter((f) => !subIds.has(f.submissionId));
  }
  if (name === "sections") for (const m of db.materials) if (m.sectionId === id) m.sectionId = null;
  if (name === "tasks") for (const m of db.materials) if (m.taskId === id) m.taskId = null;
  if (name === "vocabulary" || name === "expressions") {
    const type = name === "vocabulary" ? "VOCAB" : "EXPRESSION";
    db.entryStates = db.entryStates.filter((s) => !(s.entryType === type && s.entryId === id));
  }
}
