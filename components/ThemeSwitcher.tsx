"use client";

import { useEffect, useState } from "react";
import { Icons } from "./ui/Icons";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/PreferenceContext";

export function ThemeSwitcher() {
  const { t } = usePreferences();

  const themes = [
    {
      id: "default",
      colorClass: "bg-green-500",
    },
    {
      id: "command",
      colorClass: "bg-black",
    },
    {
      id: "silk",
      colorClass: "bg-purple-600",
    },
  ] as const;

  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app-theme") || "default";
    }
    return "default";
  });

  const [currentMode, setCurrentMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app-mode") || "dark";
    }
    return "dark";
  });

  const [isOpen, setIsOpen] = useState(false);

  const setTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
    setIsOpen(false);
  };

  const toggleMode = () => {
    const newMode = currentMode === "dark" ? "light" : "dark";
    setCurrentMode(newMode);
    document.documentElement.setAttribute("data-mode", newMode);
    localStorage.setItem("app-mode", newMode);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Sync attributes on mount and change
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.documentElement.setAttribute("data-mode", currentMode);
  }, [currentTheme, currentMode]);

  if (!mounted) {
    return (
      <div className="relative flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted/20 animate-pulse" />
        <div className="w-24 h-8 rounded-full bg-muted/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Dark/Light Mode Toggle */}
      <button
        onClick={toggleMode}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
        title={
          currentMode === "dark"
            ? t.theme.mode.switch_to_light
            : t.theme.mode.switch_to_dark
        }
      >
        {currentMode === "dark" ? (
          <Icons.Sun className="w-4 h-4 text-primary" />
        ) : (
          <Icons.Moon className="w-4 h-4 text-primary" />
        )}
        <span className="text-sm font-bold font-medium">
          {currentMode === "dark" ? t.theme.mode.dark : t.theme.mode.light}
        </span>
      </button>

      {/* Theme Selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
        title="Switch Theme"
      >
        <Icons.Palette className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm font-bold font-medium">
          {t.theme[currentTheme as "default" | "command" | "silk"]?.name}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-12 right-0 z-50 w-64 p-4 bg-card border border-border rounded-xl shadow-2xl animate-scale-in">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {t.theme.select_language}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((theme) => {
                const themeData =
                  t.theme[theme.id as "default" | "command" | "silk"];
                return (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]",
                      currentTheme === theme.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${theme.colorClass}`}
                      />
                      <span className="text-[11px] font-bold truncate">
                        {themeData?.name}
                      </span>
                      {currentTheme === theme.id && (
                        <Icons.Check className="w-3 h-3 text-primary ml-auto" />
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      {themeData?.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
