import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { read } from "./store";
import type { User } from "./types";

/**
 * DEMO ACCESS ONLY — not real authentication.
 * The cookie holds a user id. Anyone who knows a username + mobile number can
 * enter as that person. Role checks below are enforced on the server for every
 * API call and page, so the *rules* are real; the *identity proof* is not.
 * Replace `getCurrentUser` with a session from a real provider (NextAuth,
 * Clerk, Supabase…) and everything else keeps working.
 */
export const SESSION_COOKIE = "el_uid";

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const uid = jar.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  const db = await read();
  return db.users.find((u) => u.id === uid) ?? null;
}

/** For pages: redirects to the entry screen when nobody is signed in. */
export async function requirePageUser(role?: "TEACHER" | "STUDENT"): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/enter");
  if (role === "TEACHER" && u.role !== "TEACHER") redirect("/library");
  if (role === "STUDENT" && u.role !== "STUDENT") redirect("/teacher");
  return u;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireApiUser(role?: "TEACHER" | "STUDENT"): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new HttpError(401, "Not signed in");
  if (role && u.role !== role) throw new HttpError(403, "Not allowed for this role");
  return u;
}

/** Wrap a route handler so HttpErrors become JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      return Response.json({ error: "Something went wrong on the server." }, { status: 500 });
    }
  };
}

export async function getLang(): Promise<"en" | "ar"> {
  const jar = await cookies();
  return jar.get("lang")?.value === "ar" ? "ar" : "en";
}
