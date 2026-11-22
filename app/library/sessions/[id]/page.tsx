import Link from "next/link";
import { notFound } from "next/navigation";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { sessionProgress, taskStatus } from "@/lib/progress";
import { CATEGORY_LABEL, SKILL_LABEL, SUBMISSION_LABEL, TAG_LABEL } from "@/lib/labels";
import { EXTRA_TABS, SKILL_TABS, sessionTabs, type TabId } from "@/lib/session-view";
import { Crumbs, StatusPill } from "@/components/Shell";
import { MaterialCard } from "@/components/Media";
import { Markdown } from "@/components/Markdown";
import { SkillBadge } from "@/components/art/SkillIcons";

const EMPTY: Record<string, string> = {
  speaking: "No speaking activities in this session.",
  listening: "No listening activities in this session yet. When Rabeha adds a listening video or exercise, it will appear here.",
  reading: "No reading activities in this session.",
  writing: "No writing activities in this session.",
};

export default async function SessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  const user = await requirePageUser();
  const lang = await getLang();
  const db = await read();
  const isTeacher = user.role === "TEACHER";
  const s = db.sessions.find((x) => x.id === id);
  if (!s || (!s.published && !isTeacher)) notFound();
  const level = db.levels.find((l) => l.id === s.levelId);
  const tabs = sessionTabs(db, s.id);
  const firstWithContent = SKILL_TABS.find((x) => tabs[x.id].count)?.id ?? "speaking";
  const active = (([...SKILL_TABS, ...EXTRA_TABS] as { id: string }[]).some((x) => x.id === tab) ? tab : firstWithContent) as TabId;
  const content = tabs[active];
  const p = isTeacher ? null : sessionProgress(db, s.id, user.id);
  const fileOf = (fid: string | null) => (fid ? db.files.find((f) => f.id === fid) ?? null : null);
  const activeLabel = [...SKILL_TABS, ...EXTRA_TABS].find((x) => x.id === active)!.label;
  const skillTab = SKILL_TABS.find((x) => x.id === active);
  const ar = lang === "ar";

  return (
    <>
      <Crumbs items={[
        { href: isTeacher ? "/teacher" : "/library", label: isTeacher ? t(lang, "dashboard") : t(lang, "library") },
        { href: "/library/sessions", label: t(lang, "sessions") },
        { label: `${level ? `${level.title} · ` : ""}${ar ? "الحصة" : "Session"} ${s.number}` },
      ]} />

      <header className="session-cover">
        <div className="stack" style={{ gap: ".4rem" }}>
          <span className="hand" style={{ color: "var(--gold-soft)", fontSize: "1.4rem" }}>{level?.title ?? ""} · {ar ? "الحصة" : "Session"} {s.number}</span>
          <h1 className="world-title" style={{ margin: 0 }}>{s.title}</h1>
          {s.lessonTitle && s.lessonTitle !== s.title && <span className="world-text">Lesson: {s.lessonTitle}</span>}
          {s.description && <p className="world-text" style={{ margin: 0, whiteSpace: "pre-line", maxWidth: 760 }}>{s.description}</p>}
        </div>
        <div className="cover-side">
          {p ? (
            <div className="signboard" style={{ padding: "1rem 1.2rem" }}>
              <div className="spread"><strong>{ar ? "تقدّمك" : "Your progress"}</strong><StatusPill status={p.status} lang={lang} /></div>
              <div className="progress" style={{ margin: ".6rem 0" }}><span style={{ width: `${p.percent}%` }} /></div>
              <span className="muted" style={{ fontSize: ".88rem" }}>{p.handedIn}/{p.total} {ar ? "مسلّم" : "handed in"} · {p.reviewed} {ar ? "مراجَع" : "reviewed"}</span>
            </div>
          ) : isTeacher ? <Link href={`/teacher/sessions/${s.id}`} className="btn">✎ {ar ? "تحرير الحصة" : "Edit this session"}</Link> : null}
        </div>
      </header>

      <nav className="skill-doors" aria-label={ar ? "المهارات الأربع" : "The four skills"}>
        {SKILL_TABS.map((x) => {
          const c = tabs[x.id];
          return (
            <Link key={x.id} href={`?tab=${x.id}#skill`} scroll={false} className={`skill-door skill-${x.id}${active === x.id ? " active" : ""}${c.count ? "" : " empty"}`} aria-current={active === x.id ? "page" : undefined}>
              <SkillBadge skill={x.skill} size={58} />
              <span className="door-name">{ar ? x.labelAr : x.label}</span>
              <span className="door-count">{c.tasks.length ? `${c.tasks.length} ${c.tasks.length === 1 ? "task" : "tasks"}` : c.count ? `${c.count} item${c.count > 1 ? "s" : ""}` : (ar ? "فارغ" : "nothing yet")}</span>
            </Link>
          );
        })}
      </nav>

      <div className="explore-row">
        <span className="world-text" style={{ fontWeight: 800 }}>{ar ? "المزيد للاستكشاف:" : "More to explore:"}</span>
        {EXTRA_TABS.map((x) => (
          <Link key={x.id} href={`?tab=${x.id}#skill`} scroll={false} className={`explore-pill${active === x.id ? " active" : ""}${tabs[x.id].count ? "" : " empty"}`} aria-current={active === x.id ? "page" : undefined}>
            <span aria-hidden>{x.icon}</span> {x.label} <span className="n">{tabs[x.id].count}</span>
          </Link>
        ))}
      </div>

      <section id="skill" className={`paper skill-panel panel-${active}`} style={{ scrollMarginTop: "90px" }}>
        <div className="spread">
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: ".6rem" }}>
            {skillTab && <SkillBadge skill={skillTab.skill} size={44} />} {activeLabel}
          </h2>
          {isTeacher && <Link className="btn ghost small" href={`/teacher/sessions/${s.id}`}>＋ {ar ? "أضيفي محتوى" : "Add content"}</Link>}
        </div>

        {content.count === 0 && (
          <div className="empty" style={{ marginTop: "1rem" }}><span className="glyph">🕯</span>{EMPTY[active] ?? `Nothing for ${activeLabel.toLowerCase()} in this session.`}</div>
        )}

        {content.tasks.length > 0 && (
          <div className="task-list">
            {content.tasks.map((tk) => (
              <Link key={tk.id} href={`/library/tasks/${tk.id}`} className={`task-card skill-${tk.skill.toLowerCase()}`}>
                <SkillBadge skill={tk.skill} size={46} />
                <span className="tc-body">
                  <span className="tc-title">{tk.title}</span>
                  <span className="meta">
                    {!skillTab && <span className="chip">{SKILL_LABEL[tk.skill]}</span>}
                    {(tk.tags ?? []).map((g) => <span key={g} className="chip tag">{TAG_LABEL[g]}</span>)}
                    <span className="muted">{(tk.submissionTypes ?? []).map((x) => SUBMISSION_LABEL[x]).join(" + ")}</span>
                  </span>
                </span>
                <span className="tc-end">{isTeacher ? <span className="chip">Open</span> : <StatusPill status={taskStatus(db, tk, user.id)} lang={lang} />}<span className="arrow" aria-hidden>→</span></span>
              </Link>
            ))}
          </div>
        )}

        {content.sections.map((sec) => <div key={sec.id} className="section-note"><Markdown source={sec.body} /></div>)}

        {content.materials.length > 0 && <>
          <h3 style={{ marginTop: "1.4rem" }}>{ar ? "مواد" : "Materials"}</h3>
          <div className="grid-2">{content.materials.map((m) => <MaterialCard key={m.id} m={m} file={fileOf(m.fileId)} />)}</div>
        </>}

        {content.generalMaterials.length > 0 && <>
          <h3 style={{ marginTop: "1.4rem" }}>{ar ? "مواد عامة للحصة" : "General session materials"}</h3>
          <p className="muted" style={{ marginTop: 0 }}>{ar ? "روابط لم تُحدَّد لها مهارة بعد." : "Shared by Rabeha for this session. They aren't linked to one skill."}</p>
          <div className="grid-2">{content.generalMaterials.map((m) => <MaterialCard key={m.id} m={m} file={fileOf(m.fileId)} />)}</div>
        </>}

        {(content.expressions.length > 0 || content.vocabulary.length > 0) && <>
          <h3 style={{ marginTop: "1.4rem" }}>{ar ? "كلمات وتعابير" : "Words & expressions"}</h3>
          <div className="grid-3">
            {content.vocabulary.map((v) => <div key={v.id} className="card"><h3>{v.word}</h3>{v.pronunciation && <span className="muted">{v.pronunciation}</span>}{v.meaning && <span>{v.meaning}</span>}</div>)}
            {content.expressions.map((e) => (
              <div key={e.id} className="card"><h3>{e.expression}</h3><span className="chip" style={{ justifySelf: "start" }}>{CATEGORY_LABEL[e.category]}</span>
                {e.meaning ? <span>{e.meaning}</span> : <span className="muted" style={{ fontSize: ".85rem" }}>{ar ? "لم يُذكر المعنى في المصدر" : "Meaning not given in the source yet."}</span>}
                {e.example && <em>{e.example}</em>}</div>
            ))}
          </div>
        </>}
      </section>
    </>
  );
}
