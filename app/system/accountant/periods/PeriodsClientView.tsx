"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  lockFinancialPeriodAction,
  unlockFinancialPeriodAction,
} from "@/app/actions/finance";

interface PeriodRecord {
  id: number;
  companyId: number;
  periodKey: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  closedAt: Date | string | null;
  closedById: number | null;
  closedByName: string | null;
  reason: string | null;
}

interface PeriodsClientViewProps {
  initialPeriods: PeriodRecord[];
  companyId: number;
  userRole: string;
  userName: string;
}

export function PeriodsClientView({
  initialPeriods,
  companyId,
  userRole,
  userName,
}: PeriodsClientViewProps) {
  const [periods, setPeriods] = useState<PeriodRecord[]>(initialPeriods);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State for Unlocking (Manager Only)
  const [unlockModalPeriod, setUnlockModalPeriod] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState("");

  // Modal State for Locking
  const [lockModalPeriod, setLockModalPeriod] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState("");

  const canUnlock = userRole === "MANAGER" || userRole === "SYSTEM_OWNER";
  const canLock =
    userRole === "ACCOUNTANT" ||
    userRole === "MANAGER" ||
    userRole === "SYSTEM_OWNER";

  // Generate 12 months for 2026
  const currentYear = new Date().getFullYear();
  const monthsList = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    const key = `${currentYear}-${m}`;
    const dateObj = new Date(currentYear, i, 1);
    const labelAr = format(dateObj, "MMMM yyyy", { locale: ar });
    const existing = periods.find((p) => p.periodKey === key);
    return {
      periodKey: key,
      labelAr,
      status: existing?.status || "OPEN",
      closedAt: existing?.closedAt,
      closedByName: existing?.closedByName,
      reason: existing?.reason,
    };
  });

  const handleLock = async () => {
    if (!lockModalPeriod) return;
    setLoadingKey(lockModalPeriod);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await lockFinancialPeriodAction(
        companyId,
        lockModalPeriod,
        lockReason || "إقفال وتدقيق شهري رسمي",
      );

      if (res.success && res.period) {
        setPeriods((prev) => {
          const filtered = prev.filter((p) => p.periodKey !== lockModalPeriod);
          return [res.period as any, ...filtered];
        });
        setSuccessMessage(`تم إقفال الفترة المالية لشهر (${lockModalPeriod}) بنجاح وتجميد المعاملات`);
        setLockModalPeriod(null);
        setLockReason("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "فشل إقفال الفترة المالية");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleUnlock = async () => {
    if (!unlockModalPeriod) return;
    if (!unlockReason.trim() || unlockReason.trim().length < 5) {
      setErrorMessage("يجب كتابة سبب رسمي ومفصل لا يقل عن 5 أحرف لفك القفل");
      return;
    }

    setLoadingKey(unlockModalPeriod);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await unlockFinancialPeriodAction(
        companyId,
        unlockModalPeriod,
        unlockReason,
      );

      if (res.success && res.period) {
        setPeriods((prev) => {
          const filtered = prev.filter((p) => p.periodKey !== unlockModalPeriod);
          return [res.period as any, ...filtered];
        });
        setSuccessMessage(`تم فك قفل الفترة المالية لشهر (${unlockModalPeriod}) بنجاح`);
        setUnlockModalPeriod(null);
        setUnlockReason("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "فشل فك قفل الفترة المالية");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white">
                منظومة إقفال الفترات والشهور المالية
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                تجميد وتدقيق السجلات المحاسبية لمنع التعديل أو الحذف على الفواتير والسندات بعد اعتمادها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>حماية سيادية غير قابلة للاختراق</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs font-bold animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Policy Instruction Card */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <Info className="w-4 h-4" />
          <span>قواعد السياسة المالية الصارمة:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pr-2">
          <li>إقفال الفترة المالية يمنع المحاسبين والمستخدمين من إنشاء أو تعديل أو إلغاء أي فاتورة أو سند صرف أو قيد يومي مؤرخ في ذلك الشهر.</li>
          <li>فك القفل بعد الإقفال محصور حصراً بالمدير العام أو مالك النظام مع إلزامية تسجيل سبب رسمي في سجل الرقابة المالي.</li>
          <li>كافة عمليات القفل وفك القفل تُسجل في سجل رقابي سيادي غير قابل للحذف.</li>
        </ul>
      </div>

      {/* Periods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monthsList.map((month) => {
          const isClosed = month.status === "CLOSED";
          const isLoading = loadingKey === month.periodKey;

          return (
            <div
              key={month.periodKey}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isClosed
                  ? "bg-red-950/20 border-red-500/30 shadow-lg shadow-red-950/20"
                  : "bg-slate-900/40 border-white/5 hover:border-indigo-500/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-black text-white">
                      {month.labelAr}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                      isClosed
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {isClosed ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>مقفلة ومحمية</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>فترة مفتوحة</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>رمز الفترة:</span>
                    <span className="font-mono text-slate-200 font-bold">{month.periodKey}</span>
                  </div>
                  {isClosed && (
                    <>
                      <div className="flex justify-between">
                        <span>تم الإقفال بواسطة:</span>
                        <span className="text-slate-200 font-bold">{month.closedByName || "المدير المالي"}</span>
                      </div>
                      {month.closedAt && (
                        <div className="flex justify-between">
                          <span>تاريخ الإقفال:</span>
                          <span className="text-slate-300">
                            {format(new Date(month.closedAt), "yyyy/MM/dd - HH:mm")}
                          </span>
                        </div>
                      )}
                      {month.reason && (
                        <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] text-slate-300">
                          {month.reason}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                {isClosed ? (
                  canUnlock ? (
                    <button
                      onClick={() => {
                        setUnlockModalPeriod(month.periodKey);
                        setUnlockReason("");
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-black transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>طلب فك القفل (مدير عام)</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold py-1">
                      يتطلب موافقة المدير العام للتعديل
                    </span>
                  )
                ) : (
                  canLock && (
                    <button
                      onClick={() => {
                        setLockModalPeriod(month.periodKey);
                        setLockReason("إقفال وتدقيق شهري رسمي");
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-black transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>إقفال الفترة وتجميد الحسابات</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lock Confirmation Modal */}
      {lockModalPeriod && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-400">
              <Lock className="w-6 h-6" />
              <h2 className="text-lg font-black text-white">
                تأكيد إقفال الفترة المالية ({lockModalPeriod})
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تحذير: إقفال هذا الشهر سيمنع بشكل فوري أي تعديل أو إضافة على الفواتير، المصروفات، وسندات القبض المؤرخة في ({lockModalPeriod}). هل أنت متأكد من اكتمال التدقيق؟
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">
                ملاحظات أو سبب الإقفال:
              </label>
              <textarea
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                rows={3}
                placeholder="أدخل سبب الإقفال أو رقم محضر التدقيق..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setLockModalPeriod(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleLock}
                disabled={loadingKey === lockModalPeriod}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all flex items-center gap-2"
              >
                {loadingKey === lockModalPeriod ? "جاري الإقفال..." : "تأكيد الإقفال الرسمي"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Confirmation Modal */}
      {unlockModalPeriod && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-amber-400">
              <Unlock className="w-6 h-6" />
              <h2 className="text-lg font-black text-white">
                فك قفل الفترة المالية ({unlockModalPeriod})
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تنبيه إداري سيادي: فك القفل يفتح الفترة لتعديل القيود المالية مجدداً. يجب تسجيل سبب رسمي مفصل ومبرر وسيتم توثيقه في سجل الرقابة المالي باسمك.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">
                السبب الرسمي لفك القفل (إلزامي):
              </label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                rows={3}
                placeholder="اكتب سبب فك القفل وموافقة الإدارة بالتفصيل..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUnlockModalPeriod(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleUnlock}
                disabled={loadingKey === unlockModalPeriod}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-all flex items-center gap-2"
              >
                {loadingKey === unlockModalPeriod ? "جاري فك القفل..." : "اعتماد فك القفل الرسمي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
