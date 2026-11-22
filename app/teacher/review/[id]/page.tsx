import Link from "next/link";
import { notFound } from "next/navigation";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { historyFor } from "@/lib/views";
import { fmtDate, SKILL_ICON } from "@/lib/labels";
import { Crumbs, StatusPill } from "@/components/Shell";
import { Markdown } from "@/components/Markdown";
import { FileView } from "@/components/Media";
import { FeedbackBlock } from "@/components/SubmissionHistory";
import ReviewForm from "./ReviewForm";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const db = await read();
  const sub = db.submissions.find((s) => s.id === id);
  if (!sub) notFound();
  const task = db.tasks.find((x) => x.id === sub.taskId)!;
  const student = db.users.find((u) => u.id === sub.studentId)!;
  const versions = historyFor(db, student.id, task.id).sort((a, b) => b.version - a.version);
  const current = versions.find((v) => v.id === id)!;

  return (
    <>
      <Crumbs items={[{ href: "/teacher", label: t(lang, "dashboard") }, { href: `/teacher/students/${student.id}`, label: student.name }, { label: `${task.title} v${sub.version}` }]} />
      <div className="spread" style={{ marginBottom: "1rem" }}>
        <h1 className="world-title" style={{ margin: 0 }}>{SKILL_ICON[task.skill]} {task.title} <span style={{ fontSize: "1.2rem", opacity: .85 }}>· {student.name} · v{sub.version}</span></h1>
        <StatusPill status={sub.status} lang={lang} />
      </div>
      <div className="row" style={{ marginBottom: "1rem" }}>
        {versions.map((v) => (
          <Link key={v.id} href={`/teacher/review/${v.id}`} className={`btn small ${v.id === id ? "" : "ghost"}`}>v{v.version} · {v.status === "SUBMITTED" ? "waiting" : v.status === "REVIEWED" ? "reviewed" : "revision"}</Link>
        ))}
      </div>

      <div className="workspace">
        <div className="paper stack">
          <h2 style={{ margin: 0 }}>Submitted work</h2>
          <span className="muted">Handed in {fmtDate(current.createdAt)}</span>
          {current.files.length > 0 && <div className="file-list">{current.files.map((f) => <FileView key={f.id} f={f} />)}</div>}
          {current.notes && <div><strong>Student's notes / plan</strong><div className="answer-text" style={{ fontSize: "1.15rem" }}>{current.notes}</div></div>}
          {current.text && <div><strong>Typed answer</strong> <span className="muted" style={{ fontSize: ".85rem" }}>(select a phrase, then “Add selected text as correction”)</span>
            <div className="answer-text" data-answer>{current.text}</div></div>}
          {task.questions.map((q, i) => (
            <div key={q.id}><strong>{i + 1}. {q.prompt}</strong><div className="answer-text" data-answer style={{ fontSize: "1.15rem" }}>{current.answers[q.id] || "—"}</div></div>
          ))}
          {current.feedback.length > 0 && <>
            <h3>Feedback already given on this version</h3>
            {current.feedback.map((f) => <FeedbackBlock key={f.id} f={{ ...f, seenAt: f.seenAt ?? "unseen-by-student" }} />)}
          </>}
          <details className="editor-block">
            <summary>Task instructions</summary>
            <Markdown source={task.instructions} />
          </details>
        </div>
        <ReviewForm submissionId={sub.id} studentName={student.name} />
      </div>
    </>
  );
}
