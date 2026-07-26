import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { getCompanyBrandingBySlug } from "@/app/actions/branding";
import { headers } from "next/headers";
import { extractSubdomain } from "@/lib/subdomain";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { getLandingPageConfig } from "@/app/actions/landing-page";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardConfig } from "@/lib/dashboard/engine";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";

  // 1. If user is already logged in, redirect them directly to their page
  const session = await getSession();
  if (session) {
    const role = session.role;
    const isImpersonating = cookieStore.has("impersonation_id");

    if (role === "SYSTEM_OWNER" && !isImpersonating) {
      redirect("/admin");
    }

    const config = getDashboardConfig(role, lang);
    redirect(config.basePath);
  }

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = extractSubdomain(host);
  const branding = subdomain ? await getCompanyBrandingBySlug(subdomain) : null;

  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  // Fetch Config
  const config = await getLandingPageConfig();

  const t = {
    login: isRtl ? config.loginTextAr : config.loginTextEn,
    register: isRtl ? "انضم إلينا" : "Join Now",
    heroTitle: isRtl ? config.heroTitleAr : config.heroTitleEn,
    heroSubtitle: isRtl ? config.heroSubtitleAr : config.heroSubtitleEn,
    cta: isRtl ? config.ctaTextAr : config.ctaTextEn,
    footer: isRtl
      ? "جميع الحقوق محفوظة © 2026"
      : "All rights reserved © 2026",
    logoText: isRtl ? config.headerLogoTextAr : config.headerLogoTextEn,
  };

  // Style Logic
  const bgStyle = config.backgroundStyle || "blob";
  const primaryColor = config.primaryColor || "indigo";

  const colorClasses: Record<string, string> = {
    indigo:
      "from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]",
    blue: "from-blue-500 to-cyan-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    rose: "from-rose-500 to-orange-600 shadow-[0_0_15px_rgba(244,63,94,0.5)]",
    emerald:
      "from-emerald-500 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    violet:
      "from-violet-500 to-fuchsia-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]",
    cyan: "from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]",
  };

  const logoClasses = colorClasses[primaryColor] || colorClasses.indigo;

  return (
    <div
      className={`min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col overflow-x-hidden`}
      dir={dir}
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {bgStyle === "blob" && (
          <>
            <div
              className={`absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-${primaryColor}-600/20 rounded-full blur-[100px] animate-blob`}
            ></div>
            <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[100px] animate-blob animation-delay-6000"></div>
          </>
        )}
        {bgStyle === "mesh" && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]"></div>
        )}
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030712]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#030712]/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${logoClasses} flex items-center justify-center text-white font-bold text-lg`}
            >
              {branding?.logoText || config.headerLogoInitial || "C"}
            </div>
            <span className="font-bold text-xl tracking-tight text-white/90">
              {branding?.systemName || t.logoText}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher
              currentLang={lang}
              className="!relative !bottom-auto !right-auto !w-9 !h-9 !bg-transparent hover:!bg-white/5 border-none shadow-none"
            />
            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t.login}
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-lg bg-white text-black text-sm font-bold hover:bg-indigo-50 transition-all shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_-3px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95"
            >
              {t.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col relative pt-32 pb-20 z-10">
        <div className="container mx-auto px-6 flex flex-col items-center text-center">
          {/* Main Title */}
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent max-w-5xl leading-[1.1] drop-shadow-[0_0_40px_rgba(99,102,241,0.4)] animate-fade-in relative z-20">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mb-12 leading-relaxed drop-shadow-md">
            {t.heroSubtitle}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto mb-24">
            <Link
              href="/register"
              className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_auto] animate-gradient text-white font-bold text-xl shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] hover:shadow-[0_0_60px_-15px_rgba(124,58,237,0.7)] transition-all hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10">{t.cta}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xl hover:bg-white/10 transition-all backdrop-blur-md hover:border-indigo-500/30"
            >
              {t.login}
            </Link>
          </div>

          {/* Bento Grid Features - Dynamic */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-6xl">
            {config.features.map((feature, i) => {
              const Icon = (Icons as any)[feature.icon] || Icons.Activity;
              const title = isRtl ? feature.titleAr : feature.titleEn;
              const desc = isRtl
                ? feature.descriptionAr
                : feature.descriptionEn;

              // Customize card style based on index or just standard
              // For now, standard card
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm hover:border-indigo-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm text-start leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020617] py-8 relative z-10 text-center">
        <p className="text-slate-600 text-sm font-medium">{t.footer}</p>
      </footer>
    </div>
  );
}
