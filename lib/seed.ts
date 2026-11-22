import { randomUUID } from "node:crypto";
import type { Database, SectionSkill } from "./types";
import { PROFILES, SINGER_TASK, VOCAB, EXPRESSIONS } from "./seed-content";

const id = () => randomUUID().replace(/-/g, "").slice(0, 20);

export function buildSeed(): Database {
  const t = new Date().toISOString();
  const db: Database = {
    schemaVersion: 2, users: [], levels: [], sourceDocuments: [], importDrafts: [], sessions: [], sections: [], materials: [], tasks: [],
    drafts: [], submissions: [], feedback: [], files: [], vocabulary: [], expressions: [],
    entryStates: [], achievements: [],
  };

  // Real numbers come from the environment, e.g. PROFILE_MOBILES={"rania":"011…","rabeha":"011…"}
  let mobiles: Record<string, string> = {};
  try { mobiles = JSON.parse(process.env.PROFILE_MOBILES || "{}"); } catch { console.warn("PROFILE_MOBILES is not valid JSON — using placeholder numbers."); }
  for (const p of PROFILES) db.users.push({ id: id(), ...p, mobile: mobiles[p.username] || p.mobile, createdAt: t });

  // Level 1 is filled by importing "Level 1.docx" (Smart Session Import).
  // The singer session below is Level 2 · Session 1 in that same document.
  const level1 = id(), level2 = id();
  db.levels.push({ id: level1, number: 1, title: "Level 1", createdAt: t }, { id: level2, number: 2, title: "Level 2", createdAt: t });
  const sessionId = id();
  db.sessions.push({
    id: sessionId, levelId: level2, sourceDocumentId: null, number: 1, title: "Music & Live Performance",
    description:
      "Our first session: talking about songs, singers and live music. Watch the two videos, study the expressions, then record the speaking challenge “You're the Singer!”.",
    objectives: [
      "Talk about a song: its lyrics, melody and beat",
      "Describe getting ready for a live performance",
      "Explain how to handle a problem on stage",
      "Use music phrasal verbs, idioms, collocations and compound nouns naturally in one connected story",
    ],
    published: true, createdAt: t, updatedAt: t,
  });

  const sections: [SectionSkill, string, string][] = [
    ["SPEAKING", "Speaking", "This session's speaking challenge is **You're the Singer!** — open it from the Tasks list. Plan your ideas in the draft notebook first, then record a 3–5 minute connected talk."],
    ["READING", "Reading", ""],
    ["LISTENING", "Listening", ""],
    ["GRAMMAR", "Grammar", ""],
    ["VOCABULARY", "Vocabulary", "Music vocabulary for this session: **lyrics, melody, beat, catchy song, catchy tune, backing vocals, music video, songwriter, soundtrack**.\n\nEvery word is saved in your *Vocabulary Vault* with a meaning, an example and space for your own notes."],
    ["PHONICS", "Phonics & Pronunciation", ""],
    ["IDIOMS", "Idioms", "- **have a good ear for music**\n- **music to my ears**\n- **change my tune**\n\nMeanings and examples are in *Idioms & Phrasal Verbs*."],
    ["PHRASAL_VERBS", "Phrasal Verbs", "- **sing along**\n- **turn up**\n- **turn down**\n\nMeanings and examples are in *Idioms & Phrasal Verbs*."],
    ["GAMES_VIDEOS", "Games & Videos", "Watch both videos before you record your speaking task."],
  ];
  let gamesId = "";
  sections.forEach(([skill, title, body], order) => {
    const sid = id();
    if (skill === "GAMES_VIDEOS") gamesId = sid;
    db.sections.push({ id: sid, sessionId, skill, title, body, order });
  });

  for (const [n, url] of [
    [1, "https://youtu.be/ROKf2EXAAPs?si=3tYCyW3CQuLc5xTy"],
    [2, "https://youtu.be/ojgogr0St9g?si=L_ZEe00ck_L79B7V"],
  ] as const) {
    db.materials.push({
      id: id(), sessionId, sectionId: gamesId, taskId: null, skill: "VIDEOS", type: "YOUTUBE", title: `Session 1 — Video ${n}`,
      description: "Shared by Rabeha for Session 1.", url, fileId: null, createdAt: t,
    });
  }

  db.tasks.push({
    id: id(), sessionId, title: "You're the Singer!", instructions: SINGER_TASK, skill: "SPEAKING",
    tags: ["VOCABULARY", "IDIOMS", "PHRASAL_VERBS", "COLLOCATIONS"], parts: [], submissionTypes: ["AUDIO"], sourceDocumentId: null,
    requiredExpressions: ["sing along", "turn up", "turn down", "have a good ear for music", "music to my ears", "change my tune", "hit the right note", "powerful vocals", "live performance", "music video", "songwriter", "soundtrack"],
    difficulty: "CHALLENGING", durationMin: 30, dueDate: null,
    questions: [], readingText: "", highlightWords: [], mediaUrl: null, attachmentIds: [], order: 0, createdAt: t,
  });

  for (const [word, meaning, example, pronunciation, relatedWords] of VOCAB) {
    db.vocabulary.push({ id: id(), word, meaning, example, pronunciation, relatedWords, sessionIds: [sessionId], createdAt: t });
  }
  for (const [expression, category, meaning, example] of EXPRESSIONS) {
    db.expressions.push({
      id: id(), expression, meaning, example,
      category: category as Database["expressions"][number]["category"], sessionIds: [sessionId], createdAt: t,
    });
  }
  return db;
}
