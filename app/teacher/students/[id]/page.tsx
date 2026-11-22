import Link from "next/link";
import { notFound } from "next/navigation";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { latestSubmission, sessionProgress, taskStatus } from "@/lib/progress";
import { avatarGlyph, fmtDate, SKILL_ICON } from "@/lib/labels";
import { Crumbs, StatusPill } from "@/components/Shell";
import { AchievementsView } from "@/components/AchievementsView";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const db = await read();
  const s = db.users.find((u) => u.id === id && u.role === "STUDENT");
  if (!s) notFound();
  const lvn = (id: string) => db.levels.find((l) => l.id === id)?.number ?? 0;
  const sessions = [...db.sessions].sort((a, b) => lvn(a.levelId) - lvn(b.levelId) || a.number - b.number);

  return (
    <>
      <Crumbs items={[{ href: "/teacher", label: t(lang, "dashboard") }, { label: s.name }]} />
      <div className="row" style={{ marginBottom: "1rem" }}>
        <span className="avatar" style={{ width: 64, height: 64, fontSize: "2rem" }}>{avatarGlyph(s.avatar)}</span>
        <div><h1 className="world-title" style={{ margin: 0 }}>{s.name} <span style={{ fontFamily: "Tajawal, sans-serif", opacity: .85 }}>{s.nameAr}</span></h1>
          <span className="world-text">@{s.username} · {s.mobile}</span></div>
      </div>

      {sessions.map((sess) => {
        const p = sessionProgress(db, sess.id, s.id);
        const tasks = db.tasks.filter((x) => x.sessionId === sess.id).sort((a, b) => a.order - b.order);
        return (
          <section key={sess.id} className="paper" style={{ marginBottom: "1rem" }}>
            <div className="spread"><h2 style={{ margin: 0, fontSize: "1.4rem" }}>{db.levels.find((l) => l.id === sess.levelId)?.title} · Session {sess.number} · {sess.title}</h2><span className="row"><span className="muted">{p.percent}%</span><StatusPill status={p.status} lang={lang} /></span></div>
            {tasks.length === 0 ? <p className="muted">No tasks.</p> : (
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th>Task</th><th>Status</th><th>Versions</th><th>Latest</th><th></th></tr></thead>
                <tbody>{tasks.map((tk) => {
                  const latest = latestSubmission(db, tk.id, s.id);
                  const n = db.submissions.filter((x) => x.taskId === tk.id && x.studentId === s.id).length;
                  return (
                    <tr key={tk.id}>
                      <td>{SKILL_ICON[tk.skill]} {tk.title}</td><td><StatusPill status={taskStatus(db, tk, s.id)} lang={lang} /></td>
                      <td>{n}</td><td>{latest ? fmtDate(latest.createdAt) : "—"}</td>
                      <td>{latest && <Link className="btn small" href={`/teacher/review/${latest.id}`}>{latest.status === "SUBMITTED" ? "Review" : "Open"}</Link>}</td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            )}
          </section>
        );
      })}

      <h2 className="world-title" style={{ marginTop: "2rem" }}>{s.name}'s library & achievements</h2>
      <AchievementsView db={db} studentId={s.id} lang={lang} />
    </>
  );
}
