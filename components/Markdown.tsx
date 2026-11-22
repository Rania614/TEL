import { Fragment, type ReactNode } from "react";

/** Tiny, safe markdown: ## headings, lists, > quotes, ---, **bold**, *italic*, [links](url). No HTML passthrough. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<em key={`${key}-${i++}`}>{tok.slice(1, -1)}</em>);
    else {
      const label = tok.slice(1, tok.indexOf("]"));
      out.push(<a key={`${key}-${i++}`} href={m[2]} target="_blank" rel="noopener noreferrer">{label}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className = "prose" }: { source: string; className?: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let olist: { n: number; text: string }[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length) {
      const k = `l${blocks.length}`;
      blocks.push(<ul key={k}>{list.map((li, i) => <li key={i}>{inline(li, `${k}-${i}`)}</li>)}</ul>);
      list = [];
    }
  };
  const flushOl = () => {
    if (olist.length) {
      const k = `o${blocks.length}`;
      blocks.push(<ol key={k} start={olist[0].n}>{olist.map((li, i) => <li key={i} value={li.n}>{inline(li.text, `${k}-${i}`)}</li>)}</ol>);
      olist = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      // keep the author's line breaks (course material often has one item per line)
      blocks.push(<p key={k}>{para.map((ln, i) => <Fragment key={i}>{i > 0 && <br />}{inline(ln, `${k}-${i}`)}</Fragment>)}</p>);
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*] /.test(line)) { flushPara(); flushOl(); list.push(line.replace(/^\s*[-*] /, "")); continue; }
    flushList();
    const num = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (num) { flushPara(); olist.push({ n: parseInt(num[1], 10), text: num[2] }); continue; }
    flushOl();
    if (!line.trim()) { flushPara(); continue; }
    const k = `b${blocks.length}`;
    if (line.startsWith("### ")) { flushPara(); blocks.push(<h4 key={k}>{inline(line.slice(4), k)}</h4>); }
    else if (line.startsWith("## ")) { flushPara(); blocks.push(<h3 key={k}>{inline(line.slice(3), k)}</h3>); }
    else if (line.startsWith("# ")) { flushPara(); blocks.push(<h2 key={k}>{inline(line.slice(2), k)}</h2>); }
    else if (line.startsWith("> ")) { flushPara(); blocks.push(<blockquote key={k}>{inline(line.slice(2), k)}</blockquote>); }
    else if (line === "---") { flushPara(); blocks.push(<hr key={k} />); }
    else para.push(line);
  }
  flushList(); flushOl(); flushPara();
  return <div className={className}><Fragment>{blocks}</Fragment></div>;
}
