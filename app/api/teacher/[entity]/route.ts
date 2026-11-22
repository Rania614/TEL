import { mutate } from "@/lib/store";
import { handle, requireApiUser } from "@/lib/auth";
import { entityOf } from "@/lib/teacher-crud";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ entity: string }> }) => {
  const { entity } = await ctx.params;
  await requireApiUser("TEACHER");
  const e = entityOf(entity);
  const data = e.pick(await req.json());
  const created = await mutate((db) => {
    const row = e.create(db, data);
    (db as unknown as Record<string, unknown[]>)[e.table].push(row);
    return row;
  });
  return Response.json(created, { status: 201 });
});
