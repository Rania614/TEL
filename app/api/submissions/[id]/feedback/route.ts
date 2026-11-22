import { mutate, newId, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { evaluate, grant, REWARD_POINTS } from "@/lib/rewards";
import type { Correction, Feedback } from "@/lib/types";

type Body = {
  text?: string; audioFileId?: string | null; score?: number | null; rating?: number | null;
  corrections?: Correction[]; decision?: Feedback["decision"];
};

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const teacher = await requireApiUser("TEACHER");
  const body = (await req.json()) as Body;

  const fb = await mutate((db) => {
    const sub = db.submissions.find((s) => s.id === id);
    if (!sub) throw new HttpError(404, "Submission not found.");
    const decision = (["REVIEWED", "NEEDS_REVISION", "COMMENT"] as const).includes(body.decision as never)
      ? (body.decision as Feedback["decision"]) : "COMMENT";
    const audioFileId = body.audioFileId && db.files.some((f) => f.id === body.audioFileId && f.ownerId === teacher.id)
      ? body.audioFileId : null;
    const corrections = (body.corrections ?? [])
      .filter((c) => c && (c.original?.trim() || c.correction?.trim()))
      .map((c) => ({ original: String(c.original ?? "").slice(0, 2000), correction: String(c.correction ?? "").slice(0, 2000), note: String(c.note ?? "").slice(0, 2000) }));
    const text = String(body.text ?? "").slice(0, 20000);
    if (!text.trim() && !audioFileId && !corrections.length && decision === "COMMENT")
      throw new HttpError(400, "Write feedback, record audio, add a correction or choose a decision.");
    const clampN = (v: unknown, lo: number, hi: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null;

    const entry: Feedback = {
      id: newId(), submissionId: sub.id, teacherId: teacher.id, text, audioFileId,
      score: clampN(body.score, 0, 100), rating: clampN(body.rating, 1, 5), corrections,
      decision, seenAt: null, createdAt: now(),
    };
    db.feedback.push(entry);
    if (decision === "REVIEWED" || decision === "NEEDS_REVISION") sub.status = decision;

    // Reward rule: the review points are granted on teacher approval only.
    if (decision === "REVIEWED") {
      const task = db.tasks.find((t) => t.id === sub.taskId);
      grant(db, sub.studentId, `reviewed:${sub.taskId}`, `Reviewed by Rabeha: “${task?.title ?? "task"}”`, REWARD_POINTS.REVIEWED, "✉");
    }
    evaluate(db, sub.studentId);
    return entry;
  });
  return Response.json(fb);
});
