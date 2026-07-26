"use client";

import { useState } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palette, Sun, Moon, Check, Loader2 } from "lucide-react";

interface UserPrefs {
  theme: string;
  mode: string;
  language: string;
  sidebar: string;
}

export default function ThemeManager({
  initialPrefs,
  lang,
}: {
  initialPrefs: UserPrefs;
  lang: string;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserPrefs>(initialPrefs);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAr = lang === "ar";

  const themes = [
    {
      id: "industrial",
      name: isAr ? "الصناعي الهادئ" : "Industrial Blue",
      desc: isAr ? "سمة زرقاء احترافية للمصانع" : "Professional steel blue",
    },
    {
      id: "neon",
      name: isAr ? "النيون الحديث" : "Neon Cyberpunk",
      desc: isAr ? "سمة مستقبلية بألوان مضيئة" : "Cyberpunk glow style",
    },
    {
      id: "monolith",
      name: isAr ? "أحادي الكتلة" : "Dark Monolith",
      desc: isAr ? "مظهر داكن شديد التباين" : "High contrast slate dark",
    },
    {
      id: "executive",
      name: isAr ? "الرئاسي الفاخر" : "Executive Deep",
      desc: isAr ? "أناقة الأعمال المظلمة" : "Deep business luxury",
    },
  ];

  const modes = [
    { id: "dark", name: isAr ? "الوضع الداكن" : "Dark Mode", icon: Moon },
    { id: "light", name: isAr ? "الوضع الفاتح" : "Light Mode", icon: Sun },
  ];

  const handleUpdate = async (field: "theme" | "mode", value: string) => {
    setIsUpdating(true);
    try {
      const updated = { ...prefs, [field]: value };
      const res = await updateUserPreferences(updated);
      if (res.success) {
        setPrefs(updated);
        toast.success(
          isAr
            ? "تم تحديث مظهر النظام بنجاح"
            : "System appearance updated successfully",
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update appearance");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="glass-panel w-full"
      style={{ padding: "1.5rem" }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <h3 className="text-card-title text-white mb-6 flex items-center gap-2">
        <Palette className="w-5 h-5 text-indigo-400" />
        {isAr ? "تخصيص مظهر النظام" : "System Customization"}
      </h3>

      <div className="flex flex-col gap-6">
        {/* Section 1: Themes */}
        <div>
          <span className="text-sm font-bold text-slate-300 mb-3 block">
            {isAr ? "اختر سمة الألوان:" : "Select Theme Color:"}
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleUpdate("theme", t.id)}
                disabled={isUpdating}
                className="p-4 rounded-xl border transition-all text-start flex flex-col gap-1 w-full bg-white/[0.01]"
                style={{
                  borderColor:
                    prefs.theme === t.id ? "var(--primary)" : "white/5",
                  background:
                    prefs.theme === t.id ? "rgba(79, 124, 255, 0.08)" : "",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold text-slate-100">
                    {t.name}
                  </span>
                  {prefs.theme === t.id && (
                    <Check className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <span className="text-caption text-slate-400 mt-1 block">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Modes */}
        <div className="border-t border-white/5 pt-5">
          <span className="text-sm font-bold text-slate-300 mb-3 block">
            {isAr ? "نمط الإضاءة:" : "Lighting Style:"}
          </span>
          <div className="flex items-center gap-4">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = prefs.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleUpdate("mode", m.id)}
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 bg-white/[0.01] transition-all"
                  style={{
                    borderColor: isActive ? "var(--primary)" : "white/5",
                    background: isActive ? "rgba(79, 124, 255, 0.08)" : "",
                    cursor: isUpdating ? "not-allowed" : "pointer",
                  }}
                >
                  <Icon className="w-4 h-4 text-slate-300" />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
