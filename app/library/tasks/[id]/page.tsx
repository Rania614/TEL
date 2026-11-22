import Link from "next/link";
import { notFound } from "next/navigation";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { taskStatus, latestSubmission } from "@/lib/progress";
import { SKILL_LABEL, fmtDate } from "@/lib/labels";
import { historyFor } from "@/lib/views";
import { Crumbs, StatusPill } from "@/components/Shell";
import { TaskBrief } from "@/components/TaskBrief";
import { SubmissionHistory } from "@/components/SubmissionHistory";
import Workspace from "./Workspace";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const lang = await getLang();
  const db = await read();
  const task = db.tasks.find((x) => x.id === id);
  const session = task && db.sessions.find((s) => s.id === task.sessionId);
  if (!task || !session || (!session.published && user.role !== "TEACHER")) notFound();
  const attachments = task.attachmentIds.map((a) => db.files.find((f) => f.id === a)).filter((f) => !!f);

  const crumbs = [
    { href: user.role === "TEACHER" ? "/teacher" : "/library", label: user.role === "TEACHER" ? t(lang, "dashboard") : t(lang, "library") },
    { href: "/library/sessions", label: t(lang, "sessions") },
    { href: `/library/sessions/${session.id}?tab=${task.skill.toLowerCase()}`, label: `${lang === "ar" ? "الحصة" : "Session"} ${session.number} · ${SKILL_LABEL[task.skill]}` },
    { label: task.title },
  ];

  const level = db.levels.find((l) => l.id === session.levelId);
  const label = `${level ? `${level.title} · ` : ""}Session ${session.number}`;
  const taskMaterials = db.materials.filter((m) => m.taskId === task.id);
  const listeningMaterials = task.skill === "LISTENING" ? db.materials.filter((m) => m.sessionId === session.id && m.skill === "LISTENING" && !m.taskId) : [];
  const brief = <TaskBrief task={task} attachments={attachments as NonNullable<(typeof attachments)[number]>[]} materials={taskMaterials} sessionLabel={label} />;

  if (user.role === "TEACHER") {
    const students = db.users.filter((u) => u.role === "STUDENT");
    return (
      <>
        <Crumbs items={crumbs} />
        <div className="workspace">
          {brief}
          <div className="paper stack">
            <div className="spread"><h2 style={{ margin: 0 }}>Students' work</h2><Link className="btn small" href={`/teacher/sessions/${session.id}`}>✎ Edit task</Link></div>
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Student</th><th>Status</th><th>Latest</th><th></th></tr></thead>
              <tbody>{students.map((s) => {
                const latest = latestSubmission(db, task.id, s.id);
                return (
                  <tr key={s.id}>
                    <td>{s.name}</td><td><StatusPill status={taskStatus(db, task, s.id)} lang={lang} /></td>
                    <td>{latest ? `v${latest.version} · ${fmtDate(latest.createdAt)}` : "—"}</td>
                    <td>{latest && <Link className="btn small" href={`/teacher/review/${latest.id}`}>Review</Link>}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          </div>
        </div>
      </>
    );
  }

  const draft = db.drafts.find((d) => d.taskId === id && d.studentId === user.id) ?? null;
  const draftFiles = (draft?.fileIds ?? []).map((f) => db.files.find((x) => x.id === f)).filter((f) => !!f);
  const status = taskStatus(db, task, user.id);
  const history = historyFor(db, user.id, id);
  const glossary = Object.fromEntries(
    [...db.vocabulary.map((v) => [v.word.toLowerCase(), v.meaning]), ...db.expressions.map((e) => [e.expression.toLowerCase(), e.meaning])]
  );

  return (
    <>
      <Crumbs items={crumbs} />
      <div className="spread" style={{ marginBottom: "1rem" }}>
        <span className="row"><StatusPill status={status} lang={lang} />
          {status === "NEEDS_REVISION" && <span className="world-text">Rabeha asked for a revision — see her feedback below, edit and submit again.</span>}</span>
        <a href="#workspace" className="btn small jump">↓ {task.skill === "SPEAKING" ? (lang === "ar" ? "إلى ركن التسجيل" : "Go to the recording corner") : (lang === "ar" ? "إلى مساحة العمل" : "Go to your workspace")}</a>
      </div>
      <div className="workspace">
        {brief}
        <Workspace task={task} status={status} media={listeningMaterials.map((m) => ({ title: m.title, url: m.url }))} draft={draft} draftFiles={draftFiles as NonNullable<(typeof draftFiles)[number]>[]} glossary={glossary} />
      </div>
      <section className="paper" style={{ marginTop: "1.5rem" }} id="history">
        <h2>{lang === "ar" ? "سجل التسليمات والملاحظات" : "Submission history & feedback"}</h2>
        <SubmissionHistory items={history} task={task} lang={lang} />
      </section>
    </>
  );
}
