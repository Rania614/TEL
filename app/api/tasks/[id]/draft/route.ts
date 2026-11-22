import { mutate, newId, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";

type Body = { text?: string; notes?: string; answers?: Record<string, string>; fileIds?: string[] };

export const PUT = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireApiUser("STUDENT");
  const body = (await req.json()) as Body;
  const draft = await mutate((db) => {
    if (!db.tasks.some((t) => t.id === id)) throw new HttpError(404, "Task not found.");
    const fileIds = (body.fileIds ?? []).filter((f) => db.files.some((x) => x.id === f && x.ownerId === user.id));
    let d = db.drafts.find((x) => x.taskId === id && x.studentId === user.id);
    if (!d) {
      d = { id: newId(), taskId: id, studentId: user.id, text: "", notes: "", answers: {}, fileIds: [], updatedAt: now() };
      db.drafts.push(d);
    }
    d.text = String(body.text ?? d.text).slice(0, 50000);
    d.notes = String(body.notes ?? d.notes).slice(0, 20000);
    d.answers = body.answers ?? d.answers;
    d.fileIds = body.fileIds ? fileIds : d.fileIds;
    d.updatedAt = now();
    return d;
  });
  return Response.json(draft);
});
