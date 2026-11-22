import Link from "next/link";
import { notFound } from "next/navigation";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Crumbs } from "@/components/Shell";
import SessionEditor from "./SessionEditor";

export default async function EditSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const db = await read();
  const session = db.sessions.find((s) => s.id === id);
  if (!session) notFound();
  const fileIds = new Set([
    ...db.materials.filter((m) => m.sessionId === id && m.fileId).map((m) => m.fileId as string),
    ...db.tasks.filter((x) => x.sessionId === id).flatMap((x) => x.attachmentIds),
  ]);
  return (
    <>
      <Crumbs items={[{ href: "/teacher", label: t(lang, "dashboard") }, { href: "/teacher/sessions", label: t(lang, "manageSessions") }, { label: `Session ${session.number}` }]} />
      <div className="spread" style={{ marginBottom: "1rem" }}>
        <h1 className="world-title" style={{ margin: 0 }}>Edit · {db.levels.find((l) => l.id === session.levelId)?.title} · Session {session.number}</h1>
        <Link className="btn ghost" href={`/library/sessions/${id}`}>👁 Preview as book</Link>
      </div>
      <SessionEditor
        session={session}
        sections={db.sections.filter((s) => s.sessionId === id).sort((a, b) => a.order - b.order)}
        materials={db.materials.filter((m) => m.sessionId === id)}
        tasks={db.tasks.filter((x) => x.sessionId === id).sort((a, b) => a.order - b.order)}
        vocabulary={db.vocabulary.filter((v) => v.sessionIds.includes(id))}
        expressions={db.expressions.filter((e) => e.sessionIds.includes(id))}
        files={db.files.filter((f) => fileIds.has(f.id))}
        otherVocabulary={db.vocabulary.filter((v) => !v.sessionIds.includes(id))}
        otherExpressions={db.expressions.filter((e) => !e.sessionIds.includes(id))}
        levels={[...db.levels].sort((a, b) => a.number - b.number).map((l) => ({ id: l.id, title: l.title }))}
      />
    </>
  );
}
