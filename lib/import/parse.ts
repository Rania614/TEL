// Rule-based course-document parser + classifier.
// Deterministic and explainable: every decision records a reason, and anything
// uncertain is marked REVIEW instead of being guessed. No AI is involved.
import type { MaterialType, PartKind, Skill, SubmissionType, Tag } from "../types";
import type { ParsedExpression, ParsedImport, ParsedPart, ParsedResource, ParsedSession, ParsedTask } from "./types";

let seq = 0;
const key = (p: string) => `${p}${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
const ONLY_URL = /^\s*https?:\/\/\S+\s*$/i;
const BULLET = /^\s*[•▪◦●\-*✅☑✔]\s*/;
/** Leading emoji / symbols (keeps digits and letters). */
const LEAD_SYM = /^[^\p{L}\p{N}«"“'>(]+/u;
const TRAIL_SYM = /[\s\p{Extended_Pictographic}️‍]+$/u;
const SKILLS: Skill[] = ["SPEAKING", "LISTENING", "READING", "WRITING"];

export function stripSymbols(s: string) {
  return s.replace(LEAD_SYM, "").replace(TRAIL_SYM, "").trim();
}
const words = (s: string) => s.split(/\s+/).filter(Boolean);
const norm = (s: string) => stripSymbols(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const normTitle = norm;

function youtubeId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] ?? null;
}
function materialType(url: string): MaterialType {
  if (youtubeId(url)) return "YOUTUBE";
  if (/\.pdf(\?|$)/i.test(url)) return "PDF";
  if (/\.(mp3|m4a|wav|ogg)(\?|$)/i.test(url)) return "AUDIO";
  if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) return "IMAGE";
  return "LINK";
}

/* ───────── headings ───────── */
const SESSION_RE = /^\s*[•\-*]?\s*session\s*(\d+)\b\s*(.*)$/i;
const LEVEL_RE = /^\s*level\s*(\d+)\s*$/i;
const TEMPLATE_RE = /\|\|/;
const isTasksMarker = (l: string) => /^\s*[•\-*]\s*tasks?\s*$/i.test(l);
const isContentMarker = (l: string) => /^\s*[•\-*]\s*session content\s*$/i.test(l);
const isSeparator = (l: string) => /^\s*(-{3,}|_{3,}|\*{3,}|\.)\s*$/.test(l);

function titleish(rest: string) {
  const ws = words(rest.replace(/[^\p{L}\p{N}\s'’-]/gu, " "));
  const big = ws.filter((w) => w.length > 3 && /\p{L}/u.test(w));
  if (!big.length) return false;
  const caps = big.filter((w) => /^\p{Lu}/u.test(w) || /^\d/.test(w)).length;
  return caps / big.length >= 0.6;
}

/** Returns heading info when `line` starts a new task. `expected` = next task number for numbered headings. */
function headingOf(line: string, expected: number, allowNumbered: boolean): { number: number | null } | null {
  const core = stripSymbols(line);
  if (!core) return null;
  if (/^(task|mission)\s*\d+\b/i.test(core)) return { number: parseInt(core.match(/\d+/)![0], 10) };
  if (/\btask\b/i.test(core) && !/\btasks\b/i.test(core) && words(core).length <= 10 && !/[.]$/.test(core)) return { number: null };
  if (allowNumbered) {
    const m = core.match(/^(\d+)[.)]\s+(.+)$/);
    if (m && parseInt(m[1], 10) === expected && words(m[2]).length <= 9 && !/[.:]$/.test(m[2]) && titleish(m[2])) {
      return { number: expected };
    }
  }
  return null;
}

function cleanTaskTitle(line: string) {
  const core = stripSymbols(line);
  let t = core
    .replace(/^(task|mission)\s*\d+\s*[:.\-–—|]?\s*/i, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\s*\|\s*(speaking|writing|reading|listening)\s*$/i, "")
    .trim();
  t = stripSymbols(t);
  const withoutSkill = t.replace(/^(creative\s+)?(speaking|writing|reading|listening)\s*[—–:-]\s*/i, "").trim();
  if (withoutSkill && withoutSkill !== t) t = withoutSkill;
  // A title that is only a skill name ("Writing", "Speaking 🎤") keeps its task number for clarity.
  if (!t || /^(creative\s+)?(speaking|writing|reading|listening)(\s*[&+]\s*\p{L}+)?$/iu.test(t.replace(/[^\p{L}\s&+]/gu, "").trim())) {
    return core.replace(TRAIL_SYM, "").replace(/\s+[\p{Extended_Pictographic}️]+/gu, "").trim();
  }
  return t.replace(/\s+[\p{Extended_Pictographic}️]+/gu, "").trim();
}

/* ───────── classification ───────── */
const SIGNALS: Record<Skill, [RegExp, number, string][]> = {
  SPEAKING: [
    [/\brecord(ing)?\b|voice (message|recording)/i, 4, "asks for a recording / voice message"],
    [/\bspeak\b|\btalk (about|for)\b|talk about them/i, 4, "asks the student to speak / talk"],
    [/\bdescribe\b|has to explain|describes the person|create a story|continues the story|asking questions|asks questions|the partner guesses|guess(es)? the (job|person)/i, 3, "oral description / speaking game"],
    [/follow-up questions|explain your (opinion|choices)|in my opinion|i strongly believe/i, 2, "discussion and opinion language"],
    [/\binterview\b|journalist|ask and answer|ask your partner/i, 3, "interview / question-and-answer activity"],
    [/role[- ]?play|debate|present (it|your|to the class)|tell the class|then present|news reporter/i, 4, "role-play, debate or presentation"],
    [/work in pairs|student a\b|student b\b|group a\b|partner guesses|detective/i, 2, "pair or group speaking game"],
    [/answer (the \d+ questions )?in complete sentences|describe (their|everything|it)|explain (the problem|your|why|what)|answer naturally/i, 2, "describe / explain out loud"],
  ],
  WRITING: [
    [/\bwrite\s+(\d|one|a|five|an|\w+\s+(words|sentences))/i, 5, "asks the student to write"],
    [/\b\d+\s*[–-]\s*\d+\s*(words|sentences)\b/i, 3, "word / sentence count"],
    [/complete with|fill in|__{3,}/i, 4, "written fill-in exercise"],
    [/write a dialogue|paragraph|essay/i, 3, "dialogue / paragraph to write"],
  ],
  READING: [
    [/read (the|this) (text|passage|story|article)/i, 5, "asks the student to read a text"],
    [/from the text/i, 2, "answers come from the text"],
  ],
  LISTENING: [
    [/\blisten\b|\bwatch the (video|clip)\b|audio clip/i, 5, "asks the student to listen / watch"],
  ],
};
const HEADING_SKILL: [RegExp, Skill][] = [
  [/speaking|🗣|🎤|interview/i, "SPEAKING"],
  [/writing|✍|📝/i, "WRITING"],
  [/reading|📖/i, "READING"],
  [/listening|🎧/i, "LISTENING"],
];
const TAG_SIGNALS: [RegExp, Tag][] = [
  [/present simple|present continuous|past simple|frequency adverbs?|this\s*[–\/,-]\s*that|negative sentences|sequence words|questions? and negatives|grammar/i, "GRAMMAR"],
  [/vocabulary|adjectives?|job words|uniform words|emotion words|routine verbs|expressions?\b/i, "VOCABULARY"],
  [/\bidioms?\b/i, "IDIOMS"],
  [/phrasal verbs?/i, "PHRASAL_VERBS"],
  [/collocations?/i, "COLLOCATIONS"],
  [/pronunciation|phonics/i, "PHONICS"],
  [/\bgame\b|guess the|guess my|detective/i, "GAMES"],
];
const TEACHER_FACING = /\b(tell the student|give (them|the student)|the student (has to|describes|continues)|for stronger students|ask them to)\b/i;

function classify(heading: string, text: string, shared: string) {
  const reasons: string[] = [];
  const all = `${heading}\n${text}\n${shared}`;
  const score: Record<Skill, number> = { SPEAKING: 0, LISTENING: 0, READING: 0, WRITING: 0 };
  const headingSkills: Skill[] = [];
  for (const [re, sk] of HEADING_SKILL) {
    const m = heading.search(re);
    if (m >= 0) headingSkills.push(sk);
  }
  headingSkills.sort((a, b) => heading.search(HEADING_SKILL.find((h) => h[1] === a)![0]) - heading.search(HEADING_SKILL.find((h) => h[1] === b)![0]));
  headingSkills.forEach((sk, i) => { score[sk] += i === 0 ? 8 : 4; });
  if (headingSkills.length) reasons.push(`Heading names ${headingSkills.map((s) => s.toLowerCase()).join(" & ")}`);
  const body: Record<Skill, number> = { SPEAKING: 0, LISTENING: 0, READING: 0, WRITING: 0 };
  for (const sk of SKILLS) {
    for (const [re, w, why] of SIGNALS[sk]) {
      if (re.test(`${heading}\n${text}\n${shared}`)) { score[sk] += w; reasons.push(`${sk[0]}${sk.slice(1).toLowerCase()}: ${why}`); }
      if (re.test(`${text}\n${shared}`)) body[sk] += w;
    }
  }
  const bodyTop = [...SKILLS].sort((a, b) => body[b] - body[a])[0];
  const ranked = [...SKILLS].sort((a, b) => score[b] - score[a]);
  const [top, second] = ranked;
  let primary: Skill | null = score[top] > 0 ? top : null;
  let status: ParsedTask["status"] = "CLASSIFIED";
  let note = "";
  if (!primary) { status = "REVIEW"; note = "No clear activity found — choose the primary skill."; }
  else if (headingSkills.length) {
    // Heading wins unless the body clearly asks for a different activity.
    primary = headingSkills[0];
    if (!headingSkills.includes(bodyTop) && body[bodyTop] >= 5 && body[bodyTop] > body[headingSkills[0]]) {
      status = "REVIEW";
      note = `Heading says ${headingSkills[0].toLowerCase()}, but the instructions mostly ask for ${bodyTop.toLowerCase()}.`;
    }
  } else if (score[top] < 4 || score[top] < score[second] * 1.6) {
    status = "REVIEW";
    note = score[second] > 0 ? `Mixed signals between ${top.toLowerCase()} and ${second.toLowerCase()}.` : "Weak signals — please confirm the skill.";
  }
  const confidence = primary ? Math.min(1, (score[primary] - (score[ranked.find((s) => s !== primary)!] ?? 0) + 2) / 10) : 0;

  // secondary tags
  const tags = new Set<Tag>();
  for (const [re, tag] of TAG_SIGNALS) if (re.test(all)) tags.add(tag);

  // submission types
  const types = new Set<SubmissionType>();
  const wantsAudio = /\brecord|voice (message|recording)|\bspeak\b|\btalk (about|for)\b|present (it|your|to the class)|then present|tell the class|aloud|out loud/i.test(all);
  const wantsWriting = /\bwrite\s+(\d|one|a\b|an\b|five|\w+\s+(words|sentences))|write a dialogue|complete with|fill in/i.test(text + shared);
  if (primary === "SPEAKING") types.add("AUDIO");
  if (primary === "WRITING") { types.add("TEXT"); types.add("IMAGE"); }
  if (primary === "READING" || primary === "LISTENING") types.add("TEXT");
  if (wantsAudio && primary !== "SPEAKING") { types.add("AUDIO"); reasons.push("Also asks for a recording"); }
  if (wantsWriting && primary === "SPEAKING") { types.add("TEXT"); reasons.push("Also involves writing"); }
  if (!types.size) types.add("TEXT");

  const notes: string[] = [];
  if (note) notes.push(note);
  if (TEACHER_FACING.test(all)) {
    status = "REVIEW";
    notes.push("Written as instructions for the teacher (a classroom activity) — confirm how students should submit it.");
  }
  if (/work in pairs|student a\b|your partner|group a\b/i.test(all)) notes.push("Pair or group activity — students may need a partner.");
  return { primary, status, reasons, note: notes.join(" "), confidence: Math.max(0, confidence), tags: [...tags], types: [...types] };
}

/* ───────── parts ───────── */
function labelKind(label: string): PartKind {
  const l = label.toLowerCase();
  if (/challenge|bonus/.test(l)) return "CHALLENGE";
  if (/^part\s*\d/.test(l)) return "PART";
  if (/useful language|^use\b|try to use|must use|try to include|^include|^mention/.test(l)) return "LANGUAGE";
  if (/question|^answer|^ask\b|find from|find out|then answer|for each situation|has to explain|explain|talk about|describe/.test(l)) return "QUESTIONS";
  if (/^situation|^topic|^mission|imagine|crazy situation|character secretly/.test(l)) return "SITUATION";
  if (/example|^start|now describe it|then tell the class/.test(l)) return "EXAMPLE";
  if (/read the text/.test(l)) return "READING";
  return "TEXT";
}
const LABEL_LINE = /^([^:]{2,60}):\s*(.*)$/;
function asLabel(line: string): { title: string; rest: string } | null {
  const core = stripSymbols(line);
  if (/^situation$/i.test(core) || /^(final |extra )?challenge$/i.test(core)) return { title: core, rest: "" };
  if (/^part\s*\d+\b/i.test(core) && words(core).length <= 9) return { title: core, rest: "" };
  const m = core.match(LABEL_LINE);
  if (m && words(m[1]).length <= 8 && !/https?$/i.test(m[1]) && !/^\d/.test(m[1])) return { title: m[1].trim(), rest: m[2].trim() };
  return null;
}
function toMd(line: string) {
  const t = line.trim();
  if (BULLET.test(t) && !/^-{3,}/.test(t)) return `- ${t.replace(BULLET, "")}`;
  return t;
}
function buildParts(body: string[], shared: string[]): ParsedPart[] {
  const parts: ParsedPart[] = [];
  if (shared.length) parts.push({ id: key("p"), kind: "INTRO", title: "Instructions for this session's tasks", body: shared.map(toMd).join("\n") });
  let cur: ParsedPart = { id: key("p"), kind: "INTRO", title: "", body: "" };
  const flush = () => { cur.body = cur.body.replace(/\n{3,}/g, "\n\n").trim(); if (cur.body || cur.title) parts.push(cur); };
  for (const raw of body) {
    const lab = asLabel(raw);
    if (lab) {
      flush();
      const kind = labelKind(lab.title);
      let rest = lab.rest;
      if (rest.startsWith("•")) rest = `- ${rest.replace(BULLET, "")}`;
      cur = { id: key("p"), kind, title: lab.title, body: rest };
      continue;
    }
    cur.body += `${cur.body ? "\n" : ""}${raw.trim() ? toMd(raw) : ""}`;
  }
  flush();
  return parts;
}

/* ───────── expressions ───────── */
const CATEGORY_SUB: [RegExp, ParsedExpression["category"]][] = [
  [/phrasal verbs?/i, "PHRASAL_VERB"], [/idioms?/i, "IDIOM"], [/collocations?/i, "COLLOCATION"], [/compound nouns?/i, "COMPOUND_NOUN"],
];
function splitInline(s: string) {
  return s.replace(/\.$/, "").replace(/\s+(naturally|in your).*$/i, "").split(/\s*,\s*(?:and\s+)?|\s+and\s+|\s+[–—]\s+|\s*\/\s*/)
    .map((x) => x.replace(/^use\s+/i, "").trim()).filter(Boolean);
}
const usable = (x: string) => x && !/\d/.test(x) && !/^at least/i.test(x) && words(x).length <= 6 && !/[?]$/.test(x) && !/(\.\.\.|…)$/.test(x);

function extractExpressions(body: string[]) {
  const required: string[] = [];
  const vault: { text: string; category: ParsedExpression["category"] }[] = [];
  let mode: null | { vault: boolean; category: ParsedExpression["category"] } = null;
  let numbered = false;
  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const core = stripSymbols(line);
    const subm = core.match(/^\d+\s+(phrasal verbs?|idioms?|collocations?|compound nouns?)\s*:?\s*$/i);
    if (subm && mode) { mode = { vault: true, category: CATEGORY_SUB.find(([re]) => re.test(subm[1]))![1] }; numbered = false; continue; }
    const lab = asLabel(line);
    if (lab) {
      const t = lab.title.toLowerCase();
      const sub = CATEGORY_SUB.find(([re]) => re.test(t));
      if (mode && sub && /^\d+\s/.test(lab.title)) { mode = { vault: true, category: sub[1] }; continue; }
      if (/challenge|must use|try to use|^use$|^use\b|expression/.test(t)) {
        mode = { vault: /challenge|must use|expression|try to use/.test(t), category: "EXPRESSION" };
        numbered = /expression/.test(t);
        const rest = lab.rest.replace(/^use\s*:\s*$/i, "");
        if (rest && /^(use|using)\b/i.test(rest) || (rest && /^(use|try to use|you must use)/i.test(t))) {
          const items = splitInline(rest).filter(usable);
          for (const it of items) { required.push(it); if (mode.vault && words(it).length >= 2) vault.push({ text: it, category: "EXPRESSION" }); }
          if (items.length) mode = null;
        } else if (rest) mode = null;
        continue;
      }
      mode = null; continue;
    }
    if (!mode) continue;
    let item = core;
    if (numbered) { const m = line.match(/^\s*\d+[.)]\s+(.+)$/); if (!m) { mode = null; continue; } item = m[1].trim(); }
    else if (BULLET.test(line)) item = line.replace(BULLET, "").trim();
    const pieces = / [–—] /.test(item) ? item.split(/\s+[–—]\s+/) : [item];
    if (!pieces.every(usable)) { mode = null; continue; }
    for (const p of pieces) {
      required.push(p);
      if (mode.vault && (words(p).length >= 2 || mode.category !== "EXPRESSION")) vault.push({ text: p, category: mode.category });
    }
  }
  return { required: [...new Set(required)], vault };
}

/* ───────── main ───────── */
export function parseCourseText(text: string, opts: { defaultLevel: number; documentTitle: string; fallbackSession?: number }): ParsedImport {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, "").replace(/ /g, " "));
  const skipped: ParsedImport["skipped"] = [];
  const sessions: ParsedSession[] = [];
  let level = opts.defaultLevel;
  let cur: { s: ParsedSession; header: string[]; body: string[]; inBody: boolean } | null = null;
  const pre: string[] = [];

  const finish = () => { if (cur) { buildSession(cur.s, cur.header, cur.body, skipped); sessions.push(cur.s); } cur = null; };

  for (const line of lines) {
    const t = line.trim();
    const lm = t.match(LEVEL_RE);
    if (lm && !/^[•\-*]/.test(t)) { finish(); level = parseInt(lm[1], 10); continue; }
    const sm = t.match(SESSION_RE);
    if (sm && words(t).length <= 6) {
      finish();
      cur = {
        s: { key: key("s"), levelNumber: level, number: parseInt(sm[1], 10), title: "", lessonTitle: "", description: "", titleStatus: "CLASSIFIED",
          notes: [], tasks: [], resources: [], expressions: [], matchSessionId: null, matchTitle: "", action: "CREATE", include: true },
        header: sm[2] ? [`• ${sm[2]}`] : [], body: [], inBody: false,
      };
      continue;
    }
    if (!cur) { if (t) pre.push(t); continue; }
    if (!cur.inBody) {
      if (isTasksMarker(t)) { cur.inBody = true; skipped.push({ line: t, reason: "Section marker (“Tasks”)" }); continue; }
      if (!t) continue;
      if (/^[•\-*]/.test(t) || TEMPLATE_RE.test(t)) { cur.header.push(t); continue; }
      cur.inBody = true; // header without a "Tasks" marker
    }
    cur.body.push(line);
  }
  finish();

  // Text with no "Session N" markers (e.g. a pasted WhatsApp message): one session.
  if (!sessions.length && pre.length) {
    const s: ParsedSession = { key: key("s"), levelNumber: level, number: opts.fallbackSession ?? 1, title: "", lessonTitle: "", description: "", titleStatus: "MISSING",
      notes: [], tasks: [], resources: [], expressions: [], matchSessionId: null, matchTitle: "", action: "CREATE", include: true };
    buildSession(s, [], lines, skipped);
    sessions.push(s);
  } else {
    for (const t of pre) if (!LEVEL_RE.test(t)) skipped.push({ line: t, reason: "Text before the first session" });
  }

  // cross-session duplicate video note
  const seen = new Map<string, string>();
  for (const s of sessions) for (const r of s.resources) {
    const id = youtubeId(r.url) ?? r.url;
    const prev = seen.get(id);
    if (prev && prev !== s.key) r.note = [r.note, `Same video also appears in ${sessions.find((x) => x.key === prev)!.number ? `Session ${sessions.find((x) => x.key === prev)!.number}` : "another session"}.`].filter(Boolean).join(" ");
    else seen.set(id, s.key);
  }
  return { parser: "rules", documentTitle: opts.documentTitle, sessions, skipped, totalLines: lines.filter((l) => l.trim()).length };
}

function buildSession(s: ParsedSession, header: string[], body: string[], skipped: ParsedImport["skipped"]) {
  let headerTitle = "";
  for (const h of header) {
    const t = h.replace(/^[•\-*]\s*/, "").trim();
    if (TEMPLATE_RE.test(h)) { skipped.push({ line: h, reason: `Session ${s.number}: “Session content” template line (lists categories, no content)` }); continue; }
    if (isContentMarker(h)) { skipped.push({ line: h, reason: `Session ${s.number}: “Session content” heading (template)` }); continue; }
    if (/^lesson\b/i.test(t)) { s.lessonTitle = t.replace(/^lesson\s*[:\-–—]?\s*/i, "").trim(); continue; }
    if (/^level\s*\d+$/i.test(t)) { s.notes.push(`The line “${h}” appears inside Session ${s.number}’s header. It was not used as the level — please check.`); s.titleStatus = "REVIEW"; continue; }
    if (t) headerTitle = headerTitle ? `${headerTitle} · ${t}` : t;
  }

  // resources + task headings
  const hasTaskWord = body.some((l) => /^(task|mission)\s*\d+\b/i.test(stripSymbols(l)));
  let expected = 1;
  const headIdx: number[] = [];
  body.forEach((l, i) => {
    if (!l.trim() || ONLY_URL.test(l)) return;
    const h = headingOf(l, expected, !hasTaskWord);
    if (h) { headIdx.push(i); expected = (h.number ?? expected) + 1; }
  });

  const firstHead = headIdx.length ? headIdx[0] : body.length;
  const preamble = body.slice(0, firstHead).filter((l) => l.trim() && !ONLY_URL.test(l) && !isSeparator(l)).map((l) => l.trim());
  body.forEach((l, i) => {
    if (!ONLY_URL.test(l)) return;
    const url = l.trim();
    const owner = headIdx.filter((h) => h < i).length;
    s.resources.push(resourceFor(url, s, owner && i > firstHead ? null : null));
  });

  // block title + shared instructions
  let blockTitle = "";
  let shared = preamble;
  if (preamble.length && words(preamble[0]).length <= 9 && !/[.?!]$/.test(preamble[0])) { blockTitle = preamble[0]; shared = preamble.slice(1); }
  const cleanedBlock = blockTitle.replace(/\s*[–—-]\s*(\d+\s*)?(homework\s*)?tasks?\s*$/i, "").replace(/^homework\s*[–—-]\s*/i, "").replace(/\s+\d+\s*$/, "").trim();
  s.description = preamble.join("\n");

  // tasks
  const blocks: { heading: string; lines: string[] }[] = [];
  if (headIdx.length) {
    headIdx.forEach((h, n) => {
      const end = n + 1 < headIdx.length ? headIdx[n + 1] : body.length;
      blocks.push({ heading: body[h].trim(), lines: body.slice(h + 1, end) });
    });
  } else if (preamble.length) {
    // no recognisable headings: the whole body is one task
    const first = preamble[0];
    blocks.push({ heading: words(first).length <= 12 ? first : "", lines: body.filter((l) => !ONLY_URL.test(l)).slice(words(first).length <= 12 ? body.findIndex((l) => l.trim() === first) + 1 : 0) });
    shared = []; s.description = "";
  }

  blocks.forEach((b, i) => {
    const lines = b.lines.filter((l) => !ONLY_URL.test(l));
    while (lines.length && (!lines[lines.length - 1].trim() || isSeparator(lines[lines.length - 1]))) lines.pop();
    const content = lines.filter((l) => !isSeparator(l));
    const text = content.join("\n");
    const title = b.heading ? cleanTaskTitle(b.heading) : "";
    const c = classify(b.heading, text, shared.join("\n"));
    const parts = buildParts(content, shared);
    const isReading = c.primary === "READING";
    const questions: string[] = [];
    if (c.primary && c.primary !== "SPEAKING") {
      let inFind = false;
      for (const l of content) {
        const lab = asLabel(l);
        if (lab) inFind = /^find\b/i.test(lab.title);
        const m = l.trim().match(/^\d+[.)]\s+(.+)$/);
        if (m) questions.push(m[1].trim());
        else if (inFind && BULLET.test(l.trim())) questions.push(l.trim().replace(BULLET, ""));
      }
    }
    let readingText = "";
    if (isReading) {
      const passage: string[] = [];
      let inGuillemets = false;
      for (const l of content) {
        const t = l.trim();
        if (t.startsWith(">")) passage.push(t.replace(/^>\s*/, ""));
        else if (t.startsWith("«") || inGuillemets) {
          inGuillemets = !t.endsWith("»");
          passage.push(t.replace(/^«/, "").replace(/»$/, ""));
        }
      }
      readingText = passage.join("\n").trim();
    }
    const ex = extractExpressions(content);
    const task: ParsedTask = {
      key: key("t"), title: title || `Task ${i + 1}`, primarySkill: c.primary, tags: c.tags, submissionTypes: c.types,
      instructions: [b.heading, ...lines].join("\n").replace(/\n{3,}/g, "\n\n").trim(),
      parts, questions, readingText, requiredExpressions: ex.required,
      status: title ? c.status : "MISSING", confidence: c.confidence, reasons: c.reasons,
      reviewNote: title ? c.note : ["No task title found in the text.", c.note].filter(Boolean).join(" "),
      confirmed: false, duplicateOfTaskId: null, include: true,
    };
    s.tasks.push(task);
    for (const v of ex.vault) {
      if (!s.expressions.some((e) => e.text.toLowerCase() === v.text.toLowerCase())) {
        s.expressions.push({ key: key("e"), text: v.text, category: v.category, taskKey: task.key, status: "CLASSIFIED", include: true });
      }
    }
    for (const m of text.match(URL_RE) ?? []) s.resources.push(resourceFor(m, s, task.key));
  });

  // session title
  const firstTaskTitle = s.tasks[0]?.title ?? "";
  const overlap = (a: string, b: string) => norm(a).split(" ").some((w) => w.length > 3 && norm(b).split(" ").includes(w));
  if (s.lessonTitle) s.title = s.lessonTitle;
  else if (cleanedBlock && headerTitle) {
    s.title = headerTitle;
    if (!overlap(headerTitle, cleanedBlock)) { s.titleStatus = "REVIEW"; s.notes.push(`Header says “${headerTitle}” but the content heading says “${blockTitle}”.`); }
  } else if (cleanedBlock) s.title = cleanedBlock;
  else if (headerTitle) {
    s.title = headerTitle;
    if (s.tasks.length === 1 && !overlap(headerTitle, firstTaskTitle)) { s.titleStatus = "REVIEW"; s.notes.push(`Header says “${headerTitle}”, but the task is “${firstTaskTitle}”.`); }
  }
  if (!s.title) { s.titleStatus = "MISSING"; s.notes.push(`Session ${s.number} has no title in the document — add one, or it will be published as “Session ${s.number}”.`); }
  if (!s.tasks.length) s.notes.push("No tasks were found in this session.");
}

function resourceFor(url: string, s: ParsedSession, taskKey: string | null): ParsedResource {
  const type = materialType(url);
  const n = s.resources.filter((r) => r.type === type).length + 1;
  return {
    key: key("r"), url, type, taskKey,
    title: type === "YOUTUBE" ? `Video ${n}` : `Link ${n}`,
    skill: null, status: "REVIEW", confirmed: false, include: true,
    note: "The document doesn’t say what this resource is for — assign it to a skill or keep it as a general session material.",
  };
}
