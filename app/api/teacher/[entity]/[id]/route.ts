import { mutate, now } from "@/lib/store";
import { handle, HttpError, requireApiUser } from "@/lib/auth";
import { entityOf, removeEntity } from "@/lib/teacher-crud";

type Ctx = { params: Promise<{ entity: string; id: string }> };

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { entity, id } = await ctx.params;
  await requireApiUser("TEACHER");
  const e = entityOf(entity);
  const data = e.pick(await req.json());
  const row = await mutate((db) => {
    const list = (db as unknown as Record<string, Record<string, unknown>[]>)[e.table];
    const r = list.find((x) => x.id === id);
    if (!r) throw new HttpError(404, "Not found.");
    if (entity === "sessions") {
      const levelId = (data.levelId as string) ?? (r.levelId as string);
      const number = (data.number as number) ?? (r.number as number);
      if (!db.levels.some((l) => l.id === levelId)) throw new HttpError(400, "Unknown level.");
      if (db.sessions.some((s) => s.levelId === levelId && s.number === number && s.id !== id))
        throw new HttpError(400, `Session ${number} already exists in that level.`);
    }
    if (entity === "levels" && typeof data.number === "number" && db.levels.some((l) => l.number === data.number && l.id !== id))
      throw new HttpError(400, `Level ${data.number} already exists.`);
    Object.assign(r, data);
    if ("updatedAt" in r) r.updatedAt = now();
    return r;
  });
  return Response.json(row);
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const { entity, id } = await ctx.params;
  await requireApiUser("TEACHER");
  await mutate((db) => removeEntity(db, entity, id));
  return Response.json({ ok: true });
});
