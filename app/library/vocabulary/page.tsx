import Link from "next/link";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Crumbs } from "@/components/Shell";
import { EntryBrowser, type EntryRow } from "@/components/EntryBrowser";

export default async function VocabularyPage() {
  const user = await requirePageUser();
  const lang = await getLang();
  const db = await read();
  const isTeacher = user.role === "TEACHER";
  const label = (id: string) => { const s = db.sessions.find((x) => x.id === id); const lv = s ? db.levels.find((l) => l.id === s.levelId)?.number : null; return { id, label: s ? `${lv ? `L${lv} · ` : ""}Session ${s.number}` : "—" }; };
  const rows: EntryRow[] = db.vocabulary.map((v) => {
    const st = db.entryStates.find((e) => e.studentId === user.id && e.entryType === "VOCAB" && e.entryId === v.id);
    return {
      id: v.id, title: v.word, meaning: v.meaning, example: v.example, pronunciation: v.pronunciation, related: v.relatedWords,
      sessions: v.sessionIds.map(label), createdAt: v.createdAt,
      state: { learned: st?.learned ?? false, favorite: st?.favorite ?? false, note: st?.note ?? "" },
    };
  });
  return (
    <>
      <Crumbs items={[{ href: isTeacher ? "/teacher" : "/library", label: isTeacher ? t(lang, "dashboard") : t(lang, "library") }, { label: t(lang, "vocabulary") }]} />
      <div className="spread"><h1 className="world-title">{t(lang, "vocabulary")}</h1>{isTeacher && <Link className="btn" href="/teacher/sessions">＋ Add words from a session</Link>}</div>
      <p className="world-text">Every word comes from a real session. Mark words as learned, star favourites and keep your own notes — only you see them.</p>
      <EntryBrowser rows={rows} entryType="VOCAB" canEdit={isTeacher} />
    </>
  );
}
