import { mutate, now } from "@/lib/store";
import { handle, requireApiUser } from "@/lib/auth";

/** Marks feedback or achievements as seen (clears the notification dot). */
export const POST = handle(async (req: Request) => {
  const user = await requireApiUser("STUDENT");
  const { what } = (await req.json()) as { what: "feedback" | "achievements" };
  const n = await mutate((db) => {
    let count = 0;
    if (what === "feedback") {
      const mine = new Set(db.submissions.filter((s) => s.studentId === user.id).map((s) => s.id));
      for (const f of db.feedback) if (mine.has(f.submissionId) && !f.seenAt) { f.seenAt = now(); count++; }
    } else {
      for (const a of db.achievements) if (a.studentId === user.id && !a.seenAt) { a.seenAt = now(); count++; }
    }
    return count;
  });
  return Response.json({ updated: n });
});
