/**
 * The enchanted hall that sits behind every screen: blue-to-lavender walls,
 * tall arched starry windows, distant shelves, hanging lanterns, vines and
 * drifting sparkles. Pure SVG + CSS animation, fixed behind the content.
 */
export function WorldBackdrop() {
  const stars = [
    [70, 120], [110, 190], [150, 90], [95, 260], [170, 220], [60, 330], [140, 300],
    [1290, 110], [1340, 200], [1380, 120], [1310, 290], [1365, 330], [1260, 230],
  ];
  return (
    <div className="world" aria-hidden>
      <svg className="world-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="w-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5d7fd0" />
            <stop offset=".55" stopColor="#7d76c9" />
            <stop offset="1" stopColor="#9a83c9" />
          </linearGradient>
          <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f4a93" />
            <stop offset=".6" stopColor="#5b6fc4" />
            <stop offset="1" stopColor="#c7a6d6" />
          </linearGradient>
          <radialGradient id="w-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#ffd89a" stopOpacity=".75" />
            <stop offset="1" stopColor="#ffd89a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="w-moonglow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#fff4dc" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff4dc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="w-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6f68b8" />
            <stop offset="1" stopColor="#5a5aa8" />
          </linearGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#w-wall)" />
        {/* soft painted wall panels */}
        {[230, 470, 970, 1210].map((x) => (
          <rect key={x} x={x} y="70" width="200" height="620" rx="100" fill="#ffffff" opacity=".05" />
        ))}

        {/* left & right tall arched windows */}
        {[{ x: 30, moon: true }, { x: 1230, moon: false }].map(({ x, moon }) => (
          <g key={x}>
            <path d={`M${x} 760 V200 a90 90 0 0 1 180 0 V760 Z`} fill="#4b5fae" />
            <path d={`M${x + 14} 746 V205 a76 76 0 0 1 152 0 V746 Z`} fill="url(#w-sky)" />
            {moon && <><circle cx={x + 120} cy="200" r="60" fill="url(#w-moonglow)" /><circle cx={x + 120} cy="200" r="22" fill="#fff1d6" /><circle cx={x + 130} cy="193" r="19" fill="#5468ba" /></>}
            <path d={`M${x + 14} 746 q 40 -60 80 -30 q 40 -70 72 -10 V746 Z`} fill="#3f8f85" opacity=".85" />
            <line x1={x + 90} y1="120" x2={x + 90} y2="746" stroke="#f3cf95" strokeWidth="5" />
            <line x1={x + 14} y1="420" x2={x + 166} y2="420" stroke="#f3cf95" strokeWidth="5" />
            <path d={`M${x} 760 V200 a90 90 0 0 1 180 0 V760`} fill="none" stroke="#f3cf95" strokeWidth="7" />
          </g>
        ))}
        {stars.map(([x, y], i) => (
          <circle key={i} className="twinkle" style={{ animationDelay: `${(i % 6) * 0.6}s` }} cx={x} cy={y} r={i % 3 ? 2 : 3} fill="#fff6dd" />
        ))}

        {/* distant shelves, painted in lighter lavender */}
        {[260, 520, 920, 1160].map((x, i) => (
          <g key={x} opacity=".32">
            <path d={`M${x} 760 V230 q 0 -40 40 -40 h 100 q 40 0 40 40 V760 Z`} fill="#b9addf" />
            {[300, 400, 500, 600, 700].map((y) => <rect key={y} x={x + 8} y={y} width="164" height="8" rx="4" fill="#e9dcf6" />)}
            {[300, 400, 500, 600, 700].map((y, r) =>
              Array.from({ length: 7 }).map((_, k) => (
                <rect key={`${y}-${k}`} x={x + 14 + k * 22} y={y - 50 - ((k + r + i) % 3) * 8} width="16" height={50 + ((k + r + i) % 3) * 8} rx="4"
                  fill={["#f3b66d", "#e99491", "#52a99a", "#f4e8d2", "#5276c9"][(k + r + i) % 5]} />
              )))}
          </g>
        ))}

        {/* floor */}
        <path d="M0 760 Q720 700 1440 760 V900 H0 Z" fill="url(#w-floor)" />
        <ellipse cx="720" cy="830" rx="520" ry="46" fill="#52a99a" opacity=".35" />
        <ellipse cx="720" cy="830" rx="440" ry="34" fill="none" stroke="#f3cf95" strokeOpacity=".5" strokeWidth="3" strokeDasharray="10 10" />

        {/* hanging lanterns */}
        {[[380, 150], [720, 110], [1060, 150]].map(([x, len], i) => (
          <g key={x} className="lantern" style={{ animationDelay: `${i * 1.1}s`, transformOrigin: `${x}px 0px` }}>
            <line x1={x} y1="0" x2={x} y2={len} stroke="#f3cf95" strokeWidth="2" />
            <circle cx={x} cy={len + 30} r="90" fill="url(#w-glow)" className="glow-pulse" />
            <path d={`M${x - 16} ${len + 6} h32 l8 14 v26 l-8 14 h-32 l-8 -14 v-26 z`} fill="#f3b66d" stroke="#c98a3e" strokeWidth="2" />
            <rect x={x - 10} y={len + 18} width="20" height="24" rx="6" fill="#fff3d6" />
            <path d={`M${x - 12} ${len + 6} q12 -14 24 0`} fill="#c98a3e" />
          </g>
        ))}

        {/* vines from the ceiling */}
        {[[200, 220], [560, 160], [880, 180], [1250, 230]].map(([x, len], i) => (
          <g key={x} className="sway" style={{ animationDelay: `${i * 0.8}s`, transformOrigin: `${x}px 0px` }}>
            <path d={`M${x} 0 C ${x - 20} ${len / 3}, ${x + 24} ${len / 1.6}, ${x} ${len}`} stroke="#3f8f85" strokeWidth="4" fill="none" />
            {Array.from({ length: 6 }).map((_, k) => {
              const y = (k + 1) * (len / 7);
              const side = k % 2 ? 1 : -1;
              return <ellipse key={k} cx={x + side * 10} cy={y} rx="11" ry="6" fill={k % 3 ? "#52a99a" : "#7cc4b2"} transform={`rotate(${side * 30} ${x + side * 10} ${y})`} />;
            })}
          </g>
        ))}
      </svg>
      <div className="sparkles">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} style={{
            left: `${(i * 47) % 100}%`, top: `${(i * 31) % 90 + 5}%`,
            animationDelay: `${(i % 8) * 1.3}s`, animationDuration: `${9 + (i % 5) * 2}s`,
            ["--s" as string]: `${4 + (i % 4) * 2}px`,
          }} />
        ))}
      </div>
    </div>
  );
}

/** Small four-pointed sparkle used in headings and badges. */
export function Sparkle({ size = 18, color = "#F3B66D", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg className={`sparkle-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={color} />
    </svg>
  );
}

/** The app emblem: an open book with a star rising out of it. */
export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="emblem">
      <circle cx="32" cy="32" r="30" fill="#8774C8" />
      <circle cx="32" cy="32" r="26" fill="#5276C9" />
      <path d="M12 42 q10 -6 20 0 q10 -6 20 0 v-16 q-10 -6 -20 0 q-10 -6 -20 0 z" fill="#F4E8D2" />
      <path d="M32 26 v16" stroke="#8774C8" strokeWidth="2" />
      <path d="M32 6 C33 13 35 15 42 16 C35 17 33 19 32 26 C31 19 29 17 22 16 C29 15 31 13 32 6 Z" fill="#F3B66D" />
    </svg>
  );
}
