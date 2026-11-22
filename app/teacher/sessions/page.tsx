import Link from "next/link";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Crumbs } from "@/components/Shell";
import NewSession from "./NewSession";

export default async function ManageSessions() {
  const lang = await getLang();
  const db = await read();
  const levels = [...db.levels].sort((a, b) => a.number - b.number);
  return (
    <>
      <Crumbs items={[{ href: "/teacher", label: t(lang, "dashboard") }, { label: t(lang, "manageSessions") }]} />
      <div className="spread"><h1 className="world-title">{t(lang, "manageSessions")}</h1>
        <Link className="btn" href="/teacher/import">📦 Smart Session Import</Link></div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          {!db.sessions.length && <div className="empty">No sessions yet — create one, or import a course document.</div>}
          {levels.map((lv) => {
            const list = db.sessions.filter((s) => s.levelId === lv.id).sort((a, b) => a.number - b.number);
            return (
              <section key={lv.id} className="stack" style={{ gap: ".7rem" }}>
                <h2 className="world-title" style={{ fontSize: "1.4rem", margin: 0 }}>{lv.title}</h2>
                {!list.length && <div className="empty">No sessions in this level yet.</div>}
                {list.map((s) => (
                  <Link key={s.id} href={`/teacher/sessions/${s.id}`} className="card">
                    <span className="muted" style={{ fontSize: ".85rem" }}>Session {s.number}{s.published ? "" : " · draft (hidden from students)"}{s.sourceDocumentId ? " · imported" : ""}</span>
                    <h3>{s.title}</h3>
                    <div className="meta">
                      {(["SPEAKING", "LISTENING", "READING", "WRITING"] as const).map((k) => {
                        const n = db.tasks.filter((x) => x.sessionId === s.id && x.skill === k).length;
                        return n ? <span key={k} className="chip">{k[0] + k.slice(1).toLowerCase()} {n}</span> : null;
                      })}
                      <span>{db.materials.filter((x) => x.sessionId === s.id).length} materials</span>
                    </div>
                  </Link>
                ))}
              </section>
            );
          })}
        </div>
        <NewSession levels={levels.map((l) => ({ id: l.id, number: l.number, title: l.title, next: db.sessions.filter((s) => s.levelId === l.id).reduce((n, s) => Math.max(n, s.number), 0) + 1 }))} />
      </div>
    </>
  );
}
