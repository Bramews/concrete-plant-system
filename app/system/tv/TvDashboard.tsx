"use client";

import { useState, useEffect, useRef } from "react";
import { Icons } from "@/components/ui/Icons";

interface TvDashboardProps {
  companyId: number;
  initialBatches: any[];
  initialTests: any[];
  totalVolume: number;
  totalBatches: number;
  isGuest: boolean;
  allowedOrderId: number | null;
  allowedMixId: number | null;
  guestToken?: string;
}

export function TvDashboard({
  companyId,
  initialBatches,
  initialTests,
  totalVolume: initVolume,
  totalBatches: initBatchesCount,
  isGuest,
  allowedOrderId,
  allowedMixId,
  guestToken,
}: TvDashboardProps) {
  const [batches, setBatches] = useState<any[]>(initialBatches);
  const [tests, setTests] = useState<any[]>(initialTests);
  const [totalVolume, setTotalVolume] = useState(initVolume);
  const [totalBatches, setTotalBatches] = useState(initBatchesCount);
  const [isOffline, setIsOffline] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [systemLatency, setSystemLatency] = useState(12); // Mock latency in ms
  const [voiceLog, setVoiceLog] = useState("المساعد الصوتي قيد التشغيل...");

  const recognitionRef = useRef<any>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Time & Date updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("ar-EG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePollFailure = () => {
    setIsOffline(true);
    // Try to load from cache
    const cached = localStorage.getItem(`tv_cache_${companyId}`);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setBatches(data.batches);
        setTests(data.tests);
        setTotalVolume(data.totalVolume);
        setTotalBatches(data.totalBatches);
      } catch (e) {
        console.error("Failed to parse tv cache", e);
      }
    }
  };

  // Offline Caching & Polling
  useEffect(() => {
    // Save initial data to cache
    const cacheData = {
      batches: initialBatches,
      tests: initialTests,
      totalVolume: initVolume,
      totalBatches: initBatchesCount,
      timestamp: Date.now(),
    };
    localStorage.setItem(`tv_cache_${companyId}`, JSON.stringify(cacheData));

    // Start polling
    const pollInterval = setInterval(async () => {
      const startTime = Date.now();
      try {
        const res = await fetch("/api/network/tv-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyId,
            guestToken,
            allowedOrderId,
            allowedMixId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setBatches(data.batches);
            setTests(data.tests);
            setTotalVolume(data.totalVolume);
            setTotalBatches(data.totalBatches);
            setIsOffline(false);
            setSystemLatency(Date.now() - startTime);

            // Update cache
            localStorage.setItem(
              `tv_cache_${companyId}`,
              JSON.stringify({
                batches: data.batches,
                tests: data.tests,
                totalVolume: data.totalVolume,
                totalBatches: data.totalBatches,
                timestamp: Date.now(),
              }),
            );
          } else {
            handlePollFailure();
          }
        } else {
          handlePollFailure();
        }
      } catch (err) {
        handlePollFailure();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [companyId, guestToken, allowedOrderId, allowedMixId]);

  // Local Voice Assistant Integration
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "ar-SA";
      rec.continuous = true;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsVoiceListening(true);
        setVoiceLog("مستعد، قل 'تحديث' أو 'تقرير'...");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript
          .trim()
          .toLowerCase();
        setVoiceLog(`التعرف على: "${transcript}"`);

        if (transcript.includes("تحديث") || transcript.includes("ريفرش")) {
          window.location.reload();
        } else if (
          transcript.includes("خروج") ||
          transcript.includes("اغلاق")
        ) {
          window.close();
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech Recognition Error", e);
        setIsVoiceListening(false);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = rec;
      // Start recognition automatically
      try {
        rec.start();
      } catch (err) {
        console.warn("Speech recognition already started or blocked");
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceLog("المساعد الصوتي غير مدعوم في هذا المتصفح.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceToggle = () => {
    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
      setVoiceLog("المساعد الصوتي متوقف.");
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Calculations
  const averageStrength =
    tests.length > 0
      ? (
          tests.reduce((sum, t) => sum + (t.mpa || 0), 0) / tests.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-between font-sans">
      {/* Top Bar / Header */}
      <div className="flex justify-between items-center bg-slate-900/50 border border-white/5 p-5 rounded-[2rem] backdrop-blur-xl mb-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="w-4 h-4 bg-emerald-500 rounded-full block animate-ping" />
            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full block absolute top-0.5 right-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              لوحة مراقبة الإنتاج الحية - البث الموحد
              {isGuest && (
                <span className="text-xs font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                  رابط ضيف (للقراءة فقط)
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1">
              تحديث حي للمركز الفني والتشغيل
            </p>
          </div>
        </div>

        {/* Offline Alert */}
        {isOffline && (
          <div className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2 text-xs font-black animate-pulse">
            <span>⚠️</span>
            <span>
              انقطع الاتصال بالخادم. يتم العرض من الذاكرة المحلية المؤقتة...
            </span>
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Time & Date Display */}
          <div className="text-left font-mono">
            <div className="text-2xl font-black text-white leading-none">
              {currentTime}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-1.5">
              {currentDate}
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Widget 1: Volume */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-black">
              {isGuest
                ? "حجم الخرسانة الموردة لطلبكم اليوم"
                : "حجم الخرسانة المصبوبة اليوم"}
            </div>
            <div className="text-4xl font-black text-indigo-400 mt-2 font-mono">
              {totalVolume.toFixed(1)} <span className="text-lg">م³</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2">
              {isGuest
                ? "إجمالي حجم الخرسانة الموردة لموقعكم"
                : "معدل حجم الصب اليومي الإجمالي"}
            </div>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-3xl text-indigo-400">
            <Icons.Factory className="w-10 h-10" />
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Widget 2: Batches */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-black">
              {isGuest ? "إجمالي الشحنات المجهزة لكم" : "إجمالي خلطات اليوم"}
            </div>
            <div className="text-4xl font-black text-emerald-400 mt-2 font-mono">
              {totalBatches} <span className="text-lg">خلطة</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2">
              {isGuest
                ? "شاحنات في طريقها إليكم أو تم تفريغها"
                : "شاحنات خرجت من المحطة بنجاح"}
            </div>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-3xl text-emerald-400">
            <Icons.Truck className="w-10 h-10" />
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Widget 3: Quality Compliance */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-black">
              {isGuest
                ? "معدل قوة المقاومة لخرسانتكم"
                : "معدل قوة مقاومة المكعبات"}
            </div>
            <div className="text-4xl font-black text-amber-400 mt-2 font-mono">
              {averageStrength} <span className="text-lg">MPa</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2">
              {isGuest
                ? `بناءً على نتائج عينات صبكم المخبرية (${tests.length} عينات)`
                : `بناءً على آخر ${tests.length} عينات فحص مخبري`}
            </div>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-3xl text-amber-400">
            <Icons.Shield className="w-10 h-10" />
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Right Section: Production list (2/3 width) */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Icons.Activity className="w-5 h-5 text-indigo-400" />
                حركة خروج الشحنات والخلطات اللحظية
              </h2>
              <span className="text-xs font-bold text-slate-400">
                آخر {batches.length} خلطات تم تحميلها
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs font-black">
                    <th className="py-3 px-4">
                      {isGuest ? "رقم الشحنة" : "رقم الشحنة / العميل"}
                    </th>
                    <th className="py-3 px-4">كود الخلطة المستهدفة</th>
                    <th className="py-3 px-4">الكمية المحملة</th>
                    <th className="py-3 px-4">وقت الصب</th>
                    <th className="py-3 px-4 text-center">حالة التحميل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {batches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-500 font-bold text-sm"
                      >
                        لم يتم صب أي خلطة اليوم حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    batches.map((b, idx) => (
                      <tr
                        key={b.id || idx}
                        className="text-sm hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">
                            {b.order?.orderNumber || "غير متوفر"}
                          </div>
                          {!isGuest && (
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {b.order?.customer?.name || "عميل مجهول"}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-400">
                          {b.order?.mixDesign?.code || "M-DEFAULT"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {b.quantity?.toFixed(2) || "0.00"} م³
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400 font-bold">
                          {new Date(b.createdAt).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
                            تم التحميل والتوجيه
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer of Table */}
          <div className="border-t border-white/5 pt-4 mt-4 text-slate-400 text-xs flex justify-between items-center font-bold">
            <span>
              * يتم تحديث الجدول تلقائياً كل 5 ثوانٍ عند استلام إشعارات المحطة.
            </span>
            <span className="font-mono text-[10px] text-slate-600">
              LATENCY: {systemLatency}ms
            </span>
          </div>
        </div>

        {/* Left Section: Quality Tests & Network Diagnostics (1/3 width) */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Quality cube tests */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex-1">
            <h2 className="text-base font-black text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Icons.ShieldCheck className="w-5 h-5 text-indigo-400" />
              عينات الفحص المخبري الفورية
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tests.length === 0 ? (
                <p className="text-slate-500 text-center py-8 font-bold text-sm">
                  لا توجد عينات فحص مسجلة اليوم.
                </p>
              ) : (
                tests.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-3 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs font-black text-white">
                        الطلب: {t.order?.orderNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        عمر الكسر: {t.age} يوم · الخلطة:{" "}
                        {t.order?.mixDesign?.code}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-amber-400 font-mono">
                        {t.mpa || "قيد الانتظار"}{" "}
                        <span className="text-[10px]">MPa</span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase mt-1 inline-block ${
                          t.status === "APPROVED"
                            ? "text-emerald-400"
                            : "text-slate-400 animate-pulse"
                        }`}
                      >
                        {t.status === "APPROVED" ? "مقبول" : "قيد الفحص"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Voice Assistant Diagnostic */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isVoiceListening ? "bg-indigo-500 animate-ping" : "bg-slate-700"}`}
                />
                المساعد والتحكم الصوتي المادي
              </h2>
              <button
                onClick={handleVoiceToggle}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
                  isVoiceListening
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {isVoiceListening ? "تعطيل المايك" : "تشغيل المايك"}
              </button>
            </div>
            <div className="p-3 bg-black/20 rounded-2xl border border-white/5 text-[11px] font-mono text-indigo-300 min-h-12 flex items-center">
              💬 {voiceLog}
            </div>
          </div>

          {/* TV Network status */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
            <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <Icons.Shield className="w-4 h-4 text-indigo-400" />
              حالة اتصال الشاشة ومزامنة التلفزيون
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-slate-400 block mb-1">الربط المادي</span>
                <span className="font-black text-emerald-400">مستقر (SSE)</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-slate-400 block mb-1">تخزين المتصفح</span>
                <span className="font-black text-indigo-400">مفعّل (100%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
