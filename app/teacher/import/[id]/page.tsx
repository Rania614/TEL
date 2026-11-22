import { notFound } from "next/navigation";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { validate } from "@/lib/import/publish";
import { Crumbs } from "@/components/Shell";
import ImportPreview from "./ImportPreview";

export default async function ImportDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const db = await read();
  const d = db.importDrafts.find((x) => x.id === id);
  if (!d) notFound();
  const same = db.sourceDocuments.find((s) => s.sha256 === d.sha256 && s.importDraftId !== d.id);
  const sessionLinks = Object.fromEntries(db.sessions.map((s) => {
    const lv = db.levels.find((l) => l.id === s.levelId)?.number;
    return [`${lv}:${s.number}`, s.id];
  }));
  return (
    <>
      <Crumbs items={[{ href: "/teacher", label: t(lang, "dashboard") }, { href: "/teacher/import", label: "Smart Session Import" }, { label: d.originalName }]} />
      <ImportPreview
        draftId={d.id} fileName={d.originalName} fileId={d.fileId} status={d.status} initial={d.data}
        initialProblems={validate(db, d.data)} alreadyImported={same ? { name: same.originalName, at: same.importedAt } : null}
        sessionLinks={d.status === "PUBLISHED" ? sessionLinks : {}}
      />
    </>
  );
}
