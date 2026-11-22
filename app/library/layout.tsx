import type { ReactNode } from "react";
import { getLang, requirePageUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function LibraryLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  const lang = await getLang();
  return <Shell user={user} lang={lang}>{children}</Shell>;
}
