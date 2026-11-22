import Link from "next/link";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { sessionProgress } from "@/lib/progress";
import { Crumbs, StatusPill } from "@/components/Shell";

const COVERS = ["#5276C9", "#8774C8", "#52A99A", "#E99491", "#d9954a", "#6c5bb0"];

export default async function SessionsPage() {
  const user = await requirePageUser();
  const lang = await getLang();
  const db = await read();
  const isTeacher = user.role === "TEACHER";
  const sessions = db.sessions.filter((s) => isTeacher || s.published).sort((a, b) => a.number - b.number);

  return (
    <>
      <Crumbs items={[{ href: isTeacher ? "/teacher" : "/library", label: isTeacher ? t(lang, "dashboard") : t(lang, "library") }, { label: t(lang, "sessions") }]} />
      <div className="spread" style={{ marginBottom: "1.2rem" }}>
        <div>
          <h1 className="world-title">{t(lang, "sessions")}</h1>
          <p className="world-text" style={{ margin: 0 }}>{lang === "ar" ? "اختاري كتاباً لفتح الحصة." : "Choose a book to open the session."}</p>
        </div>
        {isTeacher && <Link className="btn" href="/teacher/sessions">＋ {lang === "ar" ? "حصة جديدة" : "New session"}</Link>}
      </div>

      {sessions.length === 0 ? (
        <div className="empty"><span className="glyph">📚</span>{lang === "ar" ? "لا توجد حصص بعد." : "No sessions on the shelf yet."}</div>
      ) : [...db.levels].sort((a, b) => a.number - b.number).map((lv) => {
        const inLevel = sessions.filter((x) => x.levelId === lv.id);
        if (!inLevel.length) return null;
        return (
          <section key={lv.id} style={{ marginBottom: "2rem" }}>
            <h2 className="world-title" style={{ fontSize: "1.6rem" }}>✦ {lv.title} <span style={{ fontSize: "1rem", opacity: .8 }}>· {inLevel.length} {inLevel.length === 1 ? "session" : "sessions"}</span></h2>
            <div className="shelf-row">
              {inLevel.map((s, i) => {
                const p = isTeacher ? null : sessionProgress(db, s.id, user.id);
                return (
                  <Link key={s.id} href={`/library/sessions/${s.id}`} className="book" style={{ ["--c" as string]: COVERS[(i + lv.number) % COVERS.length] }}>
                    <div className="cover">
                      <span className="frame" />
                      <span className="num">{lang === "ar" ? "الحصة" : "Session"} {s.number}</span>
                      <span className="title">{s.title}</span>
                      <div className="foot">
                        {p ? (
                          <>
                            <span>{p.percent}% · {p.handedIn}/{p.total} {lang === "ar" ? "مسلّم" : "handed in"}</span>
                            <div className="progress"><span style={{ width: `${p.percent}%` }} /></div>
                            <StatusPill status={p.status} lang={lang} />
                          </>
                        ) : (
                          <span>{db.tasks.filter((x) => x.sessionId === s.id).length} {lang === "ar" ? "واجب" : "tasks"}{!s.published && " · draft"}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {inLevel.length < 6 && (
                <div className="shelf-deco" aria-hidden>
                  {Array.from({ length: 26 }).map((_, i) => (
                    <span key={i} style={{ height: `${150 + ((i * 37) % 70)}px`, width: `${22 + ((i * 7) % 14)}px`, background: COVERS[(i + 2) % COVERS.length], opacity: .55 + ((i % 3) * .15) }} />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
      {!isTeacher && <p className="world-text" style={{ fontSize: ".85rem", marginTop: "1rem" }}>
        {lang === "ar" ? "النسبة: الواجب المسلَّم = نصف، والواجب المراجَع = كامل." : "Progress: a handed-in task counts half, a reviewed task counts in full."}
      </p>}
    </>
  );
}
