import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Crumbs } from "@/components/Shell";
import { MaterialCard } from "@/components/Media";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requirePageUser();
  const { type } = await searchParams;
  const lang = await getLang();
  const db = await read();
  const visibleSessions = new Set(db.sessions.filter((s) => s.published || user.role === "TEACHER").map((s) => s.id));
  const all = db.materials.filter((m) => !m.sessionId || visibleSessions.has(m.sessionId));
  const list = all.filter((m) => !type || m.type === type);
  const types = [...new Set(all.map((m) => m.type))];
  const names: Record<string, string> = { YOUTUBE: "Videos", LINK: "Links", AUDIO: "Audio", PDF: "PDFs", IMAGE: "Images", DOCUMENT: "Documents" };
  return (
    <>
      <Crumbs items={[{ href: user.role === "TEACHER" ? "/teacher" : "/library", label: user.role === "TEACHER" ? t(lang, "dashboard") : t(lang, "library") }, { label: t(lang, "materials") }]} />
      <h1 className="world-title">{t(lang, "materials")}</h1>
      <div className="row" style={{ marginBottom: "1.2rem" }}>
        <a className={`btn small ${type ? "ghost" : ""}`} href="?">All</a>
        {types.map((k) => <a key={k} className={`btn small ${type === k ? "" : "ghost"}`} href={`?type=${k}`}>{names[k]}</a>)}
      </div>
      {list.length === 0 ? <div className="empty"><span className="glyph">🗂</span>No materials here yet.</div> : (
        <div className="grid-2">
          {list.map((m) => {
            const s = db.sessions.find((x) => x.id === m.sessionId);
            return (
              <div key={m.id} className="stack" style={{ gap: ".3rem" }}>
                {s && <span className="world-text" style={{ fontSize: ".85rem" }}>📖 {db.levels.find((l) => l.id === s.levelId)?.title} · Session {s.number} · {s.title}{m.skill ? "" : " · general"}</span>}
                <MaterialCard m={m} file={m.fileId ? db.files.find((f) => f.id === m.fileId) : null} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
