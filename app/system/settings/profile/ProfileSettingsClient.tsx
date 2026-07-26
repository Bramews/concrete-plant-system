"use client";

import { useState, useEffect } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VOICE_CHARACTERS } from "@/lib/voice/languages";
import {
  getVoiceLogsAction,
  getVoiceContextAction,
  saveVoiceContextAction,
} from "@/app/actions/voice";
import { toast } from "sonner";
import { User, Clock, Check, RefreshCw, Sun, Globe, Mic } from "lucide-react";

export function ProfileSettingsClient({
  user,
  initialPrefs,
}: {
  user: any;
  initialPrefs: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Local state for immediate feedback
  const [theme, setTheme] = useState(initialPrefs?.mode || "light");
  const [lang, setLang] = useState(initialPrefs?.language || "ar");

  // Voice States
  const [characterId, setCharacterId] = useState("saleh");
  const [voiceLogs, setVoiceLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchVoiceData = async () => {
      try {
        const contextRes = await getVoiceContextAction();
        if (contextRes.success && contextRes.context) {
          setCharacterId(contextRes.context.currentCharacter || "saleh");
        }
        const logsRes = await getVoiceLogsAction();
        if (logsRes.success && logsRes.logs) {
          setVoiceLogs(logsRes.logs);
        }
      } catch (err) {
        console.error("Failed to fetch voice context/logs:", err);
      }
    };
    fetchVoiceData();
  }, []);

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground font-bold">
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  const changeCharacter = async (charId: string) => {
    setCharacterId(charId);
    try {
      await saveVoiceContextAction({ currentCharacter: charId });
      toast.success("تم تحديث شخصية المساعد الصوتي بنجاح");
    } catch (e) {
      console.error(e);
      toast.error("فشل في تحديث شخصية المساعد");
    }
  };

  const refreshLogs = async () => {
    try {
      const logsRes = await getVoiceLogsAction();
      if (logsRes.success && logsRes.logs) {
        setVoiceLogs(logsRes.logs);
        toast.success("تم تحديث سجل الصوت بنجاح");
      }
    } catch (err) {
      console.error("Failed to refresh voice logs:", err);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setLoading(true);
    if (key === "mode") setTheme(value);
    if (key === "language") setLang(value);

    try {
      await updateUserPreferences({ [key]: value });
      router.refresh();
      // In a real app, we'd also toggle the class on <html> or context here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* USER INFO */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
          {(user.name?.[0] || "U").toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-lg">{user.name}</h3>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <div className="mt-2 text-sm font-bold bg-muted px-2 py-1 rounded inline-block">
            {typeof user.role === "string"
              ? user.role
              : (user.role as any)?.name || "User"}
          </div>
        </div>
      </div>

      {/* PREFERENCES */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* THEME */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="font-bold text-sm">Appearance</div>
              <div className="text-sm font-bold text-muted-foreground">
                Select your interface theme
              </div>
            </div>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => handleSave("mode", "light")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                theme === "light" ? "bg-white shadow-sm" : "hover:bg-muted",
              )}
            >
              Light
            </button>
            <button
              onClick={() => handleSave("mode", "dark")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                theme === "dark"
                  ? "bg-gray-800 text-white shadow-sm"
                  : "hover:bg-muted",
              )}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="h-px bg-border/50"></div>

        {/* LANGUAGE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="font-bold text-sm">Language</div>
              <div className="text-sm font-bold text-muted-foreground">
                System display language
              </div>
            </div>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => handleSave("language", "ar")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                "bg-white shadow-sm",
              )}
            >
              العربية
            </button>
            <button
              onClick={() => handleSave("language", "en")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                "hover:bg-muted",
              )}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* VOICE ASSISTANT SETTINGS */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Mic className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="font-bold text-sm">
              إعدادات المساعد الصوتي الذكي
            </div>
            <div className="text-sm font-semibold text-muted-foreground">
              تخصيص شخصية ومستويات المساعد
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 block">
            شخصية المساعد النشطة
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.values(VOICE_CHARACTERS).map((char) => (
              <button
                key={char.id}
                onClick={() => changeCharacter(char.id)}
                className={`flex justify-between items-center text-xs px-4 py-3 rounded-xl border transition-all ${
                  characterId === char.id
                    ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400 font-bold"
                    : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  {lang === "ar" ? char.nameAr : char.nameEn}
                </span>
                {characterId === char.id && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VOICE COMMANDS LOG TIMELINE */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <span className="font-bold text-sm flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            خط الزمن وسجل الأوامر الصوتية الأخيرة
          </span>
          <button
            onClick={refreshLogs}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/5 px-2.5 py-1.5 rounded-lg border border-indigo-500/10"
          >
            <RefreshCw
              className="w-3.5 h-3.5 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            تحديث السجل
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {voiceLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              لا توجد أي أوامر صوتية مسجلة بعد.
            </p>
          ) : (
            voiceLogs.map((log, idx) => (
              <div
                key={idx}
                className="border-b border-border/50 pb-2 last:border-0 text-xs"
              >
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                  <span>
                    {new Date(log.timestamp).toLocaleString(
                      lang === "ar" ? "ar-u-nu-latn" : "en-US",
                    )}
                  </span>
                  <span
                    className={
                      log.success
                        ? "text-emerald-400 font-bold"
                        : "text-rose-400 font-bold"
                    }
                  >
                    {log.success ? "مكتمل بنجاح" : "فشل المعالجة"}
                  </span>
                </div>
                <p className="font-bold text-slate-200">
                  الأمر: &quot;{log.command}&quot;
                </p>
                <p className="text-slate-400 italic mt-0.5">
                  الرد: &quot;{log.response}&quot;
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
