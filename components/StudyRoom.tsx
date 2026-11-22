/**
 * The student's enchanted study nook. Pieces appear as `unlocked` grows
 * (keys from ROOM_LEVELS in lib/rewards.ts); `books` fills the floating shelf.
 */
export function StudyRoom({ unlocked, books = 0, title }: { unlocked: string[]; books?: number; title?: string }) {
  const has = (k: string) => unlocked.includes(k);
  const colors = ["#5276C9", "#E99491", "#52A99A", "#F3B66D", "#8774C8", "#6d8fe0", "#7cc4b2"];
  const shelfBooks = Math.min(books, 10);
  const tallBooks = Math.min(Math.max(books - 10, 0), 15);
  return (
    <svg viewBox="0 0 600 340" role="img" aria-label={title ?? "Study nook"}>
      <defs>
        <linearGradient id="sn-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6c8be0" /><stop offset="1" stopColor="#9a8ad6" /></linearGradient>
        <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f4a93" /><stop offset="1" stopColor="#c7a6d6" /></linearGradient>
        <radialGradient id="sn-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe0a6" stopOpacity=".8" /><stop offset="1" stopColor="#ffe0a6" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="600" height="340" fill="url(#sn-wall)" />
      <path d="M0 250 Q300 226 600 250 V340 H0 Z" fill="#5f5fae" />
      <ellipse cx="300" cy="300" rx="210" ry="26" fill="#52A99A" opacity=".55" />
      <ellipse cx="300" cy="300" rx="170" ry="18" fill="none" stroke="#F3B66D" strokeOpacity=".7" strokeWidth="2.5" strokeDasharray="8 8" />

      {/* small round window — always */}
      {!has("window") && (
        <g>
          <circle cx="300" cy="100" r="44" fill="#F3B66D" /><circle cx="300" cy="100" r="38" fill="url(#sn-sky)" />
          <circle cx="312" cy="86" r="9" fill="#fff1d6" />
          <path d="M262 100 h76 M300 62 v76" stroke="#F3B66D" strokeWidth="4" />
        </g>
      )}
      {has("window") && (
        <g>
          <path d="M226 232 V96 a74 74 0 0 1 148 0 V232 Z" fill="#F3B66D" />
          <path d="M236 228 V98 a64 64 0 0 1 128 0 V228 Z" fill="url(#sn-sky)" />
          <circle cx="330" cy="78" r="13" fill="#fff1d6" /><circle cx="336" cy="73" r="11" fill="#5268b8" />
          {[[258, 70], [280, 130], [346, 150], [262, 190], [312, 110]].map(([x, y], i) => <circle key={i} className="twinkle" style={{ animationDelay: `${i * .5}s` }} cx={x} cy={y} r="2.2" fill="#fff6dd" />)}
          <path d="M300 34 V228 M236 140 h128" stroke="#F3B66D" strokeWidth="4" />
          <path d="M236 228 q20 -40 40 -20 q22 -38 40 -6 q24 -30 48 -4 V228 Z" fill="#3f8f85" opacity=".9" />
        </g>
      )}

      {/* floating shelf — always; books grow with work handed in */}
      <rect x="40" y="104" width="180" height="10" rx="5" fill="#F3B66D" />
      {Array.from({ length: shelfBooks }).map((_, i) => (
        <rect key={i} x={46 + i * 16} y={104 - (34 + (i % 3) * 7)} width="13" height={34 + (i % 3) * 7} rx="3" fill={colors[i % colors.length]} />
      ))}
      {shelfBooks === 0 && <text x="130" y="94" textAnchor="middle" fontSize="13" fill="#fff6dd" opacity=".85" fontFamily="Caveat, cursive">your first book lands here ✦</text>}

      {has("plant") && (
        <g className="sway" style={{ transformOrigin: "196px 60px" }}>
          <path d="M196 0 V40" stroke="#F3B66D" strokeWidth="2" />
          <path d="M180 40 h32 l-4 22 h-24 z" fill="#E99491" />
          <path d="M188 60 C180 90 176 110 182 140 M200 60 C210 92 214 110 206 136" stroke="#3f8f85" strokeWidth="3" fill="none" />
          {[[182, 90], [178, 116], [184, 138], [210, 92], [212, 116], [206, 136]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="5" fill={i % 2 ? "#7cc4b2" : "#52A99A"} transform={`rotate(${i * 40} ${x} ${y})`} />)}
        </g>
      )}

      {has("shelf2") && (
        <g>
          <path d="M470 250 V70 q0 -24 24 -24 h60 q24 0 24 24 V250 z" fill="#5276C9" stroke="#F3B66D" strokeWidth="4" />
          {[110, 160, 210].map((y) => <rect key={y} x="476" y={y} width="96" height="6" rx="3" fill="#F3B66D" />)}
          {Array.from({ length: tallBooks }).map((_, i) => {
            const row = Math.floor(i / 5), col = i % 5; const h = 30 + ((i * 7) % 10);
            return <rect key={i} x={482 + col * 17} y={110 + row * 50 - h} width="14" height={h} rx="3" fill={colors[(i + 2) % colors.length]} />;
          })}
          {tallBooks === 0 && <text x="524" y="140" textAnchor="middle" fontSize="13" fill="#fff6dd" fontFamily="Caveat, cursive">room to grow</text>}
        </g>
      )}

      {has("armchair") && (
        <g>
          <rect x="46" y="200" width="112" height="56" rx="24" fill="#8774C8" />
          <rect x="34" y="184" width="30" height="76" rx="14" fill="#7462b6" /><rect x="140" y="184" width="30" height="76" rx="14" fill="#7462b6" />
          <rect x="58" y="160" width="88" height="60" rx="26" fill="#a493dd" />
          <rect x="74" y="210" width="56" height="16" rx="8" fill="#E99491" />
        </g>
      )}

      {/* desk */}
      {has("desk2") ? (
        <g>
          <rect x="196" y="226" width="208" height="16" rx="8" fill="#F3B66D" />
          <rect x="206" y="242" width="62" height="50" rx="10" fill="#e09f55" /><rect x="332" y="242" width="62" height="50" rx="10" fill="#e09f55" />
          <circle cx="237" cy="262" r="4" fill="#F4E8D2" /><circle cx="363" cy="262" r="4" fill="#F4E8D2" />
          <path d="M206 242 q100 14 188 0" stroke="#c98a3e" strokeWidth="2" fill="none" />
        </g>
      ) : (
        <g>
          <rect x="220" y="230" width="160" height="12" rx="6" fill="#F3B66D" />
          <rect x="232" y="242" width="9" height="50" rx="4" fill="#e09f55" /><rect x="359" y="242" width="9" height="50" rx="4" fill="#e09f55" />
        </g>
      )}
      {/* open notebook + quill + book stack */}
      <path d="M262 226 q18 -8 36 0 q18 -8 36 0 v-14 q-18 -8 -36 0 q-18 -8 -36 0 z" fill="#F4E8D2" stroke="#8774C8" strokeWidth="2" />
      <path d="M352 222 C 360 200, 372 188, 388 180 C 380 196, 368 210, 356 224 Z" fill="#fff" stroke="#8774C8" strokeWidth="1.5" />
      <rect x="228" y="214" width="28" height="12" rx="3" fill="#52A99A" /><rect x="231" y="204" width="24" height="10" rx="3" fill="#E99491" />

      {has("lamp") && (
        <g>
          <circle cx="388" cy="180" r="62" fill="url(#sn-glow)" className="glow-pulse" />
          <path d="M388 120 V150" stroke="#F3B66D" strokeWidth="2" />
          <path d="M374 150 h28 l6 12 v22 l-6 12 h-28 l-6 -12 v-22 z" fill="#F3B66D" stroke="#c98a3e" strokeWidth="2" />
          <rect x="380" y="160" width="16" height="26" rx="5" fill="#fff3d6" />
        </g>
      )}

      {has("globe") && (
        <g>
          <circle cx="430" cy="262" r="20" fill="#5276C9" stroke="#F3B66D" strokeWidth="3" />
          <path d="M418 254 q10 4 8 14 q10 -2 14 8" stroke="#7cc4b2" strokeWidth="5" fill="none" />
          <rect x="424" y="282" width="12" height="10" rx="2" fill="#F3B66D" />
          <g className="float"><circle cx="150" cy="140" r="16" fill="#b9addf" opacity=".9" /><circle cx="145" cy="134" r="5" fill="#fff" opacity=".8" /></g>
        </g>
      )}
    </svg>
  );
}
