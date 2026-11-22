import type { Database, Submission, Task, TaskStatus } from "./types";

export function latestSubmission(db: Database, taskId: string, studentId: string): Submission | null {
  let best: Submission | null = null;
  for (const s of db.submissions) {
    if (s.taskId === taskId && s.studentId === studentId && (!best || s.version > best.version)) best = s;
  }
  return best;
}

export function taskStatus(db: Database, task: Task, studentId: string): TaskStatus {
  const latest = latestSubmission(db, task.id, studentId);
  if (latest) return latest.status;
  const d = db.drafts.find((x) => x.taskId === task.id && x.studentId === studentId);
  if (d && (d.text.trim() || d.notes.trim() || d.fileIds.length || Object.values(d.answers).some((v) => v.trim()))) {
    return "IN_PROGRESS";
  }
  return "NOT_STARTED";
}

/** Session progress for one student: share of tasks handed in, and reviewed. */
export function sessionProgress(db: Database, sessionId: string, studentId: string) {
  const tasks = db.tasks.filter((t) => t.sessionId === sessionId);
  const statuses = tasks.map((t) => taskStatus(db, t, studentId));
  const handedIn = statuses.filter((s) => s === "SUBMITTED" || s === "REVIEWED" || s === "NEEDS_REVISION").length;
  const reviewed = statuses.filter((s) => s === "REVIEWED").length;
  const total = tasks.length;
  const percent = total ? Math.round(((handedIn - reviewed) * 0.5 + reviewed) / total * 100) : 0;
  let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED";
  if (total && reviewed === total) status = "COMPLETED";
  else if (statuses.some((s) => s !== "NOT_STARTED")) status = "IN_PROGRESS";
  return { total, handedIn, reviewed, percent, status };
}

export function unseenFeedbackCount(db: Database, studentId: string) {
  const mine = new Set(db.submissions.filter((s) => s.studentId === studentId).map((s) => s.id));
  return db.feedback.filter((f) => mine.has(f.submissionId) && !f.seenAt).length;
}
