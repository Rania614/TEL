import type { Database } from "./types";
import type { HistoryItem } from "@/components/SubmissionHistory";

/** Submissions of ONE student for ONE task (or all tasks), with files + feedback resolved. */
export function historyFor(db: Database, studentId: string, taskId?: string): HistoryItem[] {
  const file = (id: string | null) => (id ? db.files.find((f) => f.id === id) ?? null : null);
  return db.submissions
    .filter((s) => s.studentId === studentId && (!taskId || s.taskId === taskId))
    .map((s) => ({
      ...s,
      files: s.fileIds.map((id) => file(id)).filter((f): f is NonNullable<typeof f> => !!f),
      feedback: db.feedback.filter((f) => f.submissionId === s.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((f) => ({ ...f, audio: file(f.audioFileId) })),
    }));
}
