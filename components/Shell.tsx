import Link from "next/link";
import type { ReactNode } from "react";
import { read } from "@/lib/store";
import { t, personName, type Lang } from "@/lib/i18n";
import { avatarGlyph } from "@/lib/labels";
import { unseenFeedbackCount } from "@/lib/progress";
import type { User } from "@/lib/types";
import { NavLinks, AchievementToaster } from "./ShellClient";
import { Emblem } from "./art/World";

export async function Shell({ user, lang, children }: { user: User; lang: Lang; children: ReactNode }) {
  const db = await read();
  const isTeacher = user.role === "TEACHER";
  const unseen = isTeacher ? 0 : unseenFeedbackCount(db, user.id);
  const pending = isTeacher ? countPending(db) : 0;
  const unseenAch = isTeacher ? [] : db.achievements.filter((a) => a.studentId === user.id && !a.seenAt);

  const links = isTeacher
    ? [
        { href: "/teacher", label: t(lang, "dashboard"), badge: pending },
        { href: "/teacher/sessions", label: lang === "ar" ? "إدارة الحصص" : "Manage" },
        { href: "/library/sessions", label: lang === "ar" ? "الحصص" : "Sessions" },
        { href: "/library/vocabulary", label: lang === "ar" ? "المفردات" : "Vocabulary" },
        { href: "/library/expressions", label: lang === "ar" ? "التعابير" : "Expressions" },
      ]
    : [
        { href: "/library", label: t(lang, "library") },
        { href: "/library/sessions", label: lang === "ar" ? "الحصص" : "Sessions" },
        { href: "/library/assignments", label: lang === "ar" ? "الواجبات" : "Assignments" },
        { href: "/library/feedback", label: lang === "ar" ? "الملاحظات" : "Feedback", badge: unseen },
        { href: "/library/achievements", label: lang === "ar" ? "الإنجازات" : "Achievements" },
      ];

  return (
    <>
      <div className="demo-banner">
        {lang === "ar" ? "نسخة تجريبية · البيانات محفوظة على هذا الخادم فقط" : "Demo MVP · data is stored on this server only · demo access, not secure sign-in"}
      </div>
      <header className="topbar">
        <div className="topbar-inner" style={{ position: "relative" }}>
          <Link href={isTeacher ? "/teacher" : "/library"} className="brand">
            <Emblem size={42} />
            <span>{t(lang, "appName")}</span>
          </Link>
          <NavLinks links={links} lang={lang} />
          <div className="who">
            <span className="avatar" aria-hidden>{avatarGlyph(user.avatar)}</span>
            <span className="who-name">{personName(lang, user)}</span>
          </div>
        </div>
      </header>
      <main className="page" id="main">{children}</main>
      {!isTeacher && <AchievementToaster initial={unseenAch} />}
    </>
  );
}

function countPending(db: Awaited<ReturnType<typeof read>>) {
  // latest submission per (task, student) that still waits for review
  const latest = new Map<string, { version: number; status: string }>();
  for (const s of db.submissions) {
    const k = `${s.taskId}:${s.studentId}`;
    const cur = latest.get(k);
    if (!cur || s.version > cur.version) latest.set(k, s);
  }
  return [...latest.values()].filter((s) => s.status === "SUBMITTED").length;
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i} className="row" style={{ gap: ".35rem" }}>
          {i > 0 && <span aria-hidden>›</span>}
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function StatusPill({ status, lang }: { status: string; lang: Lang }) {
  const key = status as Parameters<typeof t>[1];
  return <span className={`pill ${status}`}>{t(lang, key)}</span>;
}
