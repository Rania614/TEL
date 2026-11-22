import type { Database } from "@/lib/types";
import { t } from "@/lib/i18n";
import { MILESTONES, REWARD_POINTS, ROOM_LEVELS, roomState, totalPoints } from "@/lib/rewards";
import { fmtDate } from "@/lib/labels";
import { Crumbs } from "@/components/Shell";
import { StudyRoom } from "@/components/StudyRoom";

export function AchievementsView({ db, studentId, lang, crumbs }: { db: Database; studentId: string; lang: "en" | "ar"; crumbs?: boolean }) {
  const mine = db.achievements.filter((a) => a.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const points = totalPoints(db, studentId);
  const room = roomState(points);
  const handed = new Set(db.submissions.filter((s) => s.studentId === studentId).map((s) => s.taskId)).size;
  const ar = lang === "ar";
  return (
    <>
      {crumbs && <Crumbs items={[{ href: "/library", label: t(lang, "library") }, { label: t(lang, "achievements") }]} />}
      {crumbs && <h1 className="world-title">{t(lang, "achievements")}</h1>}
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="room-card">
          <StudyRoom unlocked={room.unlocked} books={handed + mine.length} />
          <div className="caption">
            <strong>{points} {t(lang, "points")} ✦ · {ar ? "المستوى" : "level"} {room.level}/{ROOM_LEVELS.length}</strong>
            <div className="progress"><span style={{ width: `${Math.round(room.progress * 100)}%` }} /></div>
          </div>
        </div>
        <div className="panel">
          <h2 style={{ fontSize: "1.4rem" }}>{ar ? "كيف تنمو غرفتك" : "How your room grows"}</h2>
          <ol className="levels">
            {ROOM_LEVELS.map((l, i) => (
              <li key={l.key} className={points >= l.points ? "done" : ""}>
                <span className="lv">{points >= l.points ? "✦" : i + 1}</span>
                <span style={{ flex: 1 }}>{ar ? l.titleAr : l.title}</span>
                <span className="muted" style={{ fontSize: ".85rem" }}>{l.points} ✦</span>
              </li>
            ))}
          </ol>
          <p className="muted" style={{ fontSize: ".88rem", marginBottom: 0 }}>
            {ar
              ? `+${REWARD_POINTS.SUBMIT} عند أول تسليم لكل واجب · +${REWARD_POINTS.REVIEWED} عندما تعتمده رابحة · +${REWARD_POINTS.SESSION} عند إكمال الحصة. إعادة التسليم لا تكرر المكافأة.`
              : `+${REWARD_POINTS.SUBMIT} the first time you hand in a task · +${REWARD_POINTS.REVIEWED} when Rabeha marks it Reviewed · +${REWARD_POINTS.SESSION} when every task in a session is reviewed. Re-submitting never repeats a reward.`}
          </p>
        </div>
      </div>

      <h2 className="world-title" style={{ marginTop: "2rem", fontSize: "1.5rem" }}>{ar ? "المكافآت المكتسبة" : "Earned"} ({mine.length})</h2>
      {mine.length === 0 ? <div className="empty"><span className="glyph">🕯</span>{ar ? "سلّمي أول واجب لتحصلي على أول ختم." : "Hand in your first task to earn your first seal."}</div> : (
        <div className="charm-shelf">
          {mine.map((a) => (
            <div key={a.id} className="medal"><div className="seal float" style={{ animationDelay: `${(a.points % 5) * 0.4}s` }}>{a.icon}</div><strong>{a.title}</strong><span className="muted" style={{ fontSize: ".82rem" }}>+{a.points} · {fmtDate(a.createdAt)}</span></div>
          ))}
        </div>
      )}
      <h2 className="world-title" style={{ marginTop: "2rem", fontSize: "1.5rem" }}>{ar ? "محطات قادمة" : "Milestones to discover"}</h2>
      <div className="charm-shelf">
        {MILESTONES.filter((m) => !mine.some((a) => a.key === `milestone:${m.key}`)).map((m) => (
          <div key={m.key} className="medal locked"><div className="seal">{"?"}</div><strong>{m.title}</strong><span className="muted" style={{ fontSize: ".82rem" }}>+{m.points}</span></div>
        ))}
      </div>
    </>
  );
}
