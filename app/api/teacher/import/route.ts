import { mutate, newId, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { extractText } from "@/lib/import/extract";
import { parseCourseText } from "@/lib/import/parse";
import { matchAgainstLibrary } from "@/lib/import/publish";
import { storeSourceFile } from "@/lib/import/upload";

export const runtime = "nodejs";
const MAX = 25 * 1024 * 1024;

/** Step 1+2+3: upload a course document, extract it, classify it, and save an editable draft. */
export const POST = handle(async (req: Request) => {
  const teacher = await requireApiUser("TEACHER");
  const form = await req.formData();
  const file = form.get("file");
  const defaultLevel = Math.max(1, Math.min(99, parseInt(String(form.get("level") ?? "1"), 10) || 1));
  if (!(file instanceof File) || !file.size) throw new HttpError(400, "Choose a .docx, .pdf or .txt file.");
  if (file.size > MAX) throw new HttpError(413, "Documents must be 25 MB or smaller.");
  if (!/\.(docx|pdf|txt)$/i.test(file.name)) throw new HttpError(415, "Upload a .docx, .pdf or .txt file.");

  const { asset, buf, sha256 } = await storeSourceFile(file, teacher.id);
  let text: string, warnings: string[];
  try { ({ text, warnings } = await extractText(buf, file.name, asset.mime)); }
  catch (e) { throw new HttpError(422, (e as Error).message || "The document could not be read."); }
  if (!text.trim()) throw new HttpError(422, warnings[0] ?? "No text was found in this document.");

  const parsed = parseCourseText(text, { defaultLevel, documentTitle: file.name });
  const draft = await mutate((db) => {
    matchAgainstLibrary(db, parsed);
    const d = {
      id: newId(), fileId: asset.id, originalName: file.name, sha256, source: "FILE" as const, defaultLevel,
      status: "DRAFT" as const, data: parsed, createdAt: now(), updatedAt: now(), publishedAt: null, createdBy: teacher.id,
    };
    db.importDrafts.push(d);
    const already = db.sourceDocuments.find((s) => s.sha256 === sha256);
    return { id: d.id, warnings, alreadyImported: already ? { name: already.originalName, at: already.importedAt } : null };
  });
  return Response.json(draft, { status: 201 });
});
