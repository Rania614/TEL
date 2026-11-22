import Link from "next/link";
import { redirect } from "next/navigation";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { historyFor } from "@/lib/views";
import { fmtDate } from "@/lib/labels";
import { Crumbs, StatusPill } from "@/components/Shell";
import { FeedbackBlock } from "@/components/SubmissionHistory";
import MarkSeen from "./MarkSeen";

export default async function FeedbackPage() {
  const user = await requirePageUser();
  if (user.role === "TEACHER") redirect("/teacher");
  const lang = await getLang();
  const db = await read();
  const items = historyFor(db, user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const withFb = items.filter((s) => s.feedback.length);
  const waiting = items.filter((s) => !s.feedback.length);
  const unseen = withFb.some((s) => s.feedback.some((f) => !f.seenAt));

  return (
    <>
      {unseen && <MarkSeen />}
      <Crumbs items={[{ href: "/library", label: t(lang, "library") }, { label: t(lang, "feedback") }]} />
      <h1 className="world-title">{t(lang, "feedback")}</h1>
      <p className="world-text">Rabeha's notes on each version you handed in. New notes have a gold edge.</p>
      {withFb.length === 0 && <div className="empty"><span className="glyph">✉</span>No feedback yet. When Rabeha reviews your work, her notes and audio corrections arrive here.</div>}
      <div className="stack" style={{ gap: "1.2rem" }}>
        {withFb.map((s) => {
          const task = db.tasks.find((x) => x.id === s.taskId);
          return (
            <section key={s.id} className="paper stack" style={{ gap: ".7rem" }}>
              <div className="spread">
                <Link href={`/library/tasks/${s.taskId}#history`}><h3 style={{ margin: 0 }}>{task?.title ?? "Task"} · v{s.version}</h3></Link>
                <span className="row"><span className="muted" style={{ fontSize: ".85rem" }}>handed in {fmtDate(s.createdAt)}</span><StatusPill status={s.status} lang={lang} /></span>
              </div>
              {s.feedback.map((f) => <FeedbackBlock key={f.id} f={f} />)}
            </section>
          );
        })}
      </div>
      {waiting.length > 0 && <>
        <h2 className="world-title" style={{ marginTop: "2rem", fontSize: "1.4rem" }}>Waiting for review</h2>
        <div className="grid-3">{waiting.map((s) => (
          <Link key={s.id} href={`/library/tasks/${s.taskId}#history`} className="card">
            <h3>{db.tasks.find((x) => x.id === s.taskId)?.title} · v{s.version}</h3>
            <div className="meta"><StatusPill status={s.status} lang={lang} />{fmtDate(s.createdAt)}</div>
          </Link>
        ))}</div>
      </>}
    </>
  );
}
