import { mutate, newId, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { evaluate, grant, REWARD_POINTS } from "@/lib/rewards";
import type { Achievement } from "@/lib/types";

type Body = { text?: string; notes?: string; answers?: Record<string, string>; fileIds?: string[] };

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireApiUser("STUDENT");
  const body = (await req.json()) as Body;

  const result = await mutate((db) => {
    const task = db.tasks.find((t) => t.id === id);
    if (!task) throw new HttpError(404, "Task not found.");
    const fileIds = (body.fileIds ?? []).filter((f) => db.files.some((x) => x.id === f && x.ownerId === user.id));
    const text = String(body.text ?? "").slice(0, 50000);
    const answers = Object.fromEntries(Object.entries(body.answers ?? {}).map(([k, v]) => [k, String(v).slice(0, 10000)]));
    const hasContent = text.trim() || fileIds.length || Object.values(answers).some((v) => v.trim());
    if (!hasContent) throw new HttpError(400, "Add an answer, a recording or a file before submitting.");
    const types = task.submissionTypes?.length ? task.submissionTypes : task.skill === "SPEAKING" ? ["AUDIO"] : ["TEXT"];
    if (types.length === 1 && types[0] === "AUDIO" && !fileIds.some((f) => db.files.find((x) => x.id === f)?.kind === "AUDIO"))
      throw new HttpError(400, "This task asks for a recording — record or upload audio before submitting.");

    const prev = db.submissions.filter((s) => s.taskId === id && s.studentId === user.id);
    const version = prev.reduce((n, s) => Math.max(n, s.version), 0) + 1;
    const sub = {
      id: newId(), taskId: id, studentId: user.id, version, status: "SUBMITTED" as const,
      text, answers, notes: String(body.notes ?? "").slice(0, 20000), fileIds, createdAt: now(),
    };
    db.submissions.push(sub);

    // Keep the working draft in sync with what was handed in, so reopening
    // the task always shows the latest answer.
    const d = db.drafts.find((x) => x.taskId === id && x.studentId === user.id);
    if (d) Object.assign(d, { text, answers, notes: sub.notes, fileIds, updatedAt: now() });
    else db.drafts.push({ id: newId(), taskId: id, studentId: user.id, text, answers, notes: sub.notes, fileIds, updatedAt: now() });

    const granted: Achievement[] = [];
    const a = grant(db, user.id, `submit:${id}`, `Handed in “${task.title}”`, REWARD_POINTS.SUBMIT, "✒");
    if (a) granted.push(a);
    granted.push(...evaluate(db, user.id));
    for (const g of granted) g.seenAt = now(); // shown right away by the client
    return { submission: sub, granted };
  });
  return Response.json(result);
});
