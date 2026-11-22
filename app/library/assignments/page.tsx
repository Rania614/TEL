import Link from "next/link";
import { redirect } from "next/navigation";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { taskStatus } from "@/lib/progress";
import { SKILL_ICON, SKILL_LABEL, DIFFICULTY_LABEL, fmtDay } from "@/lib/labels";
import { Crumbs, StatusPill } from "@/components/Shell";
import type { TaskStatus } from "@/lib/types";

const GROUPS: { key: TaskStatus[]; en: string; ar: string }[] = [
  { key: ["NEEDS_REVISION"], en: "Needs revision", ar: "تحتاج مراجعة" },
  { key: ["NOT_STARTED"], en: "Pending", ar: "بانتظارك" },
  { key: ["IN_PROGRESS"], en: "In progress", ar: "قيد العمل" },
  { key: ["SUBMITTED"], en: "Submitted — waiting for Rabeha", ar: "مسلّمة — بانتظار رابحة" },
  { key: ["REVIEWED"], en: "Reviewed", ar: "تمت مراجعتها" },
];

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const user = await requirePageUser();
  if (user.role === "TEACHER") redirect("/teacher");
  const { skill } = await searchParams;
  const lang = await getLang();
  const db = await read();
  const published = new Set(db.sessions.filter((s) => s.published).map((s) => s.id));
  const rows = db.tasks.filter((x) => published.has(x.sessionId) && (!skill || x.skill === skill))
    .map((tk) => ({ tk, s: db.sessions.find((x) => x.id === tk.sessionId)!, status: taskStatus(db, tk, user.id) }));

  return (
    <>
      <Crumbs items={[{ href: "/library", label: t(lang, "library") }, { label: t(lang, "assignments") }]} />
      <h1 className="world-title">{t(lang, "assignments")}</h1>
      <div className="row" style={{ marginBottom: "1.2rem" }}>
        {["", "SPEAKING", "LISTENING", "READING", "WRITING"].map((k) => (
          <Link key={k} href={k ? `?skill=${k}` : "?"} className={`btn small ${(skill ?? "") === k ? "" : "ghost"}`}>{k ? `${SKILL_ICON[k]} ${SKILL_LABEL[k]}` : "All skills"}</Link>
        ))}
      </div>
      {rows.length === 0 && <div className="empty"><span className="glyph">📭</span>No assignments here yet.</div>}
      <div className="stack" style={{ gap: "1.6rem" }}>
        {GROUPS.map((g) => {
          const items = rows.filter((r) => g.key.includes(r.status));
          if (!items.length) return null;
          return (
            <section key={g.en}>
              <h2 className="world-title" style={{ fontSize: "1.4rem" }}>{lang === "ar" ? g.ar : g.en} <span style={{ fontSize: "1rem", opacity: .8 }}>({items.length})</span></h2>
              <div className="grid-3">
                {items.map(({ tk, s, status }) => (
                  <Link key={tk.id} href={`/library/tasks/${tk.id}`} className="card">
                    <span className="muted" style={{ fontSize: ".8rem" }}>{db.levels.find((l) => l.id === s.levelId)?.title} · Session {s.number} · {s.title}</span>
                    <h3>{SKILL_ICON[tk.skill]} {tk.title}</h3>
                    <div className="meta"><StatusPill status={status} lang={lang} />{tk.difficulty && <span>{DIFFICULTY_LABEL[tk.difficulty]}</span>}{tk.durationMin > 0 && <span>~{tk.durationMin} min</span>}
                      {tk.dueDate && <span>due {fmtDay(tk.dueDate)}</span>}</div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
