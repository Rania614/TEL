import { read } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { parseCourseText } from "@/lib/import/parse";
import { matchAgainstLibrary } from "@/lib/import/publish";

/**
 * "Organize My Content": the same rule-based parser used by Smart Session Import,
 * applied to a pasted WhatsApp message. Nothing is saved here — the result is an editable preview.
 */
export const POST = handle(async (req: Request) => {
  await requireApiUser("TEACHER");
  const { text, sessionId } = (await req.json()) as { text?: string; sessionId?: string };
  if (!text?.trim()) throw new HttpError(400, "Paste the message first.");
  if (text.length > 200_000) throw new HttpError(413, "That message is too long.");
  const db = await read();
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) throw new HttpError(404, "Session not found.");
  const level = db.levels.find((l) => l.id === session.levelId)?.number ?? 1;
  const parsed = parseCourseText(text, { defaultLevel: level, documentTitle: "Pasted message", fallbackSession: session.number });
  // Pasted text may contain "Session N" markers; everything goes into THIS session.
  const tasks = parsed.sessions.flatMap((s) => s.tasks);
  const resources = parsed.sessions.flatMap((s) => s.resources);
  const expressions = parsed.sessions.flatMap((s) => s.expressions);
  const one = { ...parsed, sessions: [{ ...(parsed.sessions[0] ?? {}), tasks, resources, expressions, number: session.number, levelNumber: level, title: session.title }] };
  matchAgainstLibrary({ ...db, sessions: [session] }, one as typeof parsed);
  return Response.json({ tasks: one.sessions[0].tasks, resources, expressions, skipped: parsed.skipped, parser: "rules" });
});
