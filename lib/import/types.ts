// Shapes produced by the Smart Import parser and edited in the preview.
// Nothing here is saved as course content until the teacher publishes.
import type { MaterialType, PartKind, Skill, SubmissionType, Tag, ExpressionCategory } from "../types";

export type ItemStatus = "CLASSIFIED" | "REVIEW" | "MISSING";

export interface ParsedPart { id: string; kind: PartKind; title: string; body: string }

export interface ParsedTask {
  key: string;
  title: string;
  primarySkill: Skill | null;
  tags: Tag[];
  submissionTypes: SubmissionType[];
  /** The task exactly as written in the source (all lines, original order). */
  instructions: string;
  parts: ParsedPart[];
  questions: string[];
  readingText: string;
  requiredExpressions: string[];
  status: ItemStatus;
  confidence: number; // 0..1
  reasons: string[];
  reviewNote: string;
  /** Teacher has looked at a flagged item and accepted it. */
  confirmed: boolean;
  /** Existing task in the library with the same content (duplicate import). */
  duplicateOfTaskId: string | null;
  include: boolean;
}

export interface ParsedResource {
  key: string;
  url: string;
  title: string;
  type: MaterialType;
  skill: Skill | Tag | null;
  taskKey: string | null;
  status: ItemStatus;
  note: string;
  confirmed: boolean;
  include: boolean;
}

export interface ParsedExpression {
  key: string;
  text: string;
  category: ExpressionCategory;
  taskKey: string | null;
  status: ItemStatus;
  include: boolean;
}

export interface ParsedSession {
  key: string;
  levelNumber: number;
  number: number;
  title: string;
  lessonTitle: string;
  description: string;
  titleStatus: ItemStatus;
  notes: string[];
  tasks: ParsedTask[];
  resources: ParsedResource[];
  expressions: ParsedExpression[];
  /** Existing session that already holds this content (matched by task titles). */
  matchSessionId: string | null;
  matchTitle: string;
  action: "CREATE" | "SKIP_EXISTING";
  include: boolean;
  /** Teacher accepted the title/notes as they are. */
  confirmed?: boolean;
}

export interface ParsedImport {
  parser: "rules";
  documentTitle: string;
  sessions: ParsedSession[];
  /** Lines deliberately not turned into content, with the reason. */
  skipped: { line: string; reason: string }[];
  totalLines: number;
}
