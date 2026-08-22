"use client";

import React, { useState, useTransition } from "react";
import { authenticateUserAction } from "@/app/actions/auth";
import Link from "next/link";

interface LoginFormProps {
  callbackUrl?: string;
  errorMessage?: string;
  isRtl: boolean;
  loginButtonText: string;
}

export function ModernLoginForm({
  callbackUrl,
  errorMessage: initialError,
  isRtl,
  loginButtonText,
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await authenticateUserAction(formData);
        if (res.success && res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          setError(
            res.error || "بيانات الدخول غير صحيحة، يرجى المحاولة مجدداً.",
          );
        }
      } catch {
        setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً.");
      }
    });
  }

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
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
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl || ""} />

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
              disabled={isPending}
              autoComplete="username"
              className="w-full bg-slate-900/60 border-2 border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-slate-900/80 transition-all duration-400 hover:border-slate-600 hover:bg-slate-900/70 disabled:opacity-50"
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
              disabled={isPending}
              autoComplete="current-password"
              className="w-full bg-slate-900/60 border-2 border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-slate-900/80 transition-all duration-400 hover:border-slate-600 hover:bg-slate-900/70 font-mono tracking-[0.3em] disabled:opacity-50"
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
              disabled={isPending}
              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-900/50 transition-all checked:border-indigo-500 checked:bg-indigo-500 hover:border-indigo-400 disabled:opacity-50"
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

        {/* Submit Button with Live Loading State */}
        <button
          type="submit"
          disabled={isPending}
          className="group/btn relative w-full mt-6 animate-[fadeInUp_0.8s_ease-out_0.8s_both] disabled:cursor-not-allowed"
        >
          {/* Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-xl blur-lg opacity-40 group-hover/btn:opacity-80 transition-opacity duration-500 animate-[pulse_3s_ease-in-out_infinite]"></div>

          {/* Main Button */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 p-[2px]">
            <div className="relative flex items-center justify-center gap-3 py-4 px-6 rounded-[10px] bg-slate-950/90 backdrop-blur-sm group-hover/btn:bg-transparent transition-all duration-500">
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[13px] font-black text-white tracking-[0.2em] uppercase">
                    جاري تسجيل الدخول...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[13px] font-black text-white tracking-[0.3em] uppercase group-hover/btn:tracking-[0.4em] transition-all duration-500">
                    {loginButtonText}
                  </span>
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
                </>
              )}
            </div>
          </div>
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
  );
}
