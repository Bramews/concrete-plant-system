import { getCurrentUser } from "@/lib/auth";
import { logAuthFailure } from "@/lib/security/audit";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getDictionary, Locale } from "@/lib/dictionary";
import { translateRole } from "@/lib/role-translations";
import { getCurrentLanguage } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const user = await getCurrentUser();
  const { reason } = await searchParams;

  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);
  const isArabic = lang === "ar";

  if (user) {
    await logAuthFailure(
      user.id,
      user.role as string,
      reason || "Attempted to access restricted area",
    );
  }

  // Parse Reason
  let displayReason: string = dict.errors.access_denied.default_reason;
  const title: string = dict.errors.access_denied.title;

  if (reason) {
    if (reason === "NO_DASHBOARD") {
      displayReason = isArabic
        ? "عذراً، لم يتم إسناد لوحة تحكم مخصصة لهذا الحساب."
        : "Sorry, no custom dashboard has been assigned to this account.";
    } else if (reason.includes("Subdomain")) {
      displayReason = dict.errors.access_denied.subdomain;
    } else if (reason.includes("Role") && reason.includes("cannot access")) {
      // E.g. "[v2] Role LAB_MANAGER cannot access lab sector"
      // Extract role and sector if possible, or just show generic mismatch
      // We can try to format it nicely
      const match = reason.match(/Role\s+(\w+)\s+cannot access\s+(\w+)/);
      if (match) {
        const roleName = translateRole(match[1]); // Localized Role
        const sectorName = match[2]; // Sector name might need mapping or leaving as is
        displayReason = dict.errors.access_denied.role_mismatch
          .replace("{role}", roleName)
          .replace("{sector}", sectorName);
      } else {
        displayReason = dict.errors.access_denied.default_reason;
      }
    } else if (reason.includes("Guard")) {
      displayReason = dict.errors.access_denied.system_guard;
    } else {
      displayReason = reason;
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="glass-panel text-center max-w-lg w-full p-8 rounded-3xl border border-red-500/20 shadow-2xl shadow-red-500/10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 ring-4 ring-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-10 h-10 text-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black mb-2 tracking-tight text-white">
            {title}
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed text-lg font-medium">
            {displayReason}
          </p>

          <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 text-right border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                هوية الجلسة
              </span>
              <div
                className={`w-2 h-2 rounded-full ${user ? "bg-green-500" : "bg-slate-600"}`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-base font-bold text-slate-200">
                {user?.name || "زائر"}
              </div>
              <div className="text-sm font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded w-fit ml-auto">
                {user?.role
                  ? isArabic
                    ? translateRole(user.role)
                    : user.role
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={
                user
                  ? user.role === "SYSTEM_OWNER"
                    ? "/admin"
                    : "/system/dashboard"
                  : "/"
              }
              className="block w-full py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl font-bold tracking-wide transition-all shadow-lg shadow-white/5 text-center"
            >
              العودة للرئيسية
            </Link>

            {user && (
              <form
                action={async () => {
                  "use server";
                  await logout();
                }}
              >
                <button
                  type="submit"
                  className="w-full py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl font-bold transition-colors"
                >
                  تسجيل الخروج
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-[0.6rem] font-bold text-slate-600 tracking-tighter flex justify-between items-center opacity-70">
            <span>{new Date().toLocaleTimeString("en-US")}</span>
            <span>SEC-L3-GUARD</span>
          </div>
        </div>
      </div>
      <LanguageSwitcher currentLang={lang} />
    </div>
  );
}
