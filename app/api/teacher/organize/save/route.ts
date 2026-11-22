import { mutate } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { addContentToSession, resourceResolved, taskResolved } from "@/lib/import/publish";
import type { ParsedExpression, ParsedResource, ParsedTask } from "@/lib/import/types";

export const POST = handle(async (req: Request) => {
  await requireApiUser("TEACHER");
  const b = (await req.json()) as { sessionId: string; tasks: ParsedTask[]; resources: ParsedResource[]; expressions: ParsedExpression[] };
  if (!Array.isArray(b.tasks)) throw new HttpError(400, "Nothing to save.");
  const unresolved = b.tasks.filter((t) => !taskResolved(t)).length + (b.resources ?? []).filter((r) => !resourceResolved(r)).length;
  if (unresolved) throw new HttpError(422, `${unresolved} item(s) still need your confirmation.`);
  const counts = await mutate((db) => {
    if (!db.sessions.some((s) => s.id === b.sessionId)) throw new HttpError(404, "Session not found.");
    return addContentToSession(db, b.sessionId, b.tasks, b.resources ?? [], b.expressions ?? [], null);
  });
  return Response.json(counts);
});
