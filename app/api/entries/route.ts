import { mutate, newId } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { evaluate } from "@/lib/rewards";

type Body = { entryType: "VOCAB" | "EXPRESSION"; entryId: string; learned?: boolean; favorite?: boolean; note?: string };

/** A student's own learned / favourite / note state for a vocabulary or expression entry. */
export const PUT = handle(async (req: Request) => {
  const user = await requireApiUser("STUDENT");
  const b = (await req.json()) as Body;
  const result = await mutate((db) => {
    const exists = b.entryType === "VOCAB"
      ? db.vocabulary.some((v) => v.id === b.entryId)
      : db.expressions.some((e) => e.id === b.entryId);
    if (!exists) throw new HttpError(404, "Entry not found.");
    let s = db.entryStates.find((x) => x.studentId === user.id && x.entryType === b.entryType && x.entryId === b.entryId);
    if (!s) {
      s = { id: newId(), studentId: user.id, entryType: b.entryType, entryId: b.entryId, learned: false, favorite: false, note: "" };
      db.entryStates.push(s);
    }
    if (typeof b.learned === "boolean") s.learned = b.learned;
    if (typeof b.favorite === "boolean") s.favorite = b.favorite;
    if (typeof b.note === "string") s.note = b.note.slice(0, 5000);
    const granted = evaluate(db, user.id);
    return { state: s, granted };
  });
  return Response.json(result);
});
