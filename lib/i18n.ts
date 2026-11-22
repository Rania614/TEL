// Interface strings in English and Arabic. Lesson content stays in English
// (it is an English course); names and navigation switch with the language.
export type Lang = "en" | "ar";

const dict = {
  appName: ["The English Library", "المكتبة الإنجليزية"],
  library: ["Library", "المكتبة"],
  sessions: ["Sessions Archive", "أرشيف الحصص"],
  assignments: ["Assignments Shelf", "رف الواجبات"],
  vocabulary: ["Vocabulary Vault", "خزانة المفردات"],
  expressions: ["Idioms & Phrasal Verbs", "التعابير والأفعال المركبة"],
  materials: ["Extra Materials", "مواد إضافية"],
  feedback: ["Feedback Corner", "ركن الملاحظات"],
  achievements: ["Achievements Gallery", "معرض الإنجازات"],
  dashboard: ["Teacher's Desk", "مكتب المعلمة"],
  students: ["Students", "الطالبات"],
  manageSessions: ["Manage Sessions", "إدارة الحصص"],
  signOut: ["Leave library", "الخروج"],
  welcome: ["Welcome back", "أهلاً بعودتك"],
  enterTitle: ["Enter your library", "ادخلي إلى مكتبتك"],
  whoAreYou: ["Who is entering?", "من الداخلة؟"],
  mobile: ["Mobile number", "رقم الجوال"],
  username: ["Username", "اسم المستخدم"],
  avatar: ["Choose your avatar", "اختاري صورتك الرمزية"],
  enter: ["Open the door", "افتحي الباب"],
  demoNote: [
    "Demo access: no password or OTP. Anyone who knows a username and mobile number can enter as that person. Don't store anything private here.",
    "دخول تجريبي: لا توجد كلمة مرور. أي شخص يعرف اسم المستخدم ورقم الجوال يمكنه الدخول. لا تحفظي هنا أي بيانات خاصة.",
  ],
  NOT_STARTED: ["Not started", "لم يبدأ"],
  IN_PROGRESS: ["In progress", "قيد التنفيذ"],
  SUBMITTED: ["Submitted", "تم التسليم"],
  NEEDS_REVISION: ["Needs revision", "يحتاج مراجعة"],
  REVIEWED: ["Reviewed", "تمت المراجعة"],
  COMPLETED: ["Completed", "مكتملة"],
  open: ["Open", "افتح"],
  back: ["Back to the library", "العودة للمكتبة"],
  points: ["bookmarks", "علامة"],
  newFeedback: ["new feedback", "ملاحظة جديدة"],
  pendingReviews: ["Waiting for review", "بانتظار المراجعة"],
  yourRoom: ["Your study room", "غرفة مذاكرتك"],
  nextUnlock: ["Next unlock", "الفتح القادم"],
} as const;

export type Key = keyof typeof dict;
export function t(lang: Lang, key: Key): string {
  return dict[key][lang === "ar" ? 1 : 0];
}
export function personName(lang: Lang, u: { name: string; nameAr: string }) {
  return lang === "ar" ? u.nameAr : u.name;
}
