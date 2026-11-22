import type { Achievement, Database } from "./types";

/**
 * REWARD RULES (one place to configure)
 *
 * - First submission of a task ............ SUBMIT points (once per task)
 * - Teacher marks a submission Reviewed .... REVIEWED points (once per task)
 * - Every task in a session Reviewed ....... SESSION points (once per session)
 * - Milestones ............................. their own points (once each)
 *
 * Re-submitting, revisions and duplicate uploads never grant again: every
 * reward has a unique key per student, and grant() skips existing keys.
 */
export const REWARD_POINTS = {
  SUBMIT: 5,
  REVIEWED: 20,
  SESSION: 50,
};

export const MILESTONES: {
  key: string; title: string; icon: string; points: number;
  test: (s: StudentStats) => boolean;
}[] = [
  { key: "first-submission", title: "First page written", icon: "✒", points: 5, test: (s) => s.submittedTasks >= 1 },
  { key: "first-recording", title: "First time at the microphone", icon: "🎙", points: 10, test: (s) => s.audioSubmissions >= 1 },
  { key: "first-review", title: "First teacher review", icon: "✉", points: 5, test: (s) => s.reviewedTasks >= 1 },
  { key: "words-5", title: "Word collector — 5 entries learned", icon: "❦", points: 10, test: (s) => s.learnedEntries >= 5 },
  { key: "words-15", title: "Lexicon keeper — 15 entries learned", icon: "❧", points: 20, test: (s) => s.learnedEntries >= 15 },
  { key: "reviewed-5", title: "Five tasks reviewed", icon: "✶", points: 25, test: (s) => s.reviewedTasks >= 5 },
];

/** The study room grows with total points. Add rows to extend. */
export const ROOM_LEVELS: { points: number; key: string; title: string; titleAr: string }[] = [
  { points: 0, key: "desk", title: "A small cosy study nook", titleAr: "زاوية مذاكرة صغيرة ودافئة" },
  { points: 15, key: "lamp", title: "A glowing lantern", titleAr: "فانوس متوهج" },
  { points: 35, key: "plant", title: "A hanging vine plant", titleAr: "نبتة متدلية" },
  { points: 60, key: "shelf2", title: "A tall blue bookshelf", titleAr: "مكتبة زرقاء طويلة" },
  { points: 90, key: "desk2", title: "A bigger desk with golden trim", titleAr: "مكتب أكبر بإطار ذهبي" },
  { points: 130, key: "armchair", title: "A cosy lavender armchair", titleAr: "كرسي قراءة بنفسجي مريح" },
  { points: 180, key: "globe", title: "A globe and a floating crystal", titleAr: "كرة أرضية وكرة بلورية طائرة" },
  { points: 250, key: "window", title: "A tall starry window — the room expands", titleAr: "نافذة مقوّسة مليئة بالنجوم — الغرفة تتسع" },
];

export interface StudentStats {
  submittedTasks: number; reviewedTasks: number; audioSubmissions: number; learnedEntries: number;
}

export function statsFor(db: Database, studentId: string): StudentStats {
  const subs = db.submissions.filter((s) => s.studentId === studentId);
  const submittedTasks = new Set(subs.map((s) => s.taskId)).size;
  const reviewedTasks = new Set(subs.filter((s) => s.status === "REVIEWED").map((s) => s.taskId)).size;
  const audioSubmissions = subs.filter((s) =>
    s.fileIds.some((f) => db.files.find((x) => x.id === f)?.kind === "AUDIO")).length;
  const learnedEntries = db.entryStates.filter((e) => e.studentId === studentId && e.learned).length;
  return { submittedTasks, reviewedTasks, audioSubmissions, learnedEntries };
}

export function totalPoints(db: Database, studentId: string) {
  return db.achievements.filter((a) => a.studentId === studentId).reduce((n, a) => n + a.points, 0);
}

export function roomState(points: number) {
  const unlocked = ROOM_LEVELS.filter((l) => points >= l.points);
  const next = ROOM_LEVELS.find((l) => points < l.points) ?? null;
  const prev = unlocked[unlocked.length - 1];
  const progress = next ? (points - prev.points) / (next.points - prev.points) : 1;
  return { level: unlocked.length, unlocked: unlocked.map((l) => l.key), next, progress };
}

/** Grants once; returns the new achievement or null if it already existed. */
export function grant(db: Database, studentId: string, key: string, title: string, points: number, icon = "✦"): Achievement | null {
  if (db.achievements.some((a) => a.studentId === studentId && a.key === key)) return null;
  const a: Achievement = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    studentId, key, title, points, icon, seenAt: null, createdAt: new Date().toISOString(),
  };
  db.achievements.push(a);
  return a;
}

/** Re-evaluate session completion + milestones after any change. */
export function evaluate(db: Database, studentId: string): Achievement[] {
  const granted: Achievement[] = [];
  for (const session of db.sessions) {
    const tasks = db.tasks.filter((t) => t.sessionId === session.id);
    if (!tasks.length) continue;
    const allReviewed = tasks.every((t) =>
      db.submissions.some((s) => s.taskId === t.id && s.studentId === studentId && s.status === "REVIEWED"));
    if (allReviewed) {
      const a = grant(db, studentId, `session:${session.id}`, `Session ${session.number} complete — “${session.title}”`, REWARD_POINTS.SESSION, "📖");
      if (a) granted.push(a);
    }
  }
  const stats = statsFor(db, studentId);
  for (const m of MILESTONES) {
    if (m.test(stats)) {
      const a = grant(db, studentId, `milestone:${m.key}`, m.title, m.points, m.icon);
      if (a) granted.push(a);
    }
  }
  return granted;
}
