"use client";

import { useEffect, useState } from "react";
import { Sun, SunDim } from "lucide-react";

interface SunlightModeToggleProps {
  className?: string;
  variant?: "badge" | "button" | "compact";
}

export function SunlightModeToggle({
  className = "",
  variant = "badge",
}: SunlightModeToggleProps) {
  const [isSunlight, setIsSunlight] = useState(false);

  useEffect(() => {
    // Check initial state from document or localStorage
    const saved = localStorage.getItem("SUNLIGHT_MODE") === "true";
    if (saved) {
      setIsSunlight(true);
      document.documentElement.classList.add("sunlight-mode");
      document.documentElement.setAttribute("data-theme", "sunlight");
    }
  }, []);

  const toggleSunlightMode = () => {
    const nextState = !isSunlight;
    setIsSunlight(nextState);
    localStorage.setItem("SUNLIGHT_MODE", nextState ? "true" : "false");

    if (nextState) {
      document.documentElement.classList.add("sunlight-mode");
      document.documentElement.setAttribute("data-theme", "sunlight");
    } else {
      document.documentElement.classList.remove("sunlight-mode");
      document.documentElement.removeAttribute("data-theme");
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={toggleSunlightMode}
        title={isSunlight ? "إلغاء الوضع الشمسي" : "تفعيل الوضع الشمسي الميداني عالي التباين"}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
          isSunlight
            ? "bg-amber-400 text-black border-black font-black shadow-lg shadow-amber-400/30"
            : "bg-slate-900/80 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
        } ${className}`}
      >
        {isSunlight ? (
          <Sun className="w-4 h-4 animate-spin-slow" />
        ) : (
          <SunDim className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleSunlightMode}
      title={isSunlight ? "إلغاء الوضع الشمسي" : "تفعيل الوضع الشمسي الميداني عالي التباين"}
      className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-black shrink-0 ${
        isSunlight
          ? "bg-amber-400 text-black border-black shadow-lg shadow-amber-400/30"
          : "bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
      } ${className}`}
    >
      <Sun className={`w-3.5 h-3.5 ${isSunlight ? "text-black" : "text-amber-400"}`} />
      <span>{isSunlight ? "الوضع الشمسي: مُفعل" : "الوضع الميداني الشمسي"}</span>
    </button>
  );
}
