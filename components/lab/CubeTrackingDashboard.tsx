"use client";

import { useState, useMemo } from "react";
import {
  format,
  differenceInDays,
  addDays,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Award,
  Pin,
  ChevronDown,
} from "lucide-react";
import { useEffect } from "react";

interface Test {
  id: string | number;
  status: string;
  orderId?: number;
  order: any;
  age?: number;
  sampleDate: string | Date;
  kn?: number | null;
  mpa?: number | null;
  strength?: number | null;
  notes?: string;
}

interface CubeTrackingDashboardProps {
  tests: Test[];
  onSelectOrderAge?: (orderId: number, sampleDate: string, age: number) => void;
}

export function CubeTrackingDashboard({
  tests,
  onSelectOrderAge,
}: CubeTrackingDashboardProps) {
  const [filter, setFilter] = useState<"today" | "tomorrow" | "week" | "all">(
    "today",
  );
  const [showStatistics, setShowStatistics] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pinnedFilter, setPinnedFilter] = useState<string | null>(null);

  // Hydrate pinned default filter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("cube_dashboard_pinned_filter");
      if (savedPin) {
        setTimeout(() => {
          setPinnedFilter(savedPin);
          setFilter(savedPin as "today" | "tomorrow" | "week" | "all");
        }, 0);
      }
    }
  }, []);

  const handlePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (pinnedFilter === id) {
      localStorage.removeItem("cube_dashboard_pinned_filter");
      setPinnedFilter(null);
    } else {
      localStorage.setItem("cube_dashboard_pinned_filter", id);
      setPinnedFilter(id);
    }
  };

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const endOfWeek = useMemo(() => addDays(today, 7), [today]);

  // Calculate target testing date for each test based on sampleDate + age
  const testsWithTargetDates = useMemo(() => {
    return tests.map((t) => {
      const sDate = new Date(t.sampleDate);
      const targetDate = addDays(sDate, t.age || 7);
      const daysRemaining = differenceInDays(targetDate, today);

      return {
        ...t,
        targetDate,
        daysRemaining,
      };
    });
  }, [tests, today]);

  // Filtered tests for countdown cards
  const filteredTests = useMemo(() => {
    return testsWithTargetDates.filter((t) => {
      if (t.status !== "PENDING") return false;

      if (filter === "today") {
        return isSameDay(t.targetDate, today) || t.daysRemaining < 0;
      }
      if (filter === "tomorrow") {
        return isSameDay(t.targetDate, tomorrow);
      }
      if (filter === "week") {
        return isWithinInterval(t.targetDate, { start: today, end: endOfWeek });
      }
      return true;
    });
  }, [testsWithTargetDates, filter, today, tomorrow, endOfWeek]);

  // Grouped cards logic
  const groupedCards = useMemo(() => {
    const groups: Record<
      string,
      {
        orderId: number;
        orderNumber: string;
        clientName: string;
        sampleDate: string | Date;
        mixGrade: string;
        dueAges: { age: number; daysRemaining: number; count: number }[];
        maxOverdueDays: number;
        minDaysRemaining: number;
      }
    > = {};

    filteredTests.forEach((t) => {
      const orderId = Number(
        t.orderId || (t.order as { id?: number | string })?.id || 0,
      );
      const groupKey = `${t.order.orderNumber}_${format(new Date(t.sampleDate), "yyyy-MM-dd")}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          orderId,
          orderNumber: t.order.orderNumber,
          clientName:
            t.order.clientName || t.order.customer?.name || "عميل عام",
          sampleDate: t.sampleDate,
          mixGrade:
            t.order.mixDesign?.grade || t.order.mixDesign?.code || "C30/37",
          dueAges: [],
          maxOverdueDays: 0,
          minDaysRemaining: Infinity,
        };
      }

      const group = groups[groupKey];
      const ageVal = t.age || 7;

      let ageGroup = group.dueAges.find((a) => a.age === ageVal);
      if (!ageGroup) {
        ageGroup = {
          age: ageVal,
          daysRemaining: t.daysRemaining,
          count: 0,
        };
        group.dueAges.push(ageGroup);
      }
      ageGroup.count += 1;

      if (t.daysRemaining < 0) {
        group.maxOverdueDays = Math.max(
          group.maxOverdueDays,
          Math.abs(t.daysRemaining),
        );
      }
      group.minDaysRemaining = Math.min(
        group.minDaysRemaining,
        t.daysRemaining,
      );
    });

    Object.values(groups).forEach((g) => {
      g.dueAges.sort((a, b) => a.age - b.age);
    });

    return Object.values(groups);
  }, [filteredTests]);

  // Alert count for today
  const alertCount = useMemo(() => {
    return testsWithTargetDates.filter(
      (t) =>
        t.status === "PENDING" &&
        (isSameDay(t.targetDate, today) || t.daysRemaining < 0),
    ).length;
  }, [testsWithTargetDates, today]);

  // Stat analysis by Mix Grade (fck = f28 - 1.65σ)
  const mixAnalysis = useMemo(() => {
    const completedTests = tests.filter(
      (t) => t.status === "APPROVED" || t.status === "COMPLETED",
    );
    const grouped: Record<string, number[]> = {};

    completedTests.forEach((t) => {
      const grade =
        t.order?.mixDesign?.grade || t.order?.mixDesign?.code || "C30/37";
      const value = t.mpa || t.strength || 0;
      if (value > 0) {
        if (!grouped[grade]) grouped[grade] = [];
        grouped[grade].push(value);
      }
    });

    return Object.entries(grouped)
      .map(([grade, values]) => {
        const count = values.length;
        if (count === 0) return null;

        const sum = values.reduce((acc, v) => acc + v, 0);
        const mean = sum / count;

        // Standard Deviation (σ)
        const variance =
          values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
          (count > 1 ? count - 1 : 1);
        const sigma = Math.sqrt(variance);

        // fck = mean - 1.65 * sigma
        const fck = mean - 1.65 * sigma;

        return {
          grade,
          count,
          mean: Number(mean.toFixed(2)),
          sigma: Number(sigma.toFixed(2)),
          fck: Number(fck.toFixed(2)),
          status: fck >= parseFloat(grade.replace(/\D/g, "")) ? "PASS" : "FAIL",
        };
      })
      .filter(Boolean);
  }, [tests]);

  return (
    <div className="space-y-6">
      {/* Alert bar */}
      {alertCount > 0 && (
        <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-center justify-between text-rose-400 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">
              تنبيه فحص المكعبات اليومي: لديك <BidiText>{alertCount}</BidiText>{" "}
              عينات خرسانية مستحقة للكسر اليوم!
            </span>
          </div>
          <span className="text-xs bg-rose-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
            هام
          </span>
        </div>
      )}

      {/* Filter Dropdown */}
      <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-2xl border border-white/5 relative">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/60 border border-white/5 text-xs font-bold text-white hover:bg-slate-950 transition-all shadow-md min-w-[170px] justify-between"
          >
            <div className="flex items-center gap-2">
              {pinnedFilter === filter && (
                <Pin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              )}
              <span>
                {filter === "today"
                  ? "مستحق اليوم"
                  : filter === "tomorrow"
                    ? "مستحق غداً"
                    : filter === "week"
                      ? "مستحق هذا الأسبوع"
                      : "جميع المعلق"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-md p-1.5 shadow-2xl z-20">
                {[
                  { id: "today", label: "مستحق اليوم" },
                  { id: "tomorrow", label: "مستحق غداً" },
                  { id: "week", label: "مستحق هذا الأسبوع" },
                  { id: "all", label: "جميع المعلق" },
                ].map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => {
                      setFilter(
                        tab.id as "today" | "tomorrow" | "week" | "all",
                      );
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filter === tab.id
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <button
                      onClick={(e) => handlePin(e, tab.id)}
                      className={`p-1 rounded-md hover:bg-white/10 transition-all ${
                        pinnedFilter === tab.id
                          ? "text-emerald-400 animate-pulse"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                      title={
                        pinnedFilter === tab.id
                          ? "إلغاء التثبيت كافتراضي"
                          : "تثبيت كخيار افتراضي"
                      }
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${pinnedFilter === tab.id ? "fill-emerald-400" : ""}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatistics((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              showStatistics
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-slate-900/40 text-slate-400 border-white/5 hover:text-white"
            }`}
          >
            {showStatistics ? "إخفاء التحليل الإحصائي" : "عرض التحليل الإحصائي"}
          </button>
          <span className="text-xs font-bold text-slate-500">
            تتبع المكعبات النشطة
          </span>
        </div>
      </div>

      {/* Cube Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupedCards.map((card) => {
          const isOverdue = card.minDaysRemaining < 0;
          const isDueToday = card.minDaysRemaining === 0;

          return (
            <div
              key={`${card.orderNumber}_${card.sampleDate}`}
              onClick={() => {
                if (onSelectOrderAge) {
                  const targetGroup =
                    card.dueAges.find((a) => {
                      if (filter === "today") return a.daysRemaining <= 0;
                      if (filter === "tomorrow") return a.daysRemaining === 1;
                      if (filter === "week")
                        return a.daysRemaining >= 0 && a.daysRemaining <= 7;
                      return true;
                    }) || card.dueAges[0];
                  const dueAge = targetGroup ? targetGroup.age : 7;
                  onSelectOrderAge(
                    card.orderId,
                    new Date(card.sampleDate).toISOString(),
                    dueAge,
                  );
                }
              }}
              className={`p-5 rounded-2xl border bg-slate-900/20 backdrop-blur-sm space-y-4 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group cursor-pointer ${
                isOverdue
                  ? "border-rose-500/20 hover:border-rose-500/40"
                  : isDueToday
                    ? "border-amber-500/20 hover:border-amber-500/40"
                    : "border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5 font-mono text-xs font-bold">
                  #{card.orderNumber}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {isOverdue ? (
                    <span className="text-rose-400 font-extrabold">
                      متأخر بـ <BidiText>{card.maxOverdueDays}</BidiText> يوم
                    </span>
                  ) : isDueToday ? (
                    <span className="text-amber-400 font-extrabold">
                      مستحق اليوم
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      متبقي <BidiText>{card.minDaysRemaining}</BidiText> يوم
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-black text-white text-sm truncate">
                  {card.clientName}
                </h4>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  تاريخ أخذ العينة:{" "}
                  <BidiText>
                    {format(new Date(card.sampleDate), "yyyy-MM-dd")}
                  </BidiText>
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  الخلطة:{" "}
                  <span className="text-white font-extrabold font-mono">
                    {card.mixGrade}
                  </span>
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">
                  انقر لتسجيل النتائج للعينات المستحقة
                </span>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg font-black font-mono">
                  {card.dueAges.map((g) => g.age).join(" / ")} يوم
                </span>
              </div>
            </div>
          );
        })}

        {groupedCards.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/10 rounded-2xl border border-dashed border-white/5 text-slate-500 text-sm font-bold">
            لا توجد مكعبات مستحقة للفحص في النطاق الزمني المحدد.
          </div>
        )}
      </div>

      {/* Statistical Analysis Section */}
      {showStatistics && (
        <div className="pt-6 border-t border-white/5">
          <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            تحليل جودة الخلطات الإحصائي (Characteristic Strength)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mixAnalysis.map((analysis) => {
              if (!analysis) return null;
              return (
                <div
                  key={analysis.grade}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-white">
                      {analysis.grade}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-black border ${
                        analysis.status === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {analysis.status === "PASS"
                        ? "جودة مستقرة ✓"
                        : "تفاوت جودة ⚠️"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block">
                        العينات المفحوصة
                      </span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        <BidiText>{analysis.count}</BidiText>
                      </span>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block">
                        الانحراف المعياري (σ)
                      </span>
                      <span className="text-sm font-bold font-mono text-indigo-400 mt-1 block">
                        <BidiText>{analysis.sigma}</BidiText>
                      </span>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block">
                        قيمة المقاومة الإحصائية fck
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">
                        <BidiText>{analysis.fck}</BidiText> MPa
                      </span>
                    </div>
                  </div>

                  {analysis.status === "FAIL" && (
                    <div className="p-3 bg-rose-950/20 border border-rose-500/10 rounded-xl text-[11px] text-rose-400 flex gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>
                        تنبيه جودة: الانحراف المعياري المرتفع أدى لهبوط مقاومة
                        الخلطة الإحصائية fck عن رتبة التصميم ({analysis.grade}).
                        يوصى بمراجعة دقة أوزان الخلاطة ونسب المواد.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {mixAnalysis.length === 0 && (
              <div className="col-span-full py-6 text-center text-slate-500 text-xs font-bold">
                لا توجد فحوصات معتمدة كافية لتوليد التحليل الإحصائي لـ fck.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
