import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t, personName } from "@/lib/i18n";
import { roomState, totalPoints, ROOM_LEVELS } from "@/lib/rewards";
import { taskStatus, unseenFeedbackCount } from "@/lib/progress";
import { StudyRoom } from "@/components/StudyRoom";
import { Sparkle } from "@/components/art/World";
import {
  SessionsShelfArt, VocabVaultArt, IdiomsShelfArt, AssignmentsDeskArt,
  MaterialsCabinetArt, FeedbackDeskArt, AchievementsAlcoveArt,
} from "@/components/art/Stations";

function Station({ href, area, art, title, hint, count, alert }: {
  href: string; area: string; art: ReactNode; title: string; hint: string; count?: string; alert?: boolean;
}) {
  return (
    <Link href={href} className={`station station--${area}`}>
      <span className="art">{art}</span>
      <span className="label">
        {count && <span className={`count${alert ? " alert-count" : ""}`}>{count}</span>}
        <strong>{title}</strong>
        <small>{hint}</small>
      </span>
    </Link>
  );
}

export default async function LibraryPage() {
  const user = await requirePageUser();
  if (user.role === "TEACHER") redirect("/teacher");
  const lang = await getLang();
  const db = await read();
  const ar = lang === "ar";

  const published = new Set(db.sessions.filter((s) => s.published).map((s) => s.id));
  const tasks = db.tasks.filter((tk) => published.has(tk.sessionId));
  const statuses = tasks.map((tk) => taskStatus(db, tk, user.id));
  const open = statuses.filter((s) => s === "NOT_STARTED" || s === "IN_PROGRESS" || s === "NEEDS_REVISION").length;
  const handedIn = statuses.filter((s) => s === "SUBMITTED" || s === "REVIEWED").length;
  const points = totalPoints(db, user.id);
  const room = roomState(points);
  const myAch = db.achievements.filter((a) => a.studentId === user.id);
  const unseen = unseenFeedbackCount(db, user.id);
  const mySubIds = new Set(db.submissions.filter((s) => s.studentId === user.id).map((s) => s.id));
  const fbCount = db.feedback.filter((f) => mySubIds.has(f.submissionId)).length;
  const learned = db.entryStates.filter((e) => e.studentId === user.id && e.learned).length;
  const sessionCount = db.sessions.filter((s) => s.published).length;

  return (
    <>
      <section className="hall-head">
        <div className="greeting">
          <span className="eyebrow">{t(lang, "welcome")}, <Sparkle size={20} /></span>
          <div className="signboard">
            <h1>{ar ? `مكتبة ${personName(lang, user)} السحرية` : `${personName(lang, user)}'s magical library`}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {ar ? "اختاري ركناً من المكتبة لتبدئي. كل واجب تسلّمينه يضيف شيئاً جديداً إلى زاويتك." : "Choose a corner of the library to begin. Every task you hand in adds something new to your study nook."}
            </p>
            <div className="stat-row">
              <div className="stat"><b>{open}</b><span>{ar ? "واجبات مفتوحة" : "open tasks"}</span></div>
              <div className="stat"><b>{handedIn}</b><span>{ar ? "مسلَّمة" : "handed in"}</span></div>
              <div className="stat"><b>{points}</b><span>{t(lang, "points")} ✦</span></div>
            </div>
          </div>
        </div>
        <Link href="/library/achievements" className="room-card" aria-label={t(lang, "yourRoom")}>
          <StudyRoom unlocked={room.unlocked} books={handedIn + myAch.length} title={t(lang, "yourRoom")} />
          <div className="caption">
            <div className="spread">
              <strong>{ar ? "زاويتك السحرية" : "Your study nook"} · {ar ? "المستوى" : "level"} {room.level}/{ROOM_LEVELS.length}</strong>
              {room.next && <span className="muted">{t(lang, "nextUnlock")}: {ar ? room.next.titleAr : room.next.title} · {room.next.points} ✦</span>}
            </div>
            <div className="progress" aria-hidden><span style={{ width: `${Math.round(room.progress * 100)}%` }} /></div>
          </div>
        </Link>
      </section>

      <h2 className="sr-only">{ar ? "أركان المكتبة" : "Library corners"}</h2>
      <nav className="realm" aria-label={ar ? "أركان المكتبة" : "Library corners"}>
        <Station href="/library/sessions" area="sessions" art={<SessionsShelfArt />} title={t(lang, "sessions")}
          hint={ar ? "كل حصة كتاب ينتظر أن يُفتح" : "Every session is a book waiting to be opened"}
          count={`${sessionCount} ${ar ? "كتاب" : sessionCount === 1 ? "book" : "books"}`} />
        <Station href="/library/vocabulary" area="vocab" art={<VocabVaultArt />} title={t(lang, "vocabulary")}
          hint={ar ? `${learned} من ${db.vocabulary.length} تعلّمتِها` : `${learned} of ${db.vocabulary.length} words learned`} count={`${db.vocabulary.length}`} />
        <Station href="/library/expressions" area="idioms" art={<IdiomsShelfArt />} title={t(lang, "expressions")}
          hint={ar ? "تعابير وأفعال مركبة ومتلازمات" : "Idioms, phrasal verbs & collocations"} count={`${db.expressions.length}`} />
        <Station href="/library/assignments" area="assign" art={<AssignmentsDeskArt open={open} />} title={t(lang, "assignments")}
          hint={open ? (ar ? `${open} بانتظارك` : `${open} waiting for you`) : (ar ? "أنجزتِ كل شيء ✦" : "All caught up ✦")} />
        <Station href="/library/feedback" area="feedback" art={<FeedbackDeskArt unread={unseen} />} title={t(lang, "feedback")}
          hint={unseen ? (ar ? `${unseen} رسالة جديدة من رابحة` : `${unseen} new letter${unseen > 1 ? "s" : ""} from Rabeha`) : (ar ? "رسائل رابحة وتصحيحاتها" : "Rabeha's letters & corrections")}
          count={unseen ? `${unseen} ${ar ? "جديد" : "new"}` : fbCount ? `${fbCount}` : undefined} alert={unseen > 0} />
        <Station href="/library/materials" area="materials" art={<MaterialsCabinetArt />} title={t(lang, "materials")}
          hint={ar ? "فيديوهات وصوتيات وملفات" : "Videos, audio, PDFs & links"} count={`${db.materials.length}`} />
        <Station href="/library/achievements" area="achieve" art={<AchievementsAlcoveArt earned={myAch.length} />} title={t(lang, "achievements")}
          hint={ar ? "أختامك ومكافآتك" : "Your seals, charms & milestones"} count={`${myAch.length}`} />
      </nav>
    </>
  );
}
