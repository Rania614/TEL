/**
 * Illustrated "stations" for the main library. Each is a standalone SVG with
 * its own personality; elements with .bk / .float / .glow-pulse / .flame
 * classes animate via CSS (gently, and only on hover where it is motion-heavy).
 */
const SPINES = ["#5276C9", "#8774C8", "#52A99A", "#F3B66D", "#E99491", "#6d8fe0", "#a493dd", "#3f8f85"];

function Books({ x, y, n, h = 46, seed = 0, w = 13 }: { x: number; y: number; n: number; h?: number; seed?: number; w?: number }) {
  let cx = x;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const bh = h - ((i * 7 + seed * 3) % 14);
        const bw = w + ((i + seed) % 3) * 2;
        const lean = (i + seed) % 7 === 3;
        const el = (
          <g key={i} className="bk" style={{ transitionDelay: `${i * 25}ms`, transformOrigin: `${cx + bw / 2}px ${y}px` }}>
            <rect x={cx} y={y - bh} width={bw} height={bh} rx="3" fill={SPINES[(i + seed) % SPINES.length]}
              transform={lean ? `rotate(-12 ${cx} ${y})` : undefined} />
            <rect x={cx + 2} y={y - bh + 6} width={bw - 4} height="3" rx="1.5" fill="#F4E8D2" opacity=".75" transform={lean ? `rotate(-12 ${cx} ${y})` : undefined} />
            <rect x={cx + 2} y={y - 12} width={bw - 4} height="2.5" rx="1" fill="#F4E8D2" opacity=".5" transform={lean ? `rotate(-12 ${cx} ${y})` : undefined} />
          </g>
        );
        cx += bw + 2 + (lean ? 4 : 0);
        return el;
      })}
    </g>
  );
}

const Star = ({ x, y, r = 8, fill = "#F3B66D", cls = "" }: { x: number; y: number; r?: number; fill?: string; cls?: string }) => (
  <path className={cls} d={`M${x} ${y - r} C${x + r * 0.12} ${y - r * 0.3} ${x + r * 0.3} ${y - r * 0.12} ${x + r} ${y} C${x + r * 0.3} ${y + r * 0.12} ${x + r * 0.12} ${y + r * 0.3} ${x} ${y + r} C${x - r * 0.12} ${y + r * 0.3} ${x - r * 0.3} ${y + r * 0.12} ${x - r} ${y} C${x - r * 0.3} ${y - r * 0.12} ${x - r * 0.12} ${y - r * 0.3} ${x} ${y - r} Z`} fill={fill} />
);

const Shadow = ({ cx, cy, rx }: { cx: number; cy: number; rx: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.12} fill="#2e2a6b" opacity=".22" />;

export function SessionsShelfArt() {
  return (
    <svg viewBox="0 0 340 330" role="img" aria-label="A tall magical bookshelf">
      <Shadow cx={170} cy={318} rx={150} />
      <path d="M40 315 V70 q0 -50 50 -58 q80 -18 160 0 q50 8 50 58 V315 Z" fill="#3f5bb0" />
      <path d="M52 305 V76 q0 -40 42 -48 q76 -16 152 0 q42 8 42 48 V305 Z" fill="#5276C9" />
      <path d="M40 315 V70 q0 -50 50 -58 q80 -18 160 0 q50 8 50 58 V315" fill="none" stroke="#F3B66D" strokeWidth="5" />
      <Star x={170} y={22} r={14} cls="float" />
      {[110, 170, 230, 292].map((y, r) => (
        <g key={y}>
          <rect x="60" y={y - 54} width="220" height="54" rx="6" fill="#3a4f9c" opacity=".55" />
          <Books x={66} y={y} n={r === 0 ? 11 : 12} seed={r * 2} h={r === 0 ? 40 : 48} />
          <rect x="54" y={y} width="232" height="8" rx="4" fill="#F3B66D" />
          <rect x="54" y={y + 6} width="232" height="3" rx="1.5" fill="#c98a3e" />
        </g>
      ))}
      {/* little ladder */}
      <g transform="rotate(10 300 200)">
        <rect x="292" y="110" width="5" height="205" rx="2" fill="#c98a3e" />
        <rect x="318" y="110" width="5" height="205" rx="2" fill="#c98a3e" />
        {[130, 160, 190, 220, 250, 280, 305].map((y) => <rect key={y} x="292" y={y} width="31" height="4" rx="2" fill="#F3B66D" />)}
      </g>
      <circle cx="96" cy="72" r="6" fill="#fff3d6" className="glow-pulse" />
      <circle cx="244" cy="72" r="6" fill="#fff3d6" className="glow-pulse" />
    </svg>
  );
}

export function VocabVaultArt() {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="A collection of glowing books">
      <defs>
        <radialGradient id="vv-aura" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff1c9" stopOpacity=".95" /><stop offset=".5" stopColor="#F3B66D" stopOpacity=".35" /><stop offset="1" stopColor="#8774C8" stopOpacity="0" /></radialGradient>
      </defs>
      <Shadow cx={150} cy={288} rx={110} />
      <circle cx="150" cy="120" r="110" fill="url(#vv-aura)" className="glow-pulse" />
      {/* pedestal */}
      <path d="M90 285 h120 l-14 -26 h-92 z" fill="#8774C8" />
      <rect x="104" y="196" width="92" height="64" rx="10" fill="#a493dd" />
      <rect x="96" y="186" width="108" height="16" rx="8" fill="#F4E8D2" />
      <path d="M118 220 h64 M118 236 h64" stroke="#8774C8" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      {/* floating books */}
      <g className="float" style={{ animationDelay: "0s" }}>
        <path d="M100 170 q25 -12 50 0 q25 -12 50 0 v-36 q-25 -12 -50 0 q-25 -12 -50 0 z" fill="#F4E8D2" stroke="#5276C9" strokeWidth="4" />
        <path d="M150 134 v36" stroke="#5276C9" strokeWidth="3" />
        <path d="M110 146 h30 M110 156 h24 M160 146 h30 M160 156 h22" stroke="#8774C8" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="float" style={{ animationDelay: "1.2s" }}>
        <rect x="70" y="70" width="44" height="56" rx="6" fill="#52A99A" transform="rotate(-16 92 98)" />
        <rect x="76" y="76" width="32" height="44" rx="3" fill="none" stroke="#F4E8D2" strokeWidth="2" transform="rotate(-16 92 98)" />
        <Star x={92} y={98} r={8} fill="#F4E8D2" />
      </g>
      <g className="float" style={{ animationDelay: "2.1s" }}>
        <rect x="188" y="62" width="46" height="58" rx="6" fill="#E99491" transform="rotate(14 211 91)" />
        <text x="211" y="98" textAnchor="middle" fontSize="22" fontWeight="700" fill="#F4E8D2" transform="rotate(14 211 91)" fontFamily="Georgia, serif">Aa</text>
      </g>
      <Star x={60} y={180} r={7} cls="twinkle" />
      <Star x={244} y={168} r={9} cls="twinkle" />
      <Star x={150} y={40} r={10} cls="twinkle" />
    </svg>
  );
}

export function IdiomsShelfArt() {
  const scroll = (x: number, y: number, c: string, i: number) => (
    <g key={x} className="bk" style={{ transformOrigin: `${x}px ${y}px`, transitionDelay: `${i * 40}ms` }}>
      <rect x={x - 9} y={y - 58} width="18" height="58" rx="9" fill={c} />
      <ellipse cx={x} cy={y - 58} rx="9" ry="4" fill="#F4E8D2" />
      <rect x={x - 10} y={y - 34} width="20" height="5" rx="2" fill="#F3B66D" />
    </g>
  );
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="A shelf of idioms and phrasal verbs">
      <Shadow cx={150} cy={290} rx={120} />
      <path d="M30 284 V96 q0 -26 26 -26 h188 q26 0 26 26 V284 z" fill="#3f8f85" />
      <path d="M42 280 V100 q0 -18 18 -18 h180 q18 0 18 18 V280 z" fill="#52A99A" />
      {[160, 240].map((y, r) => (
        <g key={y}>
          {r === 0
            ? [60, 84, 108, 132].map((x, i) => scroll(x, y, ["#F4E8D2", "#E99491", "#8774C8", "#F3B66D"][i], i))
            : <Books x={54} y={y} n={7} seed={5} h={52} />}
          <rect x="38" y={y} width="224" height="9" rx="4" fill="#F3B66D" />
        </g>
      ))}
      {/* speech bubbles as bookends */}
      <g className="float" style={{ animationDelay: ".4s" }}>
        <path d="M168 104 h76 q12 0 12 12 v26 q0 12 -12 12 h-46 l-14 14 v-14 h-16 q-12 0 -12 -12 v-26 q0 -12 12 -12 z" fill="#F4E8D2" stroke="#8774C8" strokeWidth="3" />
        <text x="206" y="134" textAnchor="middle" fontSize="15" fontWeight="700" fill="#5276C9" fontFamily="Georgia, serif">“…”</text>
      </g>
      <g className="float" style={{ animationDelay: "1.6s" }}>
        <path d="M176 200 h68 q10 0 10 10 v18 q0 10 -10 10 h-50 l-10 10 v-10 h-8 q-10 0 -10 -10 v-18 q0 -10 10 -10 z" fill="#fff" stroke="#E99491" strokeWidth="3" />
        <text x="212" y="224" textAnchor="middle" fontSize="13" fontWeight="700" fill="#E99491" fontFamily="Arial, sans-serif">up ↑</text>
      </g>
      {/* trailing plant on top */}
      <g className="sway" style={{ transformOrigin: "70px 70px" }}>
        <rect x="56" y="48" width="28" height="24" rx="6" fill="#E99491" />
        {[[50, 90], [44, 116], [52, 140], [90, 92], [96, 118]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="5" fill="#7cc4b2" transform={`rotate(${i * 35} ${x} ${y})`} />)}
        <path d="M62 70 C50 90 40 110 50 140 M78 70 C90 90 100 100 96 120" stroke="#3f8f85" strokeWidth="3" fill="none" />
        <ellipse cx="62" cy="46" rx="12" ry="7" fill="#52A99A" /><ellipse cx="80" cy="44" rx="11" ry="6" fill="#7cc4b2" />
      </g>
    </svg>
  );
}

export function AssignmentsDeskArt({ open = 0 }: { open?: number }) {
  return (
    <svg viewBox="0 0 320 260" role="img" aria-label="A desk with assignment folders">
      <Shadow cx={160} cy={250} rx={140} />
      {/* desk */}
      <rect x="24" y="150" width="272" height="18" rx="9" fill="#F3B66D" />
      <rect x="40" y="168" width="70" height="80" rx="8" fill="#e09f55" />
      <rect x="210" y="168" width="70" height="80" rx="8" fill="#e09f55" />
      <rect x="52" y="184" width="46" height="18" rx="5" fill="#F4E8D2" opacity=".7" /><rect x="52" y="214" width="46" height="18" rx="5" fill="#F4E8D2" opacity=".7" />
      <rect x="222" y="184" width="46" height="18" rx="5" fill="#F4E8D2" opacity=".7" /><rect x="222" y="214" width="46" height="18" rx="5" fill="#F4E8D2" opacity=".7" />
      {/* folder stack */}
      {["#5276C9", "#E99491", "#52A99A", "#8774C8"].map((c, i) => (
        <g key={c} className="bk" style={{ transformOrigin: "110px 150px", transitionDelay: `${i * 40}ms` }}>
          <path d={`M${60 + i * 4} ${148 - i * 12} h96 l6 -8 h30 v8 h0 v12 h-132 z`} fill={c} transform={`rotate(${(i % 2 ? 3 : -2)} 110 ${140 - i * 12})`} />
          <rect x={64 + i * 4} y={140 - i * 12} width="120" height="4" fill="#F4E8D2" opacity=".6" transform={`rotate(${(i % 2 ? 3 : -2)} 110 ${140 - i * 12})`} />
        </g>
      ))}
      {/* the open folder with a paper */}
      <g className="float" style={{ animationDelay: ".8s" }}>
        <rect x="70" y="58" width="84" height="44" rx="4" fill="#fff" stroke="#8774C8" strokeWidth="2" transform="rotate(-6 112 80)" />
        <path d="M80 72 h56 M80 82 h46 M80 92 h52" stroke="#a493dd" strokeWidth="3" strokeLinecap="round" transform="rotate(-6 112 80)" />
        <path d="M130 90 l6 6 l12 -14" stroke="#52A99A" strokeWidth="4" fill="none" strokeLinecap="round" transform="rotate(-6 112 80)" />
      </g>
      {/* pencil cup & lamp */}
      <rect x="236" y="112" width="30" height="38" rx="6" fill="#8774C8" />
      <rect x="240" y="74" width="5" height="40" rx="2" fill="#F3B66D" transform="rotate(-10 242 110)" />
      <rect x="250" y="70" width="5" height="44" rx="2" fill="#E99491" transform="rotate(4 252 110)" />
      <rect x="258" y="80" width="5" height="34" rx="2" fill="#52A99A" transform="rotate(14 260 110)" />
      <path d="M200 150 v-70 l-26 -20" stroke="#5276C9" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M156 58 l28 -18 l14 18 l-24 18 z" fill="#5276C9" />
      <ellipse cx="170" cy="78" rx="34" ry="22" fill="#fff1c9" opacity=".5" className="glow-pulse" />
      {open > 0 && <g><circle cx="286" cy="40" r="18" fill="#E99491" /><text x="286" y="47" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">{open}</text></g>}
    </svg>
  );
}

export function MaterialsCabinetArt() {
  return (
    <svg viewBox="0 0 280 300" role="img" aria-label="A magical cabinet of extra materials">
      <defs><radialGradient id="mc-in" cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#fff1c9" /><stop offset="1" stopColor="#b9addf" /></radialGradient></defs>
      <Shadow cx={140} cy={290} rx={110} />
      <path d="M40 286 V70 q0 -40 40 -46 q60 -12 120 0 q40 6 40 46 V286 z" fill="#8774C8" />
      <path d="M54 276 V76 q0 -28 30 -34 q56 -10 112 0 q30 6 30 34 V276 z" fill="url(#mc-in)" />
      <rect x="54" y="160" width="172" height="7" rx="3" fill="#8774C8" />
      {/* film reel / video */}
      <g className="float" style={{ animationDelay: ".3s" }}>
        <rect x="70" y="100" width="60" height="44" rx="8" fill="#E99491" />
        <path d="M94 112 l16 10 l-16 10 z" fill="#fff" />
      </g>
      {/* headphones */}
      <g className="float" style={{ animationDelay: "1.4s" }}>
        <path d="M152 138 v-14 a26 26 0 0 1 52 0 v14" stroke="#5276C9" strokeWidth="6" fill="none" />
        <rect x="146" y="128" width="14" height="22" rx="6" fill="#5276C9" /><rect x="196" y="128" width="14" height="22" rx="6" fill="#5276C9" />
      </g>
      {/* pdf scroll & image frame */}
      <g className="bk" style={{ transformOrigin: "100px 270px" }}>
        <rect x="74" y="190" width="50" height="64" rx="6" fill="#fff" stroke="#52A99A" strokeWidth="3" />
        <text x="99" y="228" textAnchor="middle" fontSize="14" fontWeight="800" fill="#52A99A" fontFamily="Arial, sans-serif">PDF</text>
      </g>
      <g className="bk" style={{ transformOrigin: "180px 270px", transitionDelay: "60ms" }}>
        <rect x="150" y="196" width="60" height="50" rx="6" fill="#F3B66D" />
        <rect x="156" y="202" width="48" height="38" rx="4" fill="#9fd3e0" />
        <path d="M158 236 l14 -16 l10 10 l8 -8 l12 14 z" fill="#52A99A" /><circle cx="194" cy="210" r="5" fill="#fff6dd" />
      </g>
      {/* doors ajar */}
      <path d="M54 276 V76 q0 -28 30 -34 l-34 -6 q-24 10 -24 40 V286 z" fill="#a493dd" />
      <path d="M226 276 V76 q0 -28 -30 -34 l34 -6 q24 10 24 40 V286 z" fill="#a493dd" />
      <circle cx="44" cy="170" r="5" fill="#F3B66D" /><circle cx="236" cy="170" r="5" fill="#F3B66D" />
      <Star x={140} y={18} r={12} cls="twinkle" />
    </svg>
  );
}

export function FeedbackDeskArt({ unread = 0 }: { unread?: number }) {
  return (
    <svg viewBox="0 0 320 280" role="img" aria-label="The teacher's correspondence desk">
      <Shadow cx={160} cy={270} rx={140} />
      {/* desk with hutch */}
      <path d="M40 170 V64 q0 -30 30 -30 h180 q30 0 30 30 V170 z" fill="#E99491" />
      <path d="M52 166 V70 q0 -22 22 -22 h172 q22 0 22 22 V166 z" fill="#f3b7b2" />
      {[86, 126].map((y) => <rect key={y} x="52" y={y} width="216" height="6" rx="3" fill="#E99491" />)}
      {/* cubby letters */}
      {[62, 112, 162, 212].map((x, i) => (
        <g key={x} className="bk" style={{ transformOrigin: `${x + 20}px 86px`, transitionDelay: `${i * 40}ms` }}>
          <rect x={x} y="60" width="42" height="26" rx="3" fill={["#F4E8D2", "#fff", "#F4E8D2", "#fff"][i]} transform={`rotate(${i % 2 ? 4 : -4} ${x + 21} 73)`} />
          <path d={`M${x} 60 l21 14 l21 -14`} fill="none" stroke="#8774C8" strokeWidth="2" transform={`rotate(${i % 2 ? 4 : -4} ${x + 21} 73)`} />
        </g>
      ))}
      <rect x="24" y="166" width="272" height="16" rx="8" fill="#c96f6c" />
      <rect x="44" y="182" width="16" height="84" rx="6" fill="#c96f6c" /><rect x="260" y="182" width="16" height="84" rx="6" fill="#c96f6c" />
      {/* letter with wax seal */}
      <g className="float" style={{ animationDelay: ".6s" }}>
        <rect x="90" y="130" width="92" height="56" rx="6" fill="#fff" stroke="#8774C8" strokeWidth="2.5" transform="rotate(-5 136 158)" />
        <path d="M90 130 l46 30 l46 -30" fill="none" stroke="#8774C8" strokeWidth="2.5" transform="rotate(-5 136 158)" />
        <circle cx="136" cy="160" r="11" fill="#E99491" stroke="#c96f6c" strokeWidth="2" />
        <text x="136" y="165" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" fontFamily="Georgia, serif">R</text>
      </g>
      {/* quill and ink */}
      <ellipse cx="226" cy="160" rx="16" ry="8" fill="#5276C9" /><rect x="214" y="138" width="24" height="22" rx="6" fill="#5276C9" />
      <path d="M226 140 C 236 110, 250 96, 268 84 C 258 104, 246 122, 230 142 Z" fill="#F4E8D2" stroke="#8774C8" strokeWidth="2" />
      {/* owl */}
      <g className="owl">
        <ellipse cx="270" cy="38" rx="22" ry="24" fill="#8774C8" />
        <ellipse cx="270" cy="46" rx="14" ry="14" fill="#b9addf" />
        <circle cx="262" cy="32" r="8" fill="#fff" /><circle cx="278" cy="32" r="8" fill="#fff" />
        <circle className="blink" cx="262" cy="32" r="4" fill="#2e2a4a" /><circle className="blink" cx="278" cy="32" r="4" fill="#2e2a4a" />
        <path d="M266 40 l4 6 l4 -6 z" fill="#F3B66D" />
        <path d="M252 18 l6 8 M288 18 l-6 8" stroke="#8774C8" strokeWidth="5" strokeLinecap="round" />
      </g>
      {unread > 0 && <g><circle cx="60" cy="36" r="18" fill="#E99491" stroke="#fff" strokeWidth="3" className="pulse-dot" /><text x="60" y="43" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">{unread}</text></g>}
    </svg>
  );
}

export function AchievementsAlcoveArt({ earned = 0 }: { earned?: number }) {
  const show = Math.min(earned, 6);
  return (
    <svg viewBox="0 0 320 300" role="img" aria-label="A trophy alcove of magical collectibles">
      <defs>
        <linearGradient id="ac-cup" x1="0" x2="1"><stop offset="0" stopColor="#e09f55" /><stop offset=".5" stopColor="#ffe2a8" /><stop offset="1" stopColor="#e09f55" /></linearGradient>
        <radialGradient id="ac-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff1c9" stopOpacity=".9" /><stop offset="1" stopColor="#fff1c9" stopOpacity="0" /></radialGradient>
      </defs>
      <Shadow cx={160} cy={290} rx={130} />
      <path d="M36 286 V110 a124 110 0 0 1 248 0 V286 z" fill="#5276C9" />
      <path d="M50 280 V114 a110 98 0 0 1 220 0 V280 z" fill="#7a95dc" />
      <path d="M36 286 V110 a124 110 0 0 1 248 0 V286" fill="none" stroke="#F3B66D" strokeWidth="5" />
      <circle cx="160" cy="120" r="80" fill="url(#ac-glow)" className="glow-pulse" />
      {/* big trophy */}
      <g className="float">
        <path d="M128 70 h64 v20 q0 40 -32 46 q-32 -6 -32 -46 z" fill="url(#ac-cup)" />
        <path d="M128 78 q-22 0 -20 18 q2 16 24 18 M192 78 q22 0 20 18 q-2 16 -24 18" stroke="#e09f55" strokeWidth="6" fill="none" />
        <rect x="152" y="134" width="16" height="18" fill="#e09f55" /><rect x="138" y="150" width="44" height="12" rx="4" fill="#8774C8" />
        <Star x={160} y={96} r={10} fill="#fff" />
      </g>
      {/* shelves with charms */}
      {[204, 266].map((y, r) => (
        <g key={y}>
          {Array.from({ length: 3 }).map((_, i) => {
            const idx = r * 3 + i;
            const lit = idx < show;
            const x = 92 + i * 68;
            return (
              <g key={i} className={lit ? "bk" : ""} style={{ transformOrigin: `${x}px ${y}px`, transitionDelay: `${i * 40}ms` }} opacity={lit ? 1 : 0.35}>
                {idx % 3 === 0 && <><circle cx={x} cy={y - 22} r="18" fill={lit ? "#F3B66D" : "#b9addf"} /><Star x={x} y={y - 22} r={9} fill="#fff" /></>}
                {idx % 3 === 1 && <><path d={`M${x - 14} ${y} q-4 -30 14 -40 q18 10 14 40 z`} fill={lit ? "#52A99A" : "#b9addf"} /><circle cx={x} cy={y - 24} r="6" fill="#fff6dd" /></>}
                {idx % 3 === 2 && <><rect x={x - 14} y={y - 34} width="28" height="34" rx="8" fill={lit ? "#E99491" : "#b9addf"} /><rect x={x - 10} y={y - 40} width="20" height="8" rx="3" fill="#F4E8D2" /><Star x={x} y={y - 16} r={6} fill="#fff" /></>}
              </g>
            );
          })}
          <rect x="56" y={y} width="208" height="8" rx="4" fill="#F3B66D" />
        </g>
      ))}
      <Star x={70} y={70} r={8} cls="twinkle" /><Star x={250} y={66} r={10} cls="twinkle" />
    </svg>
  );
}
