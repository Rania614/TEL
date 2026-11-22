"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Achievement } from "@/lib/types";

export function NavLinks({ links, lang }: { links: { href: string; label: string; badge?: number }[]; lang: "en" | "ar" }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <button className="btn ghost small menu-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
        ☰ <span className="sr-only">Menu</span>
      </button>
      <nav id="main-nav" className={`nav${open ? " open" : ""}`} aria-label="Main">
        {links.map((l) => {
          const active = l.href === path || (l.href !== "/library" && l.href !== "/teacher" && path.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
              {l.label}
              {l.badge ? <span className="dot" aria-label={`${l.badge} new`}>{l.badge}</span> : null}
            </Link>
          );
        })}
        <LangToggle lang={lang} />
        <SignOut lang={lang} />
      </nav>
    </>
  );
}

export function LangToggle({ lang }: { lang: "en" | "ar" }) {
  const router = useRouter();
  const next = lang === "ar" ? "en" : "ar";
  return (
    <button className="linklike" onClick={() => { document.cookie = `lang=${next}; path=/; max-age=31536000`; router.refresh(); }}
      aria-label={next === "ar" ? "Switch to Arabic" : "Switch to English"}>
      {next === "ar" ? "العربية" : "English"}
    </button>
  );
}

export function SignOut({ lang }: { lang: "en" | "ar" }) {
  const router = useRouter();
  return (
    <button className="linklike" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/enter"); router.refresh(); }}>
      ⎋ <span>{lang === "ar" ? "خروج" : "Leave"}</span>
    </button>
  );
}

/** Shows a celebratory toast for rewards: unseen ones on load + live ones via events. */
export function AchievementToaster({ initial }: { initial: Achievement[] }) {
  const [items, setItems] = useState<Achievement[]>(initial);
  useEffect(() => {
    if (initial.length) fetch("/api/me/seen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ what: "achievements" }) });
    const on = (e: Event) => setItems((cur) => [...cur, ...((e as CustomEvent<Achievement[]>).detail)]);
    window.addEventListener("el:achievements", on);
    return () => window.removeEventListener("el:achievements", on);
  }, [initial.length]);
  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => setItems((cur) => cur.slice(1)), 5200);
    return () => clearTimeout(t);
  }, [items]);
  if (!items.length) return null;
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {items.slice(0, 3).map((a) => (
        <div className="toast" key={a.id}>
          <div className="seal" aria-hidden>{a.icon}</div>
          <span className="burst" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => {
              const ang = (i / 12) * Math.PI * 2;
              return <i key={i} style={{ ["--x" as string]: `${Math.cos(ang) * 60}px`, ["--y" as string]: `${Math.sin(ang) * 60}px`, ["--c" as string]: ["#F3B66D", "#E99491", "#52A99A", "#8774C8"][i % 4] }} />;
            })}
          </span>
          <div>
            <strong>{a.title}</strong>
            <div style={{ fontSize: ".85rem" }}>+{a.points} bookmarks ✦ your library grows</div>
          </div>
        </div>
      ))}
    </div>
  );
}
