import type { FileAsset, Feedback, Submission, Task, User } from "@/lib/types";
import { fmtDate } from "@/lib/labels";
import { FileView } from "./Media";
import { StatusPill } from "./Shell";
import type { Lang } from "@/lib/i18n";
import { WaxSeal } from "./art/Scenes";

export type HistoryItem = Submission & { files: FileAsset[]; feedback: (Feedback & { audio: FileAsset | null })[] };

export function FeedbackBlock({ f, teacher }: { f: HistoryItem["feedback"][number]; teacher?: Pick<User, "name"> }) {
  return (
    <div className={`fb${f.seenAt ? "" : " new"}`}>
      <WaxSeal letter={(teacher?.name ?? "Rabeha").slice(0, 1)} />
      <div className="spread">
        <span className="letter-head">A letter from {teacher?.name ?? "Rabeha"} <span className="muted" style={{ fontFamily: "var(--sans)", fontSize: ".85rem" }}>· {fmtDate(f.createdAt)}</span></span>
        <span className="row" style={{ gap: ".4rem" }}>
          {!f.seenAt && <span className="chip">new</span>}
          {f.decision === "REVIEWED" && <span className="pill REVIEWED">Reviewed</span>}
          {f.decision === "NEEDS_REVISION" && <span className="pill NEEDS_REVISION">Revision requested</span>}
        </span>
      </div>
      {(f.score !== null || f.rating !== null) && (
        <div className="row">
          {f.score !== null && <span className="chip">Score: {f.score}/100</span>}
          {f.rating !== null && <span className="stars" aria-label={`${f.rating} of 5 stars`}>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>}
        </div>
      )}
      {f.text && <p className="letter-body" style={{ margin: 0 }}>{f.text}</p>}
      {f.audio && <FileView f={f.audio} />}
      {f.corrections.length > 0 && (
        <div className="stack" style={{ gap: ".4rem" }}>
          <strong style={{ fontSize: ".9rem" }}>Corrections</strong>
          {f.corrections.map((c, i) => (
            <div className="corr" key={i}>
              <span aria-hidden>✗</span><del>{c.original}</del>
              <span aria-hidden>✓</span><ins>{c.correction}</ins>
              {c.note && <><span /><span className="muted" style={{ fontSize: ".85rem" }}>{c.note}</span></>}
            </div>
          ))}
        </div>
      )}
      <span className="signoff">— {teacher?.name ?? "Rabeha"} ✦</span>
    </div>
  );
}

export function SubmissionHistory({ items, task, lang }: { items: HistoryItem[]; task: Task; lang: Lang }) {
  if (!items.length) return <div className="empty"><span className="glyph">✒</span>{lang === "ar" ? "لم تسلّمي هذا الواجب بعد." : "Nothing handed in yet. Your submissions and Rabeha's feedback will appear here."}</div>;
  return (
    <div className="history">
      {[...items].sort((a, b) => b.version - a.version).map((s) => (
        <div key={s.id} className="version">
          <div className="spread">
            <strong>{lang === "ar" ? "النسخة" : "Version"} {s.version} · <span className="muted" style={{ fontWeight: 400 }}>{fmtDate(s.createdAt)}</span></strong>
            <StatusPill status={s.status} lang={lang} />
          </div>
          {s.notes && <div><span className="muted" style={{ fontSize: ".85rem" }}>Notes / plan</span><div className="answer-text" style={{ fontSize: "1.15rem" }}>{s.notes}</div></div>}
          {s.text && <div className="answer-text">{s.text}</div>}
          {task.questions.filter((q) => s.answers[q.id]?.trim()).map((q, i) => (
            <div key={q.id}><strong style={{ fontSize: ".9rem" }}>{i + 1}. {q.prompt}</strong><div className="answer-text" style={{ fontSize: "1.15rem" }}>{s.answers[q.id]}</div></div>
          ))}
          {s.files.length > 0 && <div className="file-list">{s.files.map((f) => <FileView key={f.id} f={f} />)}</div>}
          {s.feedback.length > 0 && <div className="stack" style={{ gap: ".6rem" }}>{s.feedback.map((f) => <FeedbackBlock key={f.id} f={f} />)}</div>}
        </div>
      ))}
    </div>
  );
}
