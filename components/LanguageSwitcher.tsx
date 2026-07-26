"use client";

import { toggleLanguage } from "@/app/actions/language";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function LanguageSwitcher({
  currentLang,
  className,
}: {
  currentLang?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lang, setLang] = useState(currentLang || "ar");

  // Hydration fix: read cookie on mount if not provided
  useEffect(() => {
    if (!currentLang) {
      const match = document.cookie.match(
        new RegExp("(^| )NEXT_LOCALE=([^;]+)"),
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (match) setLang(match[2]);
    }
  }, [currentLang]);

  const handleToggle = async () => {
    startTransition(async () => {
      await toggleLanguage();
      // Use window.location.reload() for a hard refresh to ensure all server
      // components re-render with the new locale from cookies/DB
      window.location.reload();
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={
        (className ? `relative ${className}` : null) ||
        "fixed bottom-6 right-6 z-50 group flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:scale-110 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300"
      }
      title={lang === "ar" ? "Switch to English" : "التحويل للعربية"}
    >
      <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
        {lang === "ar" ? "EN" : "AR"}
      </span>
      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full border border-white/5 animate-[ping_3s_ease-out_infinite] group-hover:border-indigo-500/20"></span>
    </button>
  );
}
