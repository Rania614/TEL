import Link from "next/link";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t, personName } from "@/lib/i18n";
import { latestSubmission, taskStatus } from "@/lib/progress";
import { totalPoints, roomState, ROOM_LEVELS } from "@/lib/rewards";
import { avatarGlyph, fmtDate, SKILL_ICON } from "@/lib/labels";
import { StatusPill } from "@/components/Shell";
import { TeacherStudyArt } from "@/components/art/Scenes";

export default async function TeacherHome() {
  const lang = await getLang();
  const db = await read();
  const students = db.users.filter((u) => u.role === "STUDENT");
  const queue = students.flatMap((s) => db.tasks.map((tk) => ({ s, tk, sub: latestSubmission(db, tk.id, s.id) })))
    .filter((r) => r.sub?.status === "SUBMITTED")
    .sort((a, b) => a.sub!.createdAt.localeCompare(b.sub!.createdAt));

  return (
    <>
      <section className="teacher-hero">
        <div className="signboard">
          <span className="hand" style={{ fontSize: "1.5rem", color: "var(--lav-deep)" }}>{lang === "ar" ? "أهلاً بكِ في مكتبك" : "Welcome to your study"},</span>
          <h1>{lang === "ar" ? "رابحة" : "Rabeha"} — {t(lang, "dashboard")}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{queue.length ? (lang === "ar" ? `${queue.length} رسالة من الطالبات بانتظار قراءتك.` : `${queue.length} piece${queue.length > 1 ? "s" : ""} of work waiting on your desk.`) : (lang === "ar" ? "لا يوجد شيء بانتظارك الآن." : "Nothing waiting on your desk right now.")}</p>
      <div className="row">
        <Link className="btn" href="/teacher/import">📦 Smart Session Import</Link>
        <Link className="btn ghost" href="/teacher/sessions">📖 {t(lang, "manageSessions")}</Link>
        <Link className="btn ghost" href="/library/sessions">{t(lang, "sessions")}</Link>
        <Link className="btn ghost" href="/library/expressions">{t(lang, "expressions")}</Link>
      </div>
        </div>
        <TeacherStudyArt />
      </section>

      <section className="paper" style={{ marginBottom: "1.5rem" }}>
        <div className="spread"><h2 style={{ margin: 0 }}>✉ {t(lang, "pendingReviews")} ({queue.length})</h2></div>
        {queue.length === 0 ? <div className="empty" style={{ marginTop: "1rem" }}><span className="glyph">☕</span>All caught up — no submissions waiting.</div> : (
          <div className="table-wrap" style={{ marginTop: ".8rem" }}><table className="tbl">
            <thead><tr><th>Student</th><th>Task</th><th>Version</th><th>Handed in</th><th></th></tr></thead>
            <tbody>{queue.map(({ s, tk, sub }) => (
              <tr key={sub!.id}>
                <td>{avatarGlyph(s.avatar)} {personName(lang, s)}</td>
                <td>{SKILL_ICON[tk.skill]} {tk.title}</td>
                <td>v{sub!.version}</td><td>{fmtDate(sub!.createdAt)}</td>
                <td><Link className="btn small" href={`/teacher/review/${sub!.id}`}>Review</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <h2 className="world-title">{t(lang, "students")}</h2>
      <div className="grid-2">
        {students.map((s) => {
          const statuses = db.tasks.map((tk) => taskStatus(db, tk, s.id));
          const c = (k: string) => statuses.filter((x) => x === k).length;
          const pts = totalPoints(db, s.id);
          const room = roomState(pts);
          return (
            <Link key={s.id} href={`/teacher/students/${s.id}`} className="card student-card">
              <div className="row"><span className="avatar">{avatarGlyph(s.avatar)}</span>
                <div><h3>{s.name} <span className="muted" style={{ fontFamily: "Tajawal, sans-serif", fontWeight: 400 }}>{s.nameAr}</span></h3>
                  <span className="muted" style={{ fontSize: ".85rem" }}>@{s.username} · {pts} 🔖 · room level {room.level}/{ROOM_LEVELS.length}</span></div></div>
              <div className="meta">
                <StatusPill status="NOT_STARTED" lang={lang} /> {c("NOT_STARTED")}
                <StatusPill status="IN_PROGRESS" lang={lang} /> {c("IN_PROGRESS")}
                <StatusPill status="SUBMITTED" lang={lang} /> {c("SUBMITTED")}
                <StatusPill status="NEEDS_REVISION" lang={lang} /> {c("NEEDS_REVISION")}
                <StatusPill status="REVIEWED" lang={lang} /> {c("REVIEWED")}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
