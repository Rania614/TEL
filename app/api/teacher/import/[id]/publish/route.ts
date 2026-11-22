import { mutate, newId, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { publishImport, validate } from "@/lib/import/publish";

/** Step 6: publish an approved preview. Blocked while anything is unresolved or a slot conflicts. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const teacher = await requireApiUser("TEACHER");
  const { id } = await ctx.params;
  const { allowSameFile } = (await req.json().catch(() => ({}))) as { allowSameFile?: boolean };
  const result = await mutate((db) => {
    const d = db.importDrafts.find((x) => x.id === id);
    if (!d) throw new HttpError(404, "Import not found.");
    if (d.status === "PUBLISHED") throw new HttpError(409, "This import was already published.");
    const same = db.sourceDocuments.find((s) => s.sha256 === d.sha256 && d.source === "FILE");
    if (same && !allowSameFile) throw new HttpError(409, `This exact file was already imported on ${new Date(same.importedAt).toLocaleDateString("en-GB")}. Publishing it again is blocked to prevent duplicates.`);
    const problems = validate(db, d.data);
    if (problems.length) throw new HttpError(422, `${problems.length} item(s) still need your attention before publishing.`);
    const docId = newId();
    const stats = publishImport(db, d.data, docId);
    if (d.fileId) {
      db.sourceDocuments.push({
        id: docId, fileId: d.fileId, originalName: d.originalName, sha256: d.sha256, levelId: db.levels.find((l) => l.number === d.defaultLevel)?.id ?? null,
        importDraftId: d.id, importedAt: now(), importedBy: teacher.id,
        stats: { sessions: stats.sessionsCreated + stats.sessionsMatched, tasks: stats.tasks, resources: stats.resources, expressions: stats.expressions },
      });
    }
    d.status = "PUBLISHED"; d.publishedAt = now(); d.updatedAt = now();
    return stats;
  });
  return Response.json(result);
});
