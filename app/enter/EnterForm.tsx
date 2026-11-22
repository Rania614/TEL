"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVATARS } from "@/lib/labels";
import { t, type Lang } from "@/lib/i18n";
import { api } from "@/components/client-api";
import { LangToggle } from "@/components/ShellClient";

type P = { id: string; name: string; nameAr: string; role: string; avatar: string };

export default function EnterForm({ profiles, lang }: { profiles: P[]; lang: Lang }) {
  const router = useRouter();
  const [sel, setSel] = useState<P | null>(null);
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatar, setAvatar] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sel) return setError(lang === "ar" ? "اختاري ملفك أولاً." : "Choose your profile first.");
    setBusy(true); setError("");
    try {
      const r = await api<{ role: string }>("/api/auth/login", "POST", { userId: sel.id, username, mobile, avatar: avatar || sel.avatar });
      router.push(r.role === "TEACHER" ? "/teacher" : "/library");
      router.refresh();
    } catch (err) {
      setError((err as Error).message); setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack" noValidate>
      <div className="spread">
        <h2 style={{ margin: 0 }}>{t(lang, "enterTitle")}</h2>
        <span className="chip"><LangToggle lang={lang} /></span>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, marginBottom: ".5rem" }}>{t(lang, "whoAreYou")}</legend>
        <div className="profiles">
          {profiles.map((p) => (
            <button type="button" key={p.id} className="profile-btn" aria-pressed={sel?.id === p.id}
              onClick={() => { setSel(p); setAvatar(p.avatar); setError(""); }}>
              <span className="avatar" aria-hidden>{AVATARS[sel?.id === p.id ? avatar || p.avatar : p.avatar]}</span>
              <strong>{p.name}</strong>
              <span className="ar" lang="ar">{p.nameAr}</span>
              {p.role === "TEACHER" && <span className="chip">{lang === "ar" ? "المعلمة" : "Teacher"}</span>}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="form-grid">
        <label className="field">{t(lang, "username")}
          <input className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder={sel ? sel.name.toLowerCase() : ""} />
        </label>
        <label className="field">{t(lang, "mobile")}
          <input className="input" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        </label>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, marginBottom: ".5rem" }}>{t(lang, "avatar")}</legend>
        <div className="avatar-grid">
          {Object.entries(AVATARS).map(([k, g]) => (
            <button type="button" key={k} className="avatar-opt" aria-pressed={avatar === k} aria-label={k} onClick={() => setAvatar(k)}>{g}</button>
          ))}
        </div>
      </fieldset>

      {error && <div className="alert error" role="alert">{error}</div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : "🗝"} {t(lang, "enter")}</button>
      <p className="muted" style={{ fontSize: ".82rem", margin: 0 }}>{t(lang, "demoNote")}</p>
    </form>
  );
}
