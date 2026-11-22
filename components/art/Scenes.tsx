/** Illustrations for workspaces, the entrance, the teacher's study and letters. */

export function MagicMicrophone() {
  return (
    <svg className="mic" viewBox="0 0 160 220" aria-hidden>
      <defs>
        <linearGradient id="mm-body" x1="0" x2="1"><stop offset="0" stopColor="#3f5bb0" /><stop offset=".45" stopColor="#7d9be6" /><stop offset="1" stopColor="#3f5bb0" /></linearGradient>
        <linearGradient id="mm-gold" x1="0" x2="1"><stop offset="0" stopColor="#d9954a" /><stop offset=".5" stopColor="#ffe2a8" /><stop offset="1" stopColor="#d9954a" /></linearGradient>
        <pattern id="mm-grill" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.6" fill="#2f4a93" opacity=".55" /></pattern>
        <radialGradient id="mm-aura" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff1c9" stopOpacity=".9" /><stop offset="1" stopColor="#fff1c9" stopOpacity="0" /></radialGradient>
      </defs>
      <circle className="mic-aura" cx="80" cy="66" r="78" fill="url(#mm-aura)" />
      <g className="head">
        <rect x="38" y="10" width="84" height="104" rx="42" fill="url(#mm-gold)" />
        <rect x="46" y="18" width="68" height="88" rx="34" fill="url(#mm-grill)" />
        <rect x="32" y="56" width="96" height="12" rx="6" fill="url(#mm-body)" />
        <path d="M70 20 q-14 10 -16 30" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" fill="none" />
      </g>
      <path d="M26 78 v12 a54 54 0 0 0 108 0 v-12" stroke="url(#mm-body)" strokeWidth="8" fill="none" strokeLinecap="round" />
      <rect x="73" y="144" width="14" height="46" rx="5" fill="url(#mm-body)" />
      <ellipse cx="80" cy="198" rx="40" ry="12" fill="url(#mm-gold)" />
      <path d="M18 30 C19 36 21 38 27 39 C21 40 19 42 18 48 C17 42 15 40 9 39 C15 38 17 36 18 30Z" fill="#F3B66D" className="twinkle" />
      <path d="M142 18 C143 23 145 25 150 26 C145 27 143 29 142 34 C141 29 139 27 134 26 C139 25 141 23 142 18Z" fill="#E99491" className="twinkle" style={{ animationDelay: ".8s" }} />
      <path d="M140 120 C141 125 143 127 148 128 C143 129 141 131 140 136 C139 131 137 129 132 128 C137 127 139 125 140 120Z" fill="#52A99A" className="twinkle" style={{ animationDelay: "1.4s" }} />
    </svg>
  );
}

/** Backdrop painted behind the recording studio panel. */
export function StudioBackdrop() {
  return (
    <svg className="studio-bg" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f4a93" /><stop offset="1" stopColor="#b79bd6" /></linearGradient>
        <radialGradient id="sb-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe0a6" stopOpacity=".7" /><stop offset="1" stopColor="#ffe0a6" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="600" height="420" fill="#7c88d6" />
      <path d="M200 300 V110 a100 100 0 0 1 200 0 V300 Z" fill="url(#sb-sky)" opacity=".9" />
      {[[240, 90], [360, 140], [300, 60], [250, 200], [350, 230]].map(([x, y], i) => <circle key={i} className="twinkle" style={{ animationDelay: `${i * .6}s` }} cx={x} cy={y} r="2.5" fill="#fff6dd" />)}
      {/* curtains */}
      <path d="M150 0 h80 q-30 150 10 320 h-90 z" fill="#8774C8" />
      <path d="M450 0 h-80 q30 150 -10 320 h90 z" fill="#8774C8" />
      <path d="M150 0 h80 q-30 150 10 320" fill="none" stroke="#a493dd" strokeWidth="6" />
      <path d="M0 330 Q300 300 600 330 V420 H0 Z" fill="#5f5fae" />
      <circle cx="80" cy="110" r="70" fill="url(#sb-glow)" className="glow-pulse" />
      <path d="M80 0 V70" stroke="#F3B66D" strokeWidth="2" />
      <path d="M66 70 h28 l6 12 v22 l-6 12 h-28 l-6 -12 v-22 z" fill="#F3B66D" />
      <rect x="72" y="80" width="16" height="26" rx="5" fill="#fff3d6" />
      <g className="sway" style={{ transformOrigin: "530px 300px" }}>
        <path d="M514 330 h34 l-6 -30 h-22 z" fill="#E99491" />
        <path d="M530 300 C520 260 500 250 496 220 M530 300 C540 262 560 250 566 226 M530 300 V240" stroke="#3f8f85" strokeWidth="4" fill="none" />
        {[[496, 220], [566, 226], [530, 238], [508, 256], [552, 258]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="6" fill={i % 2 ? "#7cc4b2" : "#52A99A"} transform={`rotate(${i * 50} ${x} ${y})`} />)}
      </g>
    </svg>
  );
}

export function WritingDeskArt() {
  return (
    <svg className="ws-art" viewBox="0 0 420 120" aria-hidden>
      <rect x="10" y="92" width="400" height="14" rx="7" fill="#F3B66D" />
      <path d="M120 90 q45 -18 90 0 q45 -18 90 0 v-58 q-45 -18 -90 0 q-45 -18 -90 0 z" fill="#fff" stroke="#8774C8" strokeWidth="3" />
      <path d="M210 32 v58" stroke="#8774C8" strokeWidth="2" />
      {[46, 58, 70].map((y) => <path key={y} d={`M132 ${y} q36 -8 70 0 M218 ${y} q36 -8 70 0`} stroke="#a7b8ea" strokeWidth="2" fill="none" />)}
      <path d="M140 52 q12 -6 22 2 q8 -8 18 -2" stroke="#5276C9" strokeWidth="2" fill="none" className="scribble" />
      <ellipse cx="350" cy="88" rx="18" ry="7" fill="#5276C9" /><rect x="336" y="62" width="28" height="26" rx="8" fill="#5276C9" />
      <path d="M350 64 C 362 34, 380 18, 400 8 C 390 32, 374 52, 354 68 Z" fill="#F4E8D2" stroke="#8774C8" strokeWidth="2" className="sway" style={{ transformOrigin: "352px 66px" }} />
      <rect x="40" y="70" width="56" height="20" rx="4" fill="#52A99A" /><rect x="46" y="54" width="48" height="16" rx="4" fill="#E99491" /><rect x="52" y="40" width="38" height="14" rx="4" fill="#8774C8" />
      <rect x="306" y="74" width="8" height="18" rx="2" fill="#E99491" transform="rotate(-20 310 84)" />
    </svg>
  );
}

export function ListeningArt() {
  return (
    <svg className="ws-art" viewBox="0 0 420 120" aria-hidden>
      <rect x="10" y="98" width="400" height="12" rx="6" fill="#F3B66D" />
      <path d="M150 92 v-26 a60 60 0 0 1 120 0 v26" stroke="#5276C9" strokeWidth="12" fill="none" strokeLinecap="round" />
      <rect x="134" y="66" width="34" height="34" rx="12" fill="#8774C8" /><rect x="252" y="66" width="34" height="34" rx="12" fill="#8774C8" />
      {[0, 1, 2].map((i) => <path key={i} className="note-float" style={{ animationDelay: `${i * .9}s` }} d={`M${300 + i * 26} ${70 - i * 8} v-28 l14 -4 v24`} stroke={["#E99491", "#52A99A", "#F3B66D"][i]} strokeWidth="4" fill="none" strokeLinecap="round" />)}
      <path d="M60 80 q10 -20 20 0 t20 0 t20 0" stroke="#52A99A" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ReadingArt() {
  return (
    <svg className="ws-art" viewBox="0 0 420 120" aria-hidden>
      <rect x="10" y="98" width="400" height="12" rx="6" fill="#F3B66D" />
      <path d="M110 96 q50 -20 100 0 q50 -20 100 0 v-64 q-50 -20 -100 0 q-50 -20 -100 0 z" fill="#fff" stroke="#52A99A" strokeWidth="3" />
      <path d="M210 32 v64" stroke="#52A99A" strokeWidth="2" />
      {[48, 60, 72].map((y) => <path key={y} d={`M124 ${y} q36 -8 74 0 M222 ${y} q36 -8 74 0`} stroke="#c9d3ee" strokeWidth="3" fill="none" />)}
      <rect x="232" y="56" width="40" height="8" rx="3" fill="#F3B66D" opacity=".8" />
      <path d="M210 30 C211 20 213 18 220 16 C213 15 211 12 210 4 C209 12 207 15 200 16 C207 18 209 20 210 30Z" fill="#F3B66D" className="twinkle" />
      <circle cx="350" cy="56" r="22" fill="none" stroke="#8774C8" strokeWidth="6" /><path d="M366 72 l22 22" stroke="#8774C8" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function EntranceArt() {
  return (
    <svg className="entrance-art" viewBox="0 0 420 380" aria-hidden>
      <defs>
        <radialGradient id="en-light" cx=".5" cy=".6" r=".6"><stop offset="0" stopColor="#fff4d6" /><stop offset=".6" stopColor="#F3B66D" /><stop offset="1" stopColor="#E99491" /></radialGradient>
        <radialGradient id="en-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe0a6" stopOpacity=".85" /><stop offset="1" stopColor="#ffe0a6" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="210" cy="360" rx="190" ry="16" fill="#2e2a6b" opacity=".2" />
      {/* the archway */}
      <path d="M70 360 V170 a140 140 0 0 1 280 0 V360 Z" fill="#5276C9" />
      <path d="M90 360 V176 a120 120 0 0 1 240 0 V360 Z" fill="#8774C8" />
      <path d="M118 360 V184 a92 92 0 0 1 184 0 V360 Z" fill="url(#en-light)" className="door-light" />
      {/* open doors */}
      <path d="M118 360 V184 a92 92 0 0 1 46 -80 l-10 256 z" fill="#3f5bb0" />
      <path d="M302 360 V184 a92 92 0 0 0 -46 -80 l10 256 z" fill="#3f5bb0" />
      <circle cx="150" cy="260" r="5" fill="#F3B66D" /><circle cx="270" cy="260" r="5" fill="#F3B66D" />
      {/* books glimpsed inside */}
      {["#5276C9", "#E99491", "#52A99A", "#8774C8", "#F3B66D", "#5276C9"].map((c, i) => <rect key={i} x={176 + i * 12} y={300 - (i % 2) * 8} width="10" height={40 + (i % 2) * 8} rx="2" fill={c} opacity=".85" />)}
      <rect x="170" y="340" width="80" height="6" rx="3" fill="#c98a3e" />
      <path d="M70 360 V170 a140 140 0 0 1 280 0 V360" fill="none" stroke="#F3B66D" strokeWidth="6" />
      <path d="M210 16 C212 30 216 34 230 36 C216 38 212 42 210 56 C208 42 204 38 190 36 C204 34 208 30 210 16 Z" fill="#F3B66D" className="float" />
      {/* lanterns */}
      {[40, 380].map((x, i) => (
        <g key={x} className="lantern" style={{ transformOrigin: `${x}px 60px`, animationDelay: `${i}s` }}>
          <circle cx={x} cy="150" r="56" fill="url(#en-glow)" className="glow-pulse" />
          <path d={`M${x} 60 V118`} stroke="#F3B66D" strokeWidth="2" />
          <path d={`M${x - 14} 120 h28 l6 12 v24 l-6 12 h-28 l-6 -12 v-24 z`} fill="#F3B66D" />
          <rect x={x - 8} y="130" width="16" height="28" rx="5" fill="#fff3d6" />
        </g>
      ))}
      {/* vines on the arch */}
      <g className="sway" style={{ transformOrigin: "90px 120px" }}>
        <path d="M110 90 C 80 140, 96 200, 70 260" stroke="#3f8f85" strokeWidth="4" fill="none" />
        {[[100, 120], [86, 160], [92, 200], [78, 236]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="11" ry="6" fill={i % 2 ? "#7cc4b2" : "#52A99A"} transform={`rotate(${i * 50} ${x} ${y})`} />)}
      </g>
      <g className="sway" style={{ transformOrigin: "320px 110px", animationDelay: "1s" }}>
        <path d="M300 84 C 330 140, 320 190, 346 250" stroke="#3f8f85" strokeWidth="4" fill="none" />
        {[[314, 116], [326, 156], [328, 196], [340, 232]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="11" ry="6" fill={i % 2 ? "#52A99A" : "#7cc4b2"} transform={`rotate(${i * -50} ${x} ${y})`} />)}
      </g>
      {/* stack of books + owl at the door */}
      <rect x="20" y="320" width="56" height="14" rx="4" fill="#E99491" /><rect x="26" y="306" width="48" height="14" rx="4" fill="#52A99A" /><rect x="22" y="292" width="52" height="14" rx="4" fill="#5276C9" />
      <g className="owl">
        <ellipse cx="48" cy="270" rx="18" ry="20" fill="#8774C8" /><ellipse cx="48" cy="276" rx="11" ry="12" fill="#b9addf" />
        <circle cx="41" cy="264" r="6" fill="#fff" /><circle cx="55" cy="264" r="6" fill="#fff" />
        <circle className="blink" cx="41" cy="264" r="3" fill="#2e2a4a" /><circle className="blink" cx="55" cy="264" r="3" fill="#2e2a4a" />
        <path d="M45 270 l3 5 l3 -5 z" fill="#F3B66D" />
      </g>
    </svg>
  );
}

export function TeacherStudyArt() {
  return (
    <svg className="teacher-art" viewBox="0 0 360 200" aria-hidden>
      <ellipse cx="180" cy="192" rx="160" ry="8" fill="#2e2a6b" opacity=".2" />
      <rect x="30" y="140" width="300" height="14" rx="7" fill="#F3B66D" />
      <rect x="44" y="154" width="14" height="40" rx="5" fill="#e09f55" /><rect x="302" y="154" width="14" height="40" rx="5" fill="#e09f55" />
      {["#5276C9", "#E99491", "#52A99A", "#8774C8"].map((c, i) => <rect key={c} x={60 + i * 6} y={126 - i * 14} width={92 - i * 10} height="14" rx="4" fill={c} />)}
      <g className="owl">
        <ellipse cx="94" cy="58" rx="24" ry="26" fill="#8774C8" /><ellipse cx="94" cy="66" rx="15" ry="16" fill="#b9addf" />
        <circle cx="85" cy="50" r="9" fill="#fff" /><circle cx="103" cy="50" r="9" fill="#fff" />
        <circle className="blink" cx="85" cy="50" r="4.5" fill="#2e2a4a" /><circle className="blink" cx="103" cy="50" r="4.5" fill="#2e2a4a" />
        <path d="M90 58 l4 6 l4 -6 z" fill="#F3B66D" />
        <rect x="76" y="26" width="36" height="6" rx="2" fill="#2e2a4a" /><path d="M84 26 l10 -10 l10 10 z" fill="#2e2a4a" /><path d="M112 28 v14" stroke="#F3B66D" strokeWidth="2" />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="float" style={{ animationDelay: `${i * .7}s` }}>
          <rect x={190 + i * 40} y={70 - (i % 2) * 18} width="52" height="34" rx="4" fill="#fff" stroke="#8774C8" strokeWidth="2" transform={`rotate(${(i - 1) * 8} ${216 + i * 40} ${86 - (i % 2) * 18})`} />
          <path d={`M${190 + i * 40} ${70 - (i % 2) * 18} l26 18 l26 -18`} fill="none" stroke="#8774C8" strokeWidth="2" transform={`rotate(${(i - 1) * 8} ${216 + i * 40} ${86 - (i % 2) * 18})`} />
          <circle cx={216 + i * 40} cy={90 - (i % 2) * 18} r="6" fill="#E99491" />
        </g>
      ))}
      <ellipse cx="290" cy="138" rx="14" ry="6" fill="#5276C9" /><rect x="278" y="118" width="24" height="20" rx="6" fill="#5276C9" />
      <path d="M290 120 C 298 96, 310 84, 326 76 C 318 94, 306 110, 294 124 Z" fill="#F4E8D2" stroke="#8774C8" strokeWidth="1.5" />
    </svg>
  );
}

export function WaxSeal({ letter = "R", size = 44 }: { letter?: string; size?: number }) {
  return (
    <svg className="wax-seal" width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M24 2 l5 4 l6 -1 l2 6 l6 2 l-1 6 l4 5 l-4 5 l1 6 l-6 2 l-2 6 l-6 -1 l-5 4 l-5 -4 l-6 1 l-2 -6 l-6 -2 l1 -6 l-4 -5 l4 -5 l-1 -6 l6 -2 l2 -6 l6 1 z" fill="#E99491" />
      <circle cx="24" cy="24" r="13" fill="#d97a77" stroke="#f6c1be" strokeWidth="1.5" />
      <text x="24" y="30" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff6ee" fontFamily="Georgia, serif">{letter}</text>
    </svg>
  );
}

/** Rabeha's archive room: crates of documents being sorted onto four skill shelves. */
export function ArchiveRoomArt() {
  const shelf = (x: number, c: string, label: string, n: number) => (
    <g key={label}>
      <path d={`M${x} 190 V70 q0 -20 20 -20 h56 q20 0 20 20 V190 z`} fill={c} />
      <path d={`M${x + 8} 186 V74 q0 -14 14 -14 h52 q14 0 14 14 V186 z`} fill="#fff" opacity=".18" />
      {[110, 150, 186].map((y) => <rect key={y} x={x + 4} y={y} width="88" height="5" rx="2.5" fill="#F3B66D" />)}
      {Array.from({ length: n }).map((_, i) => <rect key={i} className="bk-in" style={{ animationDelay: `${i * 0.25}s` }} x={x + 12 + (i % 5) * 14} y={i < 5 ? 82 : 122} width="11" height="28" rx="2" fill={["#F4E8D2", "#fde2b8", "#fff"][i % 3]} />)}
      <text x={x + 48} y="44" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">{label}</text>
    </g>
  );
  return (
    <svg className="archive-art" viewBox="0 0 520 230" aria-hidden>
      <ellipse cx="260" cy="222" rx="240" ry="8" fill="#2e2a6b" opacity=".2" />
      {shelf(10, "#E99491", "Speaking", 8)}
      {shelf(118, "#5276C9", "Listening", 2)}
      {shelf(296, "#52A99A", "Reading", 5)}
      {shelf(404, "#8774C8", "Writing", 7)}
      {/* sorting table with an open crate and a floating document */}
      <rect x="226" y="176" width="68" height="10" rx="5" fill="#F3B66D" />
      <rect x="232" y="186" width="6" height="34" fill="#d9954a" /><rect x="282" y="186" width="6" height="34" fill="#d9954a" />
      <path d="M232 176 l6 -26 h44 l6 26 z" fill="#d9954a" /><path d="M238 150 h44" stroke="#fde2b8" strokeWidth="3" />
      <g className="float">
        <rect x="236" y="80" width="48" height="60" rx="5" fill="#fff" stroke="#8774C8" strokeWidth="2.5" />
        <path d="M244 96 h32 M244 106 h26 M244 116 h30 M244 126 h20" stroke="#b9addf" strokeWidth="3" strokeLinecap="round" />
        <text x="260" y="76" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">.docx</text>
      </g>
      <path className="twinkle" d="M300 70 C301 77 303 79 310 80 C303 81 301 83 300 90 C299 83 297 81 290 80 C297 79 299 77 300 70Z" fill="#F3B66D" />
      <path className="twinkle" style={{ animationDelay: "1s" }} d="M218 100 C219 105 220 106 225 107 C220 108 219 109 218 114 C217 109 216 108 211 107 C216 106 217 105 218 100Z" fill="#fde2b8" />
    </svg>
  );
}
