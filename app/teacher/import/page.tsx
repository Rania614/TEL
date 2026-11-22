import Link from "next/link";
import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { fmtDate } from "@/lib/labels";
import { Crumbs } from "@/components/Shell";
import { ArchiveRoomArt } from "@/components/art/Scenes";
import UploadForm from "./UploadForm";

export default async function ImportHome() {
  const lang = await getLang();
  const db = await read();
  const drafts = [...db.importDrafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <Crumbs items={[{ href: "/teacher", label: t(lang, "dashboard") }, { label: "Smart Session Import" }]} />
      <section className="archive-hero">
        <div className="signboard">
          <span className="hand" style={{ fontSize: "1.4rem", color: "var(--lav-deep)" }}>The archive room</span>
          <h1 style={{ marginBottom: ".2em" }}>Smart Session Import</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Upload a course document (.docx, .pdf or .txt). The library reads it, splits every session into separate tasks and sorts each task onto the right skill shelf.
            Then you check everything in a preview before anything reaches the students.
          </p>
          <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>
            ✦ Sorting is done by clear, rule-based reading of the text, not by AI. Anything uncertain is marked ⚠ for you to decide, and nothing is invented.
          </p>
        </div>
        <ArchiveRoomArt />
      </section>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <UploadForm levels={db.levels.map((l) => ({ number: l.number, title: l.title }))} />
        <section className="paper stack">
          <h2 style={{ margin: 0 }}>Imports</h2>
          {!drafts.length && <div className="empty">No documents imported yet.</div>}
          {drafts.map((d) => {
            const tasks = d.data.sessions.flatMap((s) => s.tasks);
            const doc = db.sourceDocuments.find((x) => x.importDraftId === d.id);
            return (
              <div key={d.id} className="card">
                <div className="spread">
                  <h3>📄 {d.originalName}</h3>
                  <span className={`imp-badge ${d.status === "PUBLISHED" ? "imp-ok" : "imp-review"}`}>{d.status === "PUBLISHED" ? "✦ Published" : "Draft"}</span>
                </div>
                <div className="meta">
                  <span>{d.data.sessions.length} sessions · {tasks.length} tasks</span>
                  <span>· {d.status === "PUBLISHED" ? `published ${fmtDate(d.publishedAt)}` : `started ${fmtDate(d.createdAt)}`}</span>
                </div>
                <div className="row">
                  <Link className="btn small" href={`/teacher/import/${d.id}`}>{d.status === "PUBLISHED" ? "View" : "Continue preview"}</Link>
                  {d.fileId && <a className="btn ghost small" href={`/api/files/${d.fileId}`}>⇩ Original file</a>}
                  {doc && <span className="muted" style={{ fontSize: ".85rem" }}>Added {doc.stats.tasks} tasks, {doc.stats.resources} resources</span>}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
