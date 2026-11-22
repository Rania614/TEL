import { redirect } from "next/navigation";
import { read } from "@/lib/store";
import { getLang, requirePageUser } from "@/lib/auth";
import { AchievementsView } from "@/components/AchievementsView";

export default async function AchievementsPage() {
  const user = await requirePageUser();
  if (user.role === "TEACHER") redirect("/teacher");
  const lang = await getLang();
  const db = await read();
  return <AchievementsView db={db} studentId={user.id} lang={lang} crumbs />;
}

