import type { Database, Skill, SubmissionType, Tag } from "./types";

export const SCHEMA_VERSION = 2;

const defaultTypes = (skill: Skill): SubmissionType[] =>
  skill === "SPEAKING" ? ["AUDIO"] : skill === "WRITING" ? ["TEXT", "IMAGE"] : ["TEXT"];

/**
 * Versioned, idempotent migrations for the JSON store. Each step only ADDS
 * structure; no submission, feedback, draft or reward is ever removed.
 * Returns true when something changed (so the caller saves).
 */
export function migrate(db: Database): boolean {
  const from = db.schemaVersion ?? 1;
  if (from >= SCHEMA_VERSION) return false;

  if (from < 2) {
    // v2: levels, task tags/parts/submission types, resource links, import bookkeeping.
    const now = new Date().toISOString();
    db.levels ??= [];
    db.sourceDocuments ??= [];
    db.importDrafts ??= [];
    if (!db.levels.length) db.levels.push({ id: `lvl${Date.now().toString(36)}`, number: 1, title: "Level 1", createdAt: now });
    const firstLevel = db.levels[0].id;
    for (const s of db.sessions) {
      s.levelId ??= firstLevel;
      s.sourceDocumentId ??= null;
    }
    for (const t of db.tasks) {
      t.tags ??= t.secondary ? [t.secondary as Tag] : [];
      t.parts ??= [];
      t.requiredExpressions ??= [];
      t.submissionTypes ??= defaultTypes(t.skill);
      t.sourceDocumentId ??= null;
      delete t.secondary;
    }
    for (const m of db.materials) { m.taskId ??= null; m.skill ??= null; }
  }
  db.schemaVersion = SCHEMA_VERSION;
  return true;
}
