import type { Database, ExpressionEntry, LearningMaterial, SessionSection, Task } from "./types";

/** The four main skills, then the secondary learning categories. */
export const SKILL_TABS = [
  { id: "speaking", skill: "SPEAKING", label: "Speaking", labelAr: "التحدث" },
  { id: "listening", skill: "LISTENING", label: "Listening", labelAr: "الاستماع" },
  { id: "reading", skill: "READING", label: "Reading", labelAr: "القراءة" },
  { id: "writing", skill: "WRITING", label: "Writing", labelAr: "الكتابة" },
] as const;
export const EXTRA_TABS = [
  { id: "vocabulary", label: "Vocabulary", icon: "❦", tags: ["VOCABULARY"], sections: ["VOCABULARY"], categories: ["COMPOUND_NOUN", "EXPRESSION"], vocab: true },
  { id: "grammar", label: "Grammar", icon: "⚙", tags: ["GRAMMAR"], sections: ["GRAMMAR"], categories: [], vocab: false },
  { id: "idioms", label: "Idioms", icon: "❝", tags: ["IDIOMS"], sections: ["IDIOMS"], categories: ["IDIOM"], vocab: false },
  { id: "phrasal-verbs", label: "Phrasal Verbs", icon: "⇄", tags: ["PHRASAL_VERBS"], sections: ["PHRASAL_VERBS"], categories: ["PHRASAL_VERB"], vocab: false },
  { id: "collocations", label: "Collocations", icon: "∞", tags: ["COLLOCATIONS"], sections: [], categories: ["COLLOCATION"], vocab: false },
  { id: "phonics", label: "Phonics", icon: "♪", tags: ["PHONICS"], sections: ["PHONICS"], categories: [], vocab: false },
  { id: "games-videos", label: "Games & Videos", icon: "▶", tags: ["GAMES", "VIDEOS"], sections: ["GAMES_VIDEOS"], categories: [], vocab: false },
  { id: "extra", label: "Extra & general", icon: "🗝", tags: ["EXTRA"], sections: [], categories: [], vocab: false },
] as const;
export type TabId = (typeof SKILL_TABS)[number]["id"] | (typeof EXTRA_TABS)[number]["id"];

export interface TabContent {
  tasks: Task[]; materials: LearningMaterial[]; generalMaterials: LearningMaterial[]; sections: SessionSection[];
  expressions: ExpressionEntry[]; vocabulary: Database["vocabulary"]; count: number;
}

export function sessionTabs(db: Database, sessionId: string) {
  const tasks = db.tasks.filter((t) => t.sessionId === sessionId).sort((a, b) => a.order - b.order);
  const materials = db.materials.filter((m) => m.sessionId === sessionId);
  const sections = db.sections.filter((s) => s.sessionId === sessionId && s.body.trim()).sort((a, b) => a.order - b.order);
  const expressions = db.expressions.filter((e) => e.sessionIds.includes(sessionId));
  const vocabulary = db.vocabulary.filter((v) => v.sessionIds.includes(sessionId));
  const general = materials.filter((m) => !m.skill && !m.taskId && !m.sectionId);
  const out = {} as Record<TabId, TabContent>;
  for (const t of SKILL_TABS) {
    const c: TabContent = {
      tasks: tasks.filter((x) => x.skill === t.skill),
      materials: materials.filter((m) => m.skill === t.skill || (m.sectionId && db.sections.find((s) => s.id === m.sectionId)?.skill === t.skill)),
      generalMaterials: [], sections: sections.filter((s) => s.skill === t.skill), expressions: [], vocabulary: [], count: 0,
    };
    c.count = c.tasks.length + c.materials.length + c.sections.length;
    out[t.id] = c;
  }
  for (const t of EXTRA_TABS) {
    const tags = t.tags as readonly string[];
    const c: TabContent = {
      tasks: tasks.filter((x) => x.tags?.some((g) => tags.includes(g))),
      materials: materials.filter((m) => (m.skill && tags.includes(m.skill)) || (m.sectionId && (t.sections as readonly string[]).includes(db.sections.find((s) => s.id === m.sectionId)?.skill ?? ""))),
      generalMaterials: t.id === "extra" ? general : [],
      sections: sections.filter((s) => (t.sections as readonly string[]).includes(s.skill)),
      expressions: expressions.filter((e) => (t.categories as readonly string[]).includes(e.category)),
      vocabulary: t.vocab ? vocabulary : [], count: 0,
    };
    c.count = c.tasks.length + c.materials.length + c.generalMaterials.length + c.sections.length + c.expressions.length + c.vocabulary.length;
    out[t.id] = c;
  }
  return out;
}
