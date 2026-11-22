import type { Database, User } from "./types";

/** Can this user read this uploaded file? Students: own files, course files, feedback on their own work. */
export function canReadFile(db: Database, user: User, fileId: string): boolean {
  const f = db.files.find((x) => x.id === fileId);
  if (!f) return false;
  if (user.role === "TEACHER" || f.ownerId === user.id) return true;
  if (db.materials.some((m) => m.fileId === fileId)) return true;
  if (db.tasks.some((t) => t.attachmentIds.includes(fileId))) return true;
  const mySubs = new Set(db.submissions.filter((s) => s.studentId === user.id).map((s) => s.id));
  return db.feedback.some((fb) => fb.audioFileId === fileId && mySubs.has(fb.submissionId));
}
