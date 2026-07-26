"use client";

import { useState, useMemo, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import {
  Globe,
  Activity,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Search,
  ShieldAlert,
  CheckCircle,
  Database,
  Cpu,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface SystemIntelligenceProps {
  changeRequests: any[];
  auditLogs: any[];
}

export function SystemIntelligence({
  changeRequests = [],
  auditLogs = [],
}: SystemIntelligenceProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "map" | "dna" | "revenue" | "flags" | "audit"
  >("map");

  // Mock tenants for Mission Control Map
  const [tenants, setTenants] = useState([
    {
      id: 1,
      name: "شركة الفرات للخرسانة",
      city: "بغداد",
      status: "active",
      MRR: 1200,
      latency: 12,
      flagVoice: true,
      flagOffline: true,
    },
    {
      id: 2,
      name: "مجموعة الرياض للمقاولات",
      city: "الرياض",
      status: "warning",
      MRR: 2500,
      latency: 45,
      flagVoice: false,
      flagOffline: true,
    },
    {
      id: 3,
      name: "شركة حديد البصرة",
      city: "البصرة",
      status: "active",
      MRR: 950,
      latency: 18,
      flagVoice: true,
      flagOffline: false,
    },
    {
      id: 4,
      name: "خرسانة جدة الجاهزة",
      city: "جدة",
      status: "problem",
      MRR: 1800,
      latency: 180,
      flagVoice: false,
      flagOffline: false,
    },
    {
      id: 5,
      name: "أبراج أربيل للتطوير",
      city: "أربيل",
      status: "active",
      MRR: 3100,
      latency: 14,
      flagVoice: true,
      flagOffline: true,
    },
  ]);

  // Feature Flag Toggle
  const toggleFlag = (tenantId: number, flag: "flagVoice" | "flagOffline") => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, [flag]: !t[flag] } : t)),
    );
    toast.success("تم تحديث خيارات الميزات للشركة بنجاح.");
  };

  // EKG simulated state
  const [ekgData, setEkgData] = useState<number[]>(Array(20).fill(40));
  useEffect(() => {
    const interval = setInterval(() => {
      setEkgData((prev) => {
        const next = [...prev.slice(1)];
        const randVal =
          Math.random() > 0.8
            ? Math.random() * 80 + 10
            : Math.random() * 20 + 30;
        next.push(randVal);
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Filter audit logs
  const [auditQuery, setAuditQuery] = useState("");
  const filteredAudits = useMemo(() => {
    const defaultLogs = [
      {
        id: "1",
        action: "تعديل خلطة الخرسانة",
        user: "المهندس علي",
        timestamp: "منذ 5 د",
        severity: "info",
        company: "شركة الفرات",
      },
      {
        id: "2",
        action: "محاولة دخول خاطئة متكررة",
        user: "نظام الأمان",
        timestamp: "منذ 15 د",
        severity: "warning",
        company: "خرسانة جدة",
      },
      {
        id: "3",
        action: "تغيير إعدادات الفوترة",
        user: "المحاسب أحمد",
        timestamp: "منذ ساعة",
        severity: "info",
        company: "أبراج أربيل",
      },
      {
        id: "4",
        action: "إيقاف مفاجئ للمشغل الرئيسي",
        user: "مستشعر الخلاطة",
        timestamp: "منذ ساعتين",
        severity: "critical",
        company: "شركة حديد البصرة",
      },
    ];
    const sourceLogs = auditLogs.length > 0 ? auditLogs : defaultLogs;
    return sourceLogs.filter(
      (log) =>
        log.action.includes(auditQuery) ||
        log.user.includes(auditQuery) ||
        (log.company && log.company.includes(auditQuery)),
    );
  }, [auditLogs, auditQuery]);

  return (
    <div className="bg-[#0b0f1a] border border-white/5 rounded-[2.5rem] p-6 lg:p-8 space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
        {[
          { id: "map", label: "Mission Control (الخريطة)", icon: Globe },
          { id: "dna", label: "System DNA (نبض النظام)", icon: Activity },
          { id: "revenue", label: "الذكاء المالي و Churn", icon: DollarSign },
          { id: "flags", label: "إدارة الميزات (Flags)", icon: ToggleRight },
          { id: "audit", label: "سجلات التدقيق (Audit)", icon: ShieldAlert },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "bg-white/5 text-slate-400 border border-white/5 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* 1. MAP VIEW */}
        {activeSubTab === "map" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Canvas Mockup */}
              <div className="lg:col-span-2 bg-[#020617] rounded-3xl p-4 border border-white/5 relative min-h-[350px] flex items-center justify-center overflow-hidden">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* SVG Map Path outlines */}
                <svg
                  className="w-full h-full opacity-10 absolute inset-0"
                  viewBox="0 0 500 500"
                >
                  <path
                    d="M 150 100 Q 250 50 350 100 T 450 300 Q 400 450 250 480 T 50 300 Z"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>

                {/* Tenant Map Nodes */}
                {tenants.map((t, index) => {
                  const positions = [
                    { top: "30%", left: "45%" }, // Baghdad
                    { top: "60%", left: "30%" }, // Riyadh
                    { top: "42%", left: "55%" }, // Basra
                    { top: "65%", left: "20%" }, // Jeddah
                    { top: "20%", left: "48%" }, // Erbil
                  ];
                  const pos = positions[index] || { top: "50%", left: "50%" };

                  return (
                    <div
                      key={t.id}
                      style={{ top: pos.top, left: pos.left }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                    >
                      <div className="relative">
                        <span
                          className={`absolute -inset-2 rounded-full animate-ping opacity-70 ${
                            t.status === "active"
                              ? "bg-emerald-500"
                              : t.status === "warning"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                        <div
                          className={`w-4 h-4 rounded-full border border-slate-950 relative z-10 ${
                            t.status === "active"
                              ? "bg-emerald-500"
                              : t.status === "warning"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                      </div>

                      {/* Tooltip */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 w-48 z-20">
                        <h5 className="font-black text-xs text-white mb-1">
                          {t.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          المدينة: {t.city}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          الاستجابة:{" "}
                          <span className="font-mono text-white">
                            <BidiText>{t.latency}</BidiText>ms
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          حالة الاشتراك:{" "}
                          <span
                            className={
                              t.status === "active"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {t.status === "active" ? "نشط" : "معلق"}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur border border-white/10 px-3 py-2 rounded-xl text-[10px] text-slate-400 space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    اتصال مستقر
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    استجابة بطيئة
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    خارج التغطية / منقطع
                  </div>
                </div>
              </div>

              {/* Sidebar: Selected Company mini-dashboard */}
              <div className="bg-[#020617] rounded-3xl p-5 border border-white/5 space-y-4">
                <h4 className="font-black text-white text-sm tracking-tight">
                  إحصائيات الاتصال الجغرافي
                </h4>
                <div className="space-y-3">
                  {tenants.map((t) => (
                    <div
                      key={t.id}
                      className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-white/5"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{t.name}</p>
                        <p className="text-[10px] text-slate-500">{t.city}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : t.status === "warning"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        <BidiText>{t.latency}</BidiText>ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SYSTEM DNA (EKG) */}
        {activeSubTab === "dna" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#020617] rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    استجابة قاعدة البيانات
                  </span>
                  <span className="text-xl font-black text-white">
                    <BidiText>14.5</BidiText>ms
                  </span>
                </div>
                <Database className="w-8 h-8 text-indigo-500 opacity-60" />
              </div>
              <div className="bg-[#020617] rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    معدل معالجة الطلبات
                  </span>
                  <span className="text-xl font-black text-white">
                    <BidiText>185</BidiText>/ث
                  </span>
                </div>
                <Cpu className="w-8 h-8 text-cyan-500 opacity-60" />
              </div>
              <div className="bg-[#020617] rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    استهلاك الذاكرة المؤقتة
                  </span>
                  <span className="text-xl font-black text-white">
                    <BidiText>34</BidiText>%
                  </span>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500 opacity-60" />
              </div>
              <div className="bg-[#020617] rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    مؤشر الصحة الكلي
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    <BidiText>98</BidiText>%
                  </span>
                </div>
                <Activity className="w-8 h-8 text-emerald-400 opacity-60" />
              </div>
            </div>

            {/* EKG Graph */}
            <div className="bg-[#020617] rounded-3xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-black text-white text-sm">
                    مخطط النبض التشغيلي اللحظي (System EKG)
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    تمثيل حي للعمليات الجارية في المنظومة حالياً
                  </p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black">
                  حي
                </span>
              </div>

              {/* EKG Draw */}
              <div className="h-32 w-full bg-slate-950/80 rounded-2xl relative overflow-hidden flex items-end">
                <svg
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    points={ekgData
                      .map(
                        (val, idx) =>
                          `${(idx / (ekgData.length - 1)) * 100},${100 - val}`,
                      )
                      .join(" ")}
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 3. REVENUE INTELLIGENCE & CHURN PREDICTION */}
        {activeSubTab === "revenue" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* MRR & Finance Summary */}
              <div className="bg-[#020617] rounded-3xl p-6 border border-white/5 space-y-4">
                <h4 className="font-black text-white text-sm">
                  الإيرادات المتكررة الكلية (MRR)
                </h4>
                <div className="text-3xl font-black text-white">
                  $<BidiText>23,450</BidiText>{" "}
                  <span className="text-xs text-slate-500">شهرياً</span>
                </div>
                <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>نسبة نمو الإيرادات (شهرياً):</span>
                    <span className="text-emerald-400 font-extrabold">
                      +12.5%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>القيمة الكلية لعمر العميل (LTV):</span>
                    <span className="text-white font-extrabold">
                      $<BidiText>84,200</BidiText>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>متوسط إيراد كل شركة:</span>
                    <span className="text-white font-extrabold">
                      $<BidiText>4,690</BidiText>
                    </span>
                  </div>
                </div>
              </div>

              {/* Churn Prediction Box */}
              <div className="lg:col-span-2 bg-[#020617] rounded-3xl p-6 border border-white/5 space-y-4">
                <h4 className="font-black text-white text-sm">
                  مستكشف مخاطر إلغاء الاشتراك (AI Churn Risk)
                </h4>
                <p className="text-xs text-slate-500">
                  توقع ذكي للشركات المحتمل إلغاء اشتراكها بناءً على انقطاع
                  الاستخدام
                </p>
                <div className="space-y-3">
                  {[
                    {
                      company: "خرسانة جدة الجاهزة",
                      risk: 73,
                      status: "high",
                      reason: "لم يقم المشغل بتسجيل أي دفعة منذ 30 يوماً",
                    },
                    {
                      company: "مجموعة الرياض للمقاولات",
                      risk: 42,
                      status: "medium",
                      reason: "تأخر متكرر في استجابة الحساسات والطلب الإضافي",
                    },
                    {
                      company: "شركة حديد البصرة",
                      risk: 14,
                      status: "low",
                      reason: "استخدام مكثف يومي وإنتاج متكامل",
                    },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-slate-900/60 rounded-2xl border border-white/5"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">
                          {c.company}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          السبب: {c.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            c.status === "high"
                              ? "bg-rose-500/10 text-rose-400"
                              : c.status === "medium"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          مخاطرة <BidiText>{c.risk}</BidiText>%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. FEATURE FLAGS */}
        {activeSubTab === "flags" && (
          <div className="space-y-6">
            <div className="bg-[#020617] rounded-3xl p-6 border border-white/5 space-y-4">
              <h4 className="font-black text-white text-sm">
                إدارة ميزات النظام (Feature Flags Matrix)
              </h4>
              <p className="text-xs text-slate-500">
                تفعيل/تعطيل الميزات المتقدمة للشركات والعملاء مباشرة
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold">
                    <tr>
                      <th className="p-3">الشركة</th>
                      <th className="p-3 text-center">المساعد الصوتي الذكي</th>
                      <th className="p-3 text-center">
                        التشغيل دون إنترنت (Offline)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-white">{t.name}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleFlag(t.id, "flagVoice")}
                            className="inline-flex"
                          >
                            {t.flagVoice ? (
                              <ToggleRight className="w-8 h-8 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-600" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleFlag(t.id, "flagOffline")}
                            className="inline-flex"
                          >
                            {t.flagOffline ? (
                              <ToggleRight className="w-8 h-8 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-600" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. AUDIT UNIVERSE */}
        {activeSubTab === "audit" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#020617] p-3 rounded-2xl border border-white/5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث في الإجراءات أو الشركات أو الموظفين..."
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pr-10 pl-4 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                Visual Audit Universe
              </span>
            </div>

            <div className="space-y-3">
              {filteredAudits.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-[#020617] border border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        log.severity === "critical"
                          ? "bg-rose-500/20 text-rose-400"
                          : log.severity === "warning"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        الشركة: {log.company} | الموظف: {log.user}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
