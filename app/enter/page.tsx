import { read } from "@/lib/store";
import { getLang } from "@/lib/auth";
import { t } from "@/lib/i18n";
import EnterForm from "./EnterForm";
import { EntranceArt } from "@/components/art/Scenes";

export const dynamic = "force-dynamic";

export default async function EnterPage() {
  const db = await read();
  const lang = await getLang();
  const profiles = db.users.map(({ id, name, nameAr, role, avatar }) => ({ id, name, nameAr, role, avatar }));
  return (
    <div className="entry-page">
      <div className="door">
        <div className="side">
          <span className="hand" style={{ fontSize: "1.8rem", color: "var(--gold-soft)" }}>{lang === "ar" ? "مرحباً بكِ في" : "Welcome to"}</span>
          <h1 className="world-title" style={{ margin: 0 }}>{t(lang, "appName")}</h1>
          <EntranceArt />
          <p className="world-text" style={{ maxWidth: 400, margin: 0 }}>
            {lang === "ar"
              ? "كل حصص رابحة وواجباتها وتسجيلاتك وملاحظاتها — مرتّبة على رفوف مكتبتك الخاصة بدلاً من رسائل واتساب المتفرقة."
              : "All of Rabeha's sessions, tasks, your recordings and her feedback — arranged on the shelves of your own library instead of scattered WhatsApp messages."}
          </p>
          
        </div>
        <div className="paper" style={{ padding: "1.8rem" }}>
          <EnterForm profiles={profiles} lang={lang} />
        </div>
      </div>
    </div>
  );
}
