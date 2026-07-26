"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
  Check,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface AlertItem {
  id: number;
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY" | string;
  message: string;
  category:
    | "EQUIPMENT"
    | "LAB"
    | "INVENTORY"
    | "LOGISTICS"
    | "FINANCE"
    | "USER"
    | string;
  timestamp: string | Date;
  resolved: boolean;
  assignedTo?: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 1,
    severity: "CRITICAL",
    message:
      "تنبيه مخزون: كمية الإسمنت المتبقية في الصومعة 1 تقل عن حد الأمان (15 طن فقط)",
    category: "INVENTORY",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    resolved: false,
  },
  {
    id: 2,
    severity: "WARNING",
    message: "عطل آلي: ارتفاع حرارة الخلاطة الكبيرة 2 لتصل إلى 85 درجة مئوية",
    category: "EQUIPMENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    resolved: false,
  },
  {
    id: 3,
    severity: "EMERGENCY",
    message: "فحص المختبر: فشل كسر مكعبات طلبية رقم #ORD-982 لعمر 7 أيام",
    category: "LAB",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    resolved: false,
  },
  {
    id: 4,
    severity: "INFO",
    message:
      "المالية: تجاوز ميزانية صيانة ناقلات المواد الخام للشهر الجاري بنسبة 12%",
    category: "FINANCE",
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    resolved: true,
  },
  {
    id: 5,
    severity: "WARNING",
    message:
      "حركة مستخدمين: محاولة تسجيل دخول فاشلة متكررة خارج أوقات العمل للمشغل أحمد",
    category: "USER",
    timestamp: new Date(Date.now() - 1000 * 60 * 600),
    resolved: false,
  },
];

export function SmartAlertCenter() {
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === "active" && a.resolved) return false;
      if (filter === "resolved" && !a.resolved) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter)
        return false;
      return true;
    });
  }, [alerts, filter, categoryFilter]);

  const handleResolve = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
    );
    toast.success("تم إغلاق ومعالجة الإنذار بنجاح.");
  };

  const handleAssign = (id: number, user: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignedTo: user } : a)),
    );
    toast.success(`تم إسناد المهمة للمسؤول: ${user}`);
  };

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            مركز الإنذار الذكي (Smart Alert Center)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            مراقبة الإنذارات متعددة الأقسام وإسناد المهام للمسؤولين لحظياً
          </p>
        </div>

        <div className="flex gap-2">
          {["all", "active", "resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {tab === "all"
                ? "الكل"
                : tab === "active"
                  ? "النشطة"
                  : "المعالجة"}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "جميع الأقسام" },
          { id: "INVENTORY", label: "المخازن والمخزون" },
          { id: "EQUIPMENT", label: "المعدات والأعطال" },
          { id: "LAB", label: "المختبر والجودة" },
          { id: "FINANCE", label: "المالية والتكاليف" },
          { id: "USER", label: "الأمن والمستخدمين" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              categoryFilter === cat.id
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                : "bg-slate-950/40 text-slate-500 border-white/5 hover:text-slate-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/10 rounded-2xl border border-dashed border-white/5 text-slate-500 text-sm font-bold">
            لا توجد إنذارات مطابقة للمعايير المحددة.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical =
              alert.severity === "CRITICAL" || alert.severity === "EMERGENCY";
            const dateStr = format(new Date(alert.timestamp), "HH:mm");

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border bg-slate-900/10 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all relative overflow-hidden ${
                  alert.resolved
                    ? "border-emerald-500/20 opacity-60"
                    : isCritical
                      ? "border-rose-500/30 bg-rose-950/5"
                      : "border-white/5"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      alert.resolved
                        ? "bg-emerald-500/10 text-emerald-400"
                        : isCritical
                          ? "bg-rose-500/10 text-rose-400 animate-pulse"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {alert.resolved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          isCritical
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        القسم: {alert.category}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <BidiText>{dateStr}</BidiText>
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-white leading-relaxed">
                      {alert.message}
                    </p>
                    {alert.assignedTo && (
                      <p className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        المسؤول المكلف: {alert.assignedTo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 self-stretch md:self-auto justify-end">
                  {!alert.resolved && (
                    <>
                      <button
                        onClick={() => handleAssign(alert.id, "م. أحمد الشمري")}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        إسناد
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        حل ومعالجة
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
