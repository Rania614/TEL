import { cookies } from "next/headers";
import { mutate } from "@/lib/store";
import { handle, HttpError, SESSION_COOKIE } from "@/lib/auth";
import { AVATARS } from "@/lib/labels";

const digits = (s: string) => s.replace(/\D/g, "");

export const POST = handle(async (req: Request) => {
  const body = (await req.json()) as { userId?: string; username?: string; mobile?: string; avatar?: string };
  const user = await mutate((db) => {
    const u = db.users.find((x) => x.id === body.userId);
    if (!u) throw new HttpError(404, "Profile not found.");
    if ((body.username ?? "").trim().toLowerCase() !== u.username.toLowerCase())
      throw new HttpError(400, "That username doesn't match this profile.");
    if (digits(body.mobile ?? "") !== digits(u.mobile))
      throw new HttpError(400, "That mobile number doesn't match this profile.");
    if (body.avatar && AVATARS[body.avatar]) u.avatar = body.avatar;
    return u;
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  return Response.json({ ok: true, role: user.role });
});
