import Link from "next/link";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Crumbs } from "@/components/Shell";
import { EntryBrowser, type EntryRow } from "@/components/EntryBrowser";

export default async function ExpressionsPage() {
  const user = await requirePageUser();
  const lang = await getLang();
  const db = await read();
  const isTeacher = user.role === "TEACHER";
  const label = (id: string) => { const s = db.sessions.find((x) => x.id === id); const lv = s ? db.levels.find((l) => l.id === s.levelId)?.number : null; return { id, label: s ? `${lv ? `L${lv} · ` : ""}Session ${s.number}` : "—" }; };
  const rows: EntryRow[] = db.expressions.map((v) => {
    const st = db.entryStates.find((e) => e.studentId === user.id && e.entryType === "EXPRESSION" && e.entryId === v.id);
    return {
      id: v.id, title: v.expression, meaning: v.meaning, example: v.example, category: v.category,
      sessions: v.sessionIds.map(label), createdAt: v.createdAt,
      state: { learned: st?.learned ?? false, favorite: st?.favorite ?? false, note: st?.note ?? "" },
    };
  });
  return (
    <>
      <Crumbs items={[{ href: isTeacher ? "/teacher" : "/library", label: isTeacher ? t(lang, "dashboard") : t(lang, "library") }, { label: t(lang, "expressions") }]} />
      <div className="spread"><h1 className="world-title">{t(lang, "expressions")}</h1>{isTeacher && <Link className="btn" href="/teacher/sessions">＋ Add expressions to a session</Link>}</div>
      <p className="world-text">Idioms, phrasal verbs, collocations and compound nouns — each linked to the session where you met it.</p>
      <EntryBrowser rows={rows} entryType="EXPRESSION" canEdit={isTeacher} categories={["IDIOM", "PHRASAL_VERB", "COLLOCATION", "COMPOUND_NOUN"]} />
    </>
  );
}
