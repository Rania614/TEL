/** Illustrated badges for the four main skills (same palette as the library). */
export function SkillBadge({ skill, size = 64 }: { skill: string; size?: number }) {
  const bg = { SPEAKING: "#E99491", LISTENING: "#5276C9", READING: "#52A99A", WRITING: "#8774C8" }[skill] ?? "#F3B66D";
  return (
    <svg className="skill-badge" width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill={bg} />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" strokeWidth="3" opacity=".7" />
      {skill === "SPEAKING" && <g>
        <rect x="24" y="12" width="16" height="26" rx="8" fill="#fde2b8" /><path d="M20 30 a12 12 0 0 0 24 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="30.5" y="42" width="3" height="8" fill="#fff" /><rect x="24" y="49" width="16" height="3" rx="1.5" fill="#fff" />
        <path className="note-float" d="M46 18 q4 4 0 8 M50 14 q7 8 0 16" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>}
      {skill === "LISTENING" && <g>
        <path d="M18 38 v-6 a14 14 0 0 1 28 0 v6" stroke="#fff" strokeWidth="4" fill="none" />
        <rect x="14" y="34" width="10" height="14" rx="4" fill="#fde2b8" /><rect x="40" y="34" width="10" height="14" rx="4" fill="#fde2b8" />
        <path className="note-float" d="M30 22 v-8 l6 -2 v7" stroke="#fde2b8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>}
      {skill === "READING" && <g>
        <path d="M12 44 q10 -6 20 0 q10 -6 20 0 v-22 q-10 -6 -20 0 q-10 -6 -20 0 z" fill="#fff" />
        <path d="M32 22 v22" stroke="#52A99A" strokeWidth="2" /><path d="M17 28 h11 M17 34 h9 M36 28 h11 M36 34 h9" stroke="#a7d8cf" strokeWidth="2" strokeLinecap="round" />
        <path className="twinkle" d="M32 8 C33 13 34 14 39 15 C34 16 33 17 32 22 C31 17 30 16 25 15 C30 14 31 13 32 8Z" fill="#fde2b8" />
      </g>}
      {skill === "WRITING" && <g>
        <rect x="14" y="16" width="26" height="34" rx="3" fill="#fff" /><path d="M19 24 h16 M19 30 h16 M19 36 h10" stroke="#c9c0ec" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 44 C 42 30, 48 22, 54 14 C 52 26, 46 36, 40 46 Z" fill="#fde2b8" stroke="#fff" strokeWidth="1.5" />
      </g>}
    </svg>
  );
}
