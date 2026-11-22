// Entity types — mirror docs/target-schema.prisma one-to-one so the JSON demo
// store can be swapped for Prisma/PostgreSQL without touching the UI.

export type Role = "STUDENT" | "TEACHER";
export type Skill = "SPEAKING" | "LISTENING" | "READING" | "WRITING";
export type SectionSkill =
  | "SPEAKING" | "READING" | "LISTENING" | "WRITING" | "GRAMMAR" | "VOCABULARY"
  | "PHONICS" | "IDIOMS" | "PHRASAL_VERBS" | "GAMES_VIDEOS";
export type Secondary = "GRAMMAR" | "VOCABULARY" | "PHONICS" | "IDIOMS" | "PHRASAL_VERBS";
/** Secondary learning tags. A task has ONE primary Skill and any number of tags. */
export type Tag = "GRAMMAR" | "VOCABULARY" | "PHONICS" | "IDIOMS" | "PHRASAL_VERBS" | "COLLOCATIONS" | "GAMES" | "VIDEOS" | "EXTRA";
export const TAGS: Tag[] = ["VOCABULARY", "GRAMMAR", "IDIOMS", "PHRASAL_VERBS", "COLLOCATIONS", "PHONICS", "GAMES", "VIDEOS", "EXTRA"];
export type SubmissionType = "AUDIO" | "TEXT" | "IMAGE" | "FILE";
/** Structured, readable pieces of a task. `body` is the original wording (light markdown). */
export type PartKind = "INTRO" | "SITUATION" | "PART" | "QUESTIONS" | "LANGUAGE" | "EXAMPLE" | "CHALLENGE" | "SUBMISSION" | "READING" | "TEXT";
export interface TaskPart { id: string; kind: PartKind; title: string; body: string }
export type Difficulty = "EASY" | "MEDIUM" | "CHALLENGING";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "NEEDS_REVISION" | "REVIEWED";
export type SubmissionStatus = "SUBMITTED" | "NEEDS_REVISION" | "REVIEWED";
export type MaterialType = "YOUTUBE" | "LINK" | "AUDIO" | "PDF" | "IMAGE" | "DOCUMENT";
export type ExpressionCategory = "IDIOM" | "PHRASAL_VERB" | "COLLOCATION" | "COMPOUND_NOUN" | "EXPRESSION";
export type FileKind = "AUDIO" | "IMAGE" | "PDF" | "OTHER";

export interface User {
  id: string; role: Role; name: string; nameAr: string;
  username: string; mobile: string; avatar: string; createdAt: string;
}
export interface Level { id: string; number: number; title: string; createdAt: string }
export interface Session {
  id: string; levelId: string; number: number; lessonTitle?: string; sourceDocumentId?: string | null; title: string; description: string;
  objectives: string[]; published: boolean; createdAt: string; updatedAt: string;
}
export interface SessionSection {
  id: string; sessionId: string; skill: SectionSkill; title: string; body: string; order: number;
}
export interface LearningMaterial {
  id: string; sessionId: string | null; sectionId: string | null; type: MaterialType;
  /** Optional links: a resource can belong to a task and/or a skill/tag tab. null = general session material. */
  taskId?: string | null; skill?: Skill | Tag | null;
  title: string; description: string; url: string | null; fileId: string | null; createdAt: string;
}
export interface Question { id: string; prompt: string }
export interface Task {
  id: string; sessionId: string; title: string; instructions: string; skill: Skill;
  /** @deprecated kept only so old data can be migrated; use `tags`. */
  secondary?: Secondary | null;
  tags: Tag[]; parts: TaskPart[]; requiredExpressions: string[]; submissionTypes: SubmissionType[];
  sourceDocumentId?: string | null; classificationNote?: string;
  /** null = not stated (e.g. imported content). durationMin 0 = not stated. */
  difficulty: Difficulty | null; durationMin: number; dueDate: string | null;
  questions: Question[]; readingText: string; highlightWords: string[]; mediaUrl: string | null;
  attachmentIds: string[]; order: number; createdAt: string;
}
export interface Draft {
  id: string; taskId: string; studentId: string; text: string; notes: string;
  answers: Record<string, string>; fileIds: string[]; updatedAt: string;
}
export interface Submission {
  id: string; taskId: string; studentId: string; version: number; status: SubmissionStatus;
  text: string; answers: Record<string, string>; notes: string; fileIds: string[]; createdAt: string;
}
export interface Correction { original: string; correction: string; note: string }
export interface Feedback {
  id: string; submissionId: string; teacherId: string; text: string; audioFileId: string | null;
  score: number | null; rating: number | null; corrections: Correction[];
  decision: "REVIEWED" | "NEEDS_REVISION" | "COMMENT"; seenAt: string | null; createdAt: string;
}
export interface FileAsset {
  id: string; ownerId: string; originalName: string; mime: string; size: number;
  storageKey: string; kind: FileKind; createdAt: string;
}
export interface VocabularyEntry {
  id: string; word: string; meaning: string; example: string; pronunciation: string;
  relatedWords: string[]; sessionIds: string[]; createdAt: string;
}
export interface ExpressionEntry {
  id: string; expression: string; meaning: string; example: string;
  category: ExpressionCategory; sessionIds: string[]; createdAt: string;
}
export interface StudentEntryState {
  id: string; studentId: string; entryType: "VOCAB" | "EXPRESSION"; entryId: string;
  learned: boolean; favorite: boolean; note: string;
}
export interface Achievement {
  id: string; studentId: string; key: string; title: string; points: number; icon: string;
  seenAt: string | null; createdAt: string;
}

export interface SourceDocument {
  id: string; fileId: string; originalName: string; sha256: string; levelId: string | null;
  importDraftId: string; importedAt: string; importedBy: string;
  stats: { sessions: number; tasks: number; resources: number; expressions: number };
}
export interface ImportDraft {
  id: string; fileId: string | null; originalName: string; sha256: string; source: "FILE" | "PASTE";
  defaultLevel: number; status: "DRAFT" | "PUBLISHED"; data: import("./import/types").ParsedImport;
  createdAt: string; updatedAt: string; publishedAt: string | null; createdBy: string;
}

export interface Database {
  schemaVersion: number;
  users: User[];
  levels: Level[];
  sourceDocuments: SourceDocument[];
  importDrafts: ImportDraft[];
  sessions: Session[];
  sections: SessionSection[];
  materials: LearningMaterial[];
  tasks: Task[];
  drafts: Draft[];
  submissions: Submission[];
  feedback: Feedback[];
  files: FileAsset[];
  vocabulary: VocabularyEntry[];
  expressions: ExpressionEntry[];
  entryStates: StudentEntryState[];
  achievements: Achievement[];
}
