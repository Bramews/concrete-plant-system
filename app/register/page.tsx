import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { getRegisterPageConfig } from "@/app/actions/register-page";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const config = await getRegisterPageConfig();

  const t = {
    title: isRtl ? config.titleAr : config.titleEn,
    subtitle: isRtl ? config.subtitleAr : config.subtitleEn,
    loginLink: isRtl ? config.loginLinkTextAr : config.loginLinkTextEn,
    brandingName: isRtl ? config.brandingNameAr : config.brandingNameEn,
  };

  // Dynamic Styles
  const bgColors: Record<string, string> = {
    indigo: "bg-[#030712] selection:bg-indigo-500/30",
    blue: "bg-slate-950 selection:bg-blue-500/30",
    purple: "bg-[#0f0720] selection:bg-purple-500/30",
    rose: "bg-[#1f0510] selection:bg-rose-500/30",
    emerald: "bg-[#021008] selection:bg-emerald-500/30",
  };

  const glowColors: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    rose: "bg-rose-500/10 text-rose-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div
      className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans text-slate-200 ${
        bgColors[config.primaryColor] || bgColors.indigo
      }`}
      dir={dir}
    >
      <LanguageSwitcher currentLang={lang} />

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {config.backgroundStyle === "blob" && (
          <>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
          </>
        )}
        {config.backgroundStyle === "grid" && (
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] bg-repeat"></div>
        )}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[500px] px-4 py-10">
        <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5">
          <div className="text-center mb-8">
            <div
              className={`inline-block p-3 rounded-xl mb-4 ${glowColors[config.primaryColor] || glowColors.indigo}`}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t.brandingName}
            </h1>
            <h2 className="text-xl text-slate-300 mb-1">{t.title}</h2>
            <p className="text-sm text-slate-500">{t.subtitle}</p>
          </div>

          <RegisterForm lang={lang} config={config} />

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t.loginLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
