import { login } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { getCompanyBrandingBySlug } from "@/app/actions/branding";
import { extractSubdomain } from "@/lib/subdomain";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDashboardConfig } from "@/lib/dashboard/engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  let user = null;

  try {
    user = await getCurrentUser();
  } catch (e) {
    console.error("Auth helper error:", e);
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  if (user) {
    if (callbackUrl && callbackUrl.startsWith("/") && callbackUrl !== "/") {
      return redirect(callbackUrl);
    }
    const config = getDashboardConfig(user.role, lang);
    return redirect(config.basePath);
  }

  const isRtl = lang === "ar";

  // جلب إعدادات الشركة من الدومين
  let branding = null;
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const subdomain = extractSubdomain(host);
    branding = subdomain ? await getCompanyBrandingBySlug(subdomain) : null;
  } catch (_) {
    branding = null;
  }

  // القيم الافتراضية أو من الإعدادات
  const brandConfig = {
    logoText: branding?.logoText || "N",
    systemName: branding?.systemName || "Neon-Lab",
    subtitle: branding?.subtitle || "نظام إدارة الخرسانة",
    loginButton: "تسجيل الدخول",
    primaryColor: branding?.primaryColor || "#6366f1",
    secondaryColor: branding?.secondaryColor || "#a855f7",
    accentColor: branding?.accentColor || "#22d3ee",
    homeButtonShow: branding?.homeButtonShow ?? true,
    homeButtonTextAr: branding?.homeButtonTextAr || "الرئيسية",
    homeButtonTextEn: branding?.homeButtonTextEn || "HOME",
    homeButtonSize: branding?.homeButtonSize || "15px",
    homeButtonWeight: branding?.homeButtonWeight || "font-extrabold",
    homeButtonTracking: branding?.homeButtonTracking || "tracking-[0.3em]",
    homeButtonColor: branding?.homeButtonColor || "",
    homeButtonAnimation: branding?.homeButtonAnimation || "breath",
  };

  // Error Message Translation / Mapping
  const errorMessage =
    error === "Invalid Credentials"
      ? "بيانات الدخول غير صحيحة"
      : error === "SessionExpired" || error === "expired"
        ? "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى"
        : error;

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Top Navigation - Strictly Positioned */}
      <div className="fixed top-0 w-full p-4 sm:p-8 z-50 pointer-events-none">
        {/* Top Left: Language Switcher */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 pointer-events-auto animate-[fadeInDown_1s_ease-out_0.2s_both]">
          <LanguageSwitcher
            currentLang={lang}
            className="!relative !top-0 !right-0 !bottom-0 !left-0 hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Top Right: Aurora Chip Home Button */}
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 pointer-events-auto animate-[fadeInDown_1s_ease-out_0.2s_both]">
          {brandConfig.homeButtonShow && (
            <Link
              href="/"
              className="group relative flex items-center gap-5 px-9 py-3.5 rounded-full bg-slate-900/40 border border-white/10 backdrop-blur-2xl hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-700 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
              style={
                brandConfig.homeButtonColor
                  ? { borderColor: `${brandConfig.homeButtonColor}40` }
                  : {}
              }
            >
              {/* Liquid Glow Sweep - Enhanced */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent -translate-x-full ${brandConfig.homeButtonAnimation === "sweep" ? "group-hover:animate-[liquidSweep_2s_ease-in-out_infinite]" : ""}`}
                style={
                  brandConfig.homeButtonColor
                    ? {
                        backgroundImage: `linear-gradient(to right, transparent, ${brandConfig.homeButtonColor}20, transparent)`,
                      }
                    : {}
                }
              ></div>

              {/* Pulsing Breathing Background Circle */}
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-inner overflow-hidden ${isRtl ? "order-2" : ""}`}
                style={
                  brandConfig.homeButtonColor
                    ? {
                        backgroundColor: `${brandConfig.homeButtonColor}20`,
                        color: brandConfig.homeButtonColor,
                      }
                    : {}
                }
              >
                <div
                  className={`absolute inset-0 bg-indigo-500/20 ${brandConfig.homeButtonAnimation === "breath" ? "animate-[breath_3s_ease-in-out_infinite]" : ""}`}
                  style={
                    brandConfig.homeButtonColor
                      ? { backgroundColor: `${brandConfig.homeButtonColor}30` }
                      : {}
                  }
                ></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative w-5 h-5 group-hover:animate-[floatIcon_2s_ease-in-out_infinite]"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>

              <span
                className={`relative ${brandConfig.homeButtonWeight} ${brandConfig.homeButtonTracking} text-slate-200 group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.45)] transition-all duration-500 ${isRtl ? "order-1" : ""} ${brandConfig.homeButtonAnimation === "pulse" ? "animate-pulse" : ""}`}
                style={{
                  fontSize: brandConfig.homeButtonSize,
                  fontFamily: "inherit",
                  ...(brandConfig.homeButtonColor
                    ? { color: brandConfig.homeButtonColor }
                    : {}),
                }}
              >
                {lang === "ar"
                  ? brandConfig.homeButtonTextAr
                  : brandConfig.homeButtonTextEn}
              </span>

              {/* Subtle Bottom Glow Reflection */}
              <div
                className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"
                style={
                  brandConfig.homeButtonColor
                    ? {
                        backgroundImage: `linear-gradient(to right, transparent, ${brandConfig.homeButtonColor}, transparent)`,
                      }
                    : {}
                }
              ></div>
            </Link>
          )}
        </div>
      </div>
      {/* --- Ultra Premium Animated Background --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Aurora Effect */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 via-transparent to-cyan-900/20 animate-[aurora_15s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-purple-900/15 via-transparent to-indigo-900/15 animate-[aurora_20s_ease-in-out_infinite_reverse]"></div>
        </div>

        {/* Floating Orbs with 3D depth */}
        <div className="absolute top-[10%] left-[20%] w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[180px] animate-[floatOrb_12s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[160px] animate-[floatOrb_15s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[120px] animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[30%] left-[5%] w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px] animate-[floatOrb_18s_ease-in-out_infinite]"></div>

        {/* Dynamic Grid with perspective */}
        <div className="absolute inset-0 opacity-[0.04] login-grid-perspective"></div>

        {/* Animated Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]"></div>

        {/* Moving Light Beam */}
        <div className="absolute top-0 left-1/2 w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent animate-[lightBeam_8s_ease-in-out_infinite]"></div>

        {/* Floating Particles - Enhanced */}
        <div className="absolute top-[15%] left-[12%] w-3 h-3 bg-indigo-400/50 rounded-full animate-[floatParticle_8s_ease-in-out_infinite] shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
        <div className="absolute top-[55%] left-[8%] w-2 h-2 bg-cyan-400/60 rounded-full animate-[floatParticle_10s_ease-in-out_infinite_1s] shadow-[0_0_15px_rgba(34,211,238,0.4)]"></div>
        <div className="absolute top-[25%] right-[18%] w-1.5 h-1.5 bg-purple-400/70 rounded-full animate-[floatParticle_7s_ease-in-out_infinite_0.5s]"></div>
        <div className="absolute bottom-[20%] right-[12%] w-4 h-4 bg-indigo-300/30 rounded-full animate-[floatParticle_12s_ease-in-out_infinite_2s] shadow-[0_0_25px_rgba(165,180,252,0.3)]"></div>
        <div className="absolute top-[70%] left-[75%] w-2 h-2 bg-cyan-300/50 rounded-full animate-[floatParticle_6s_ease-in-out_infinite_0.3s]"></div>
        <div className="absolute bottom-[45%] left-[22%] w-1.5 h-1.5 bg-white/40 rounded-full animate-[floatParticle_9s_ease-in-out_infinite_1.5s]"></div>
        <div className="absolute top-[35%] left-[45%] w-1 h-1 bg-rose-400/50 rounded-full animate-[floatParticle_11s_ease-in-out_infinite_0.8s]"></div>

        {/* Subtle Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015]"></div>
      </div>

      {/* --- Main Login Card with 3D Transform --- */}
      <div className="relative z-10 w-full max-w-[400px] px-4 animate-[cardEntry_1s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="group relative overflow-hidden rounded-[24px] bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-3xl border border-slate-700/40 shadow-[0_25px_80px_-15px_rgba(99,102,241,0.25)] ring-1 ring-white/5 transition-all duration-700 hover:shadow-[0_35px_100px_-15px_rgba(99,102,241,0.35)] hover:ring-indigo-500/30 hover:border-indigo-500/40 hover:-translate-y-2 login-card-3d">
          {/* Holographic Top Border */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-400/80 to-cyan-500/0 animate-[shimmer_4s_linear_infinite]"></div>

          {/* Corner Decorations - Enhanced */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-indigo-400/40 rounded-tl-[24px]"></div>
          <div className="absolute top-0 left-0 w-10 h-10 border-t border-l border-cyan-400/20 rounded-tl-[24px] m-1"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-400/40 rounded-br-[24px]"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b border-r border-indigo-400/20 rounded-br-[24px] m-1"></div>

          {/* Inner Glow Effect */}
          <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none"></div>

          <div className="p-6 sm:p-8 relative">
            {/* --- Header Section --- */}
            <div className="flex flex-col items-center mb-6">
              {/* Logo Container with 3D Effect */}
              <div className="mb-4 relative animate-[logoFloat_5s_ease-in-out_infinite]">
                <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_15px_50px_-10px_rgba(99,102,241,0.5)] group-hover:scale-110 group-hover:shadow-[0_25px_70px_-10px_rgba(99,102,241,0.6)] transition-all duration-700 login-logo-3d">
                  <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] login-logo-text-3d">
                    {brandConfig.logoText}
                  </span>
                  {/* Rotating Outer Ring */}
                  <div className="absolute -inset-2 rounded-[22px] border-2 border-dashed border-white/20 animate-[spin_25s_linear_infinite]"></div>
                  {/* Pulse Rings */}
                  <div className="absolute -inset-3 rounded-[24px] border border-indigo-400/30 animate-[ping_3s_ease-out_infinite]"></div>
                  <div className="absolute -inset-4 rounded-[26px] border border-cyan-400/15 animate-[ping_3s_ease-out_infinite_0.5s]"></div>
                </div>
                {/* Multi-layer Glow */}
                <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/40 via-purple-500/30 to-cyan-500/40 blur-3xl rounded-full -z-10 group-hover:blur-[60px] transition-all duration-700"></div>
                <div className="absolute -inset-12 bg-indigo-600/15 blur-[80px] rounded-full -z-20 animate-[pulse_4s_ease-in-out_infinite]"></div>
              </div>

              {/* Title with Gradient Animation */}
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-center animate-[titleReveal_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
                <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradientText_4s_linear_infinite]">
                  {brandConfig.systemName}
                </span>
              </h1>
              <div className="flex items-center gap-2 animate-[fadeInUp_0.8s_ease-out_0.5s_both]">
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-indigo-500/50"></div>
                <span className="text-[9px] tracking-[0.4em] font-bold text-indigo-400/90 uppercase">
                  {brandConfig.subtitle}
                </span>
                <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-indigo-500/50"></div>
              </div>
            </div>

            {/* --- Error Message --- */}
            {errorMessage && (
              <div
                className={`flex items-center gap-3 p-3 mb-6 text-sm rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 backdrop-blur-sm animate-[shake_0.5s_ease-in-out] ${
                  isRtl ? "text-right" : "text-left"
                }`}
                dir={isRtl ? "rtl" : "ltr"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 shrink-0 text-rose-400 animate-pulse"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* --- Login Form --- */}
            <form
              action={login}
              className="space-y-4"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <input
                type="hidden"
                name="callbackUrl"
                value={callbackUrl || ""}
              />

              {/* Username Field */}
              <div className="space-y-2 group/field animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
                <label
                  htmlFor="username"
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-[0.15em] pl-1 transition-colors duration-300 group-focus-within/field:text-indigo-400"
                >
                  <svg
                    className="w-3.5 h-3.5 opacity-60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {"الهوية"}
                </label>
                <div className="relative group/input">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    className="w-full bg-slate-900/60 border-2 border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-slate-900/80 transition-all duration-400 hover:border-slate-600 hover:bg-slate-900/70"
                    placeholder={"اسم المستخدم أو البريد الإلكتروني..."}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-cyan-500/0 group-focus-within/input:from-indigo-500/5 group-focus-within/input:to-cyan-500/5 transition-all duration-500 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group/field animate-[fadeInUp_0.8s_ease-out_0.7s_both]">
                <label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-[0.15em] pl-1 transition-colors duration-300 group-focus-within/field:text-indigo-400"
                >
                  <svg
                    className="w-3.5 h-3.5 opacity-60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {"كلمة المرور"}
                </label>
                <div className="relative group/input">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-slate-900/60 border-2 border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-slate-900/80 transition-all duration-400 hover:border-slate-600 hover:bg-slate-900/70 font-mono tracking-[0.3em]"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-cyan-500/0 group-focus-within/input:from-indigo-500/5 group-focus-within/input:to-cyan-500/5 transition-all duration-500 pointer-events-none"></div>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 animate-[fadeInUp_0.8s_ease-out_0.75s_both]">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="remember"
                    id="remember"
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-900/50 transition-all checked:border-indigo-500 checked:bg-indigo-500 hover:border-indigo-400"
                  />
                  <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <label
                  htmlFor="remember"
                  className="cursor-pointer text-sm font-bold text-slate-400 select-none hover:text-indigo-300 transition-colors"
                >
                  {"تذكرني"}
                </label>
              </div>

              {/* Submit Button - Ultra Modern */}
              <button
                type="submit"
                className="group/btn relative w-full mt-6 animate-[fadeInUp_0.8s_ease-out_0.8s_both]"
              >
                {/* Outer Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-xl blur-lg opacity-40 group-hover/btn:opacity-80 transition-opacity duration-500 animate-[pulse_3s_ease-in-out_infinite]"></div>

                {/* Main Button */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 p-[2px]">
                  {/* Animated Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out"></div>

                  {/* Inner Container */}
                  <div className="relative flex items-center justify-center gap-4 py-4 px-6 rounded-[10px] bg-slate-950/90 backdrop-blur-sm group-hover/btn:bg-transparent transition-all duration-500">
                    {/* Text */}
                    <span className="text-[13px] font-black text-white tracking-[0.3em] uppercase group-hover/btn:tracking-[0.4em] group-hover/btn:text-white transition-all duration-500">
                      {brandConfig.loginButton}
                    </span>

                    {/* Arrow Icon */}
                    <div className="absolute right-6 flex items-center gap-1">
                      <svg
                        className="w-5 h-5 text-white/60 group-hover/btn:text-white group-hover/btn:translate-x-2 transition-all duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Bottom Reflection */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-r from-indigo-600/20 via-purple-600/30 to-cyan-500/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
              </button>

              {/* Forgot Password Link */}
              <div className="text-center mt-6 animate-[fadeInUp_0.8s_ease-out_0.9s_both]">
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors duration-300 tracking-wide"
                >
                  {"نسيت كلمة المرور؟"}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- Custom Animations CSS --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes aurora {
              0%, 100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
              50% { opacity: 0.8; transform: scale(1.1) rotate(3deg); }
            }
            @keyframes floatOrb {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -30px) scale(1.05); }
              66% { transform: translate(-20px, 20px) scale(0.95); }
            }
            @keyframes floatParticle {
              0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
              25% { transform: translateY(-30px) translateX(10px); opacity: 1; }
              50% { transform: translateY(-15px) translateX(-10px); opacity: 0.8; }
              75% { transform: translateY(-40px) translateX(5px); opacity: 0.5; }
            }
            @keyframes lightBeam {
              0%, 100% { opacity: 0; transform: translateX(-200px); }
              50% { opacity: 0.3; transform: translateX(200px); }
            }
            @keyframes cardEntry {
              from { opacity: 0; transform: translateY(60px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes logoFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }
            @keyframes titleReveal {
              from { opacity: 0; transform: translateY(20px); letter-spacing: -0.1em; }
              to { opacity: 1; transform: translateY(0); letter-spacing: -0.025em; }
            }
            @keyframes gradientText {
              0%, 100% { background-position: 0% center; }
              50% { background-position: 100% center; }
            }
            @keyframes shimmer {
              0% { transform: translateX(-200%); }
              100% { transform: translateX(200%); }
            }
            @keyframes borderRotate {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(25px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes breath {
              0%, 100% { transform: scale(1); opacity: 0.1; }
              50% { transform: scale(1.5); opacity: 0.3; }
            }
            @keyframes floatIcon {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes liquidSweep {
              0% { transform: translateX(-100%) skewX(-15deg); }
              50% { transform: translateX(100%) skewX(-15deg); }
              100% { transform: translateX(100%) skewX(-15deg); }
            }
          `,
        }}
      />
    </div>
  );
}
