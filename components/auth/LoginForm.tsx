"use client";

import { useState, useTransition } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";

interface LoginFormProps {
  lang: string;
  isRtl: boolean;
  brandConfig: {
    logoText: string;
    systemName: string;
    subtitle: string;
    loginButton: string;
  };
  initialError?: string;
  callbackUrl?: string;
}

export function LoginForm({
  lang,
  isRtl,
  brandConfig,
  initialError,
  callbackUrl,
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(
    initialError || null,
  );

  const handleSubmit = async (formData: FormData) => {
    setLocalError(null);
    startTransition(async () => {
      try {
        await login(formData);
      } catch (e: unknown) {
        const error = e as Error;
        // Handle next-safe-action or similar if applicable,
        // but here it's a direct server action that might redirect.
        // Redirects are caught as "NEXT_REDIRECT" errors usually.
        if (error.message?.includes("NEXT_REDIRECT")) {
          return;
        }
        setLocalError(error.message || "An unexpected error occurred");
      }
    });
  };

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-[12px] transition-all duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <span className="text-sm font-bold font-black text-primary uppercase tracking-[0.2em] animate-pulse">
              جاري التحقق...
            </span>
          </div>
        </div>
      )}

      <div className="p-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-[12px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-6 group-hover:scale-105 transition-transform">
            <span className="text-3xl font-black text-white">
              {brandConfig.logoText}
            </span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-2 uppercase">
            {brandConfig.systemName}
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {brandConfig.subtitle}
          </p>
        </div>

        {/* Error Message */}
        {(localError || initialError) && (
          <div className="p-4 mb-6 text-sm font-bold bg-destructive/10 border border-destructive/20 text-destructive rounded-[8px] flex items-center gap-3 animate-head-shake">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></div>
            <span className="font-bold">{localError || initialError}</span>
          </div>
        )}

        {/* Login Form */}
        <form
          action={handleSubmit}
          className="space-y-5"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl || ""} />

          {/* Identity Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold font-black text-muted-foreground uppercase tracking-widest pl-1">
              الهوية
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              disabled={isPending}
              className="w-full bg-white border border-border rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              placeholder="اسم المستخدم أو البريد الإلكتروني"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold font-black text-muted-foreground uppercase tracking-widest pl-1">
              كلمة المرور
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={isPending}
              className="w-full bg-white border border-border rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono tracking-widest disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-6 bg-primary text-white font-black py-4 rounded-[8px] shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                جاري الدخول
              </span>
            ) : (
              brandConfig.loginButton
            )}
          </button>

          {/* Additional Options */}
          <div className="pt-8 text-center border-t border-border/50 mt-10">
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
