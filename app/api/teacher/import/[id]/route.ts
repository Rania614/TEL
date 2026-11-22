import { mutate, read, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { validate } from "@/lib/import/publish";
import type { ParsedImport } from "@/lib/import/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  await requireApiUser("TEACHER");
  const { id } = await ctx.params;
  const db = await read();
  const d = db.importDrafts.find((x) => x.id === id);
  if (!d) throw new HttpError(404, "Import not found.");
  return Response.json({ draft: d, problems: validate(db, d.data) });
});

/** Save the teacher's edits to the preview (the whole parsed structure). */
export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireApiUser("TEACHER");
  const { id } = await ctx.params;
  const body = (await req.json()) as { data: ParsedImport };
  if (!body?.data || !Array.isArray(body.data.sessions)) throw new HttpError(400, "Invalid preview data.");
  const problems = await mutate((db) => {
    const d = db.importDrafts.find((x) => x.id === id);
    if (!d) throw new HttpError(404, "Import not found.");
    if (d.status === "PUBLISHED") throw new HttpError(409, "This import is already published.");
    d.data = body.data; d.updatedAt = now();
    return validate(db, d.data);
  });
  return Response.json({ ok: true, problems });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireApiUser("TEACHER");
  const { id } = await ctx.params;
  await mutate((db) => {
    const d = db.importDrafts.find((x) => x.id === id);
    if (!d) throw new HttpError(404, "Import not found.");
    if (d.status === "PUBLISHED") throw new HttpError(409, "Published imports are kept as the record of where content came from.");
    db.importDrafts = db.importDrafts.filter((x) => x.id !== id);
  });
  return Response.json({ ok: true });
});
