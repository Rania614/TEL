export const SKILL_LABEL: Record<string, string> = {
  SPEAKING: "Speaking", READING: "Reading", LISTENING: "Listening", WRITING: "Writing",
  GRAMMAR: "Grammar", VOCABULARY: "Vocabulary", PHONICS: "Phonics & Pronunciation",
  IDIOMS: "Idioms", PHRASAL_VERBS: "Phrasal Verbs", GAMES_VIDEOS: "Games & Videos",
};
export const SKILL_ICON: Record<string, string> = {
  SPEAKING: "🎙", READING: "📖", LISTENING: "🎧", WRITING: "✒", GRAMMAR: "⚙",
  VOCABULARY: "❦", PHONICS: "♪", IDIOMS: "❝", PHRASAL_VERBS: "⇄", GAMES_VIDEOS: "▶",
};
export const CATEGORY_LABEL: Record<string, string> = {
  IDIOM: "Idiom", PHRASAL_VERB: "Phrasal verb", COLLOCATION: "Collocation", COMPOUND_NOUN: "Compound noun", EXPRESSION: "Expression",
};
export const DIFFICULTY_LABEL: Record<string, string> = { EASY: "Easy", MEDIUM: "Medium", CHALLENGING: "Challenging" };
export const difficultyLabel = (d: string | null | undefined) => (d ? DIFFICULTY_LABEL[d] : "");

export const AVATARS: Record<string, string> = {
  owl: "🦉", fox: "🦊", deer: "🦌", cat: "🐈", rabbit: "🐇", hedgehog: "🦔",
  swan: "🦢", bee: "🐝", butterfly: "🦋", tulip: "🌷", moon: "🌙", teacup: "🫖",
};
export const avatarGlyph = (k: string) => AVATARS[k] ?? "📚";

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function fmtSize(n: number) {
  return n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`;
}

export const TAG_LABEL: Record<string, string> = {
  VOCABULARY: "Vocabulary", GRAMMAR: "Grammar", IDIOMS: "Idioms", PHRASAL_VERBS: "Phrasal Verbs", COLLOCATIONS: "Collocations",
  PHONICS: "Phonics & Pronunciation", GAMES: "Games", VIDEOS: "Videos", EXTRA: "Extra materials",
};
export const SUBMISSION_LABEL: Record<string, string> = { AUDIO: "🎙 Voice recording", TEXT: "✒ Written answer", IMAGE: "🖼 Notebook photo", FILE: "📎 File (PDF)" };
export const PART_STYLE: Record<string, { icon: string; label: string }> = {
  INTRO: { icon: "✦", label: "Introduction" }, SITUATION: { icon: "🌙", label: "Situation" }, PART: { icon: "📜", label: "Part" },
  QUESTIONS: { icon: "❓", label: "Questions" }, LANGUAGE: { icon: "💬", label: "Useful language" }, EXAMPLE: { icon: "🔖", label: "Example" },
  CHALLENGE: { icon: "⭐", label: "Challenge" }, SUBMISSION: { icon: "✉", label: "How to hand it in" }, READING: { icon: "📖", label: "Reading" }, TEXT: { icon: "✦", label: "" },
};
export const sessionLabel = (s: { number: number }, levelNumber?: number | null) =>
  levelNumber ? `Level ${levelNumber} · Session ${s.number}` : `Session ${s.number}`;
