import React from "react";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CockpitClientTabs from "./CockpitClientTabs";
import PlantMap from "@/components/operator/PlantMap";
import LiveGauges from "@/components/operator/LiveGauges";
import DailyTimeline from "@/components/operator/DailyTimeline";
import ActiveOrdersKanban from "@/components/operator/ActiveOrdersKanban";
import DriverPwaSimulator from "@/components/operator/DriverPwaSimulator";
import OneClickProduction from "@/components/operator/OneClickProduction";
import MixerStatusBar from "@/components/operator/MixerStatusBar";
import AlarmPanel from "@/components/operator/AlarmPanel";
import ProcessFlow from "@/components/operator/ProcessFlow";
import { Factory, Activity, Layers, Clock } from "lucide-react";

export default async function OperatorCockpitPage() {
  try {
    await requireRole([
      "OPERATOR",
      "MANAGER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "SYSTEM_OWNER",
    ]);
  } catch {
    redirect("/api/auth/session-cleanup");
  }

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }
  const companyId = user.companyId as number;

  // Fetch today's data for KPIs
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const batches = await prisma.batch.findMany({
    where: {
      companyId,
      createdAt: { gte: startOfDay },
    },
    orderBy: { createdAt: "desc" },
  });

  const orders = await prisma.order.findMany({
    where: {
      companyId,
      status: { in: ["PRODUCTION", "LAB_APPROVED"] },
    },
    include: {
      customer: true,
      mixDesign: true,
    },
  });

  const totalBatchesToday = batches.length;
  const totalVolumeToday = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const activeOrdersCount = orders.length;
  const lastBatchTime = batches[0]
    ? new Date(batches[0].createdAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const oneClickOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer?.name || "عميل عام",
    volume: o.volume,
    actualQuantity: (o as unknown as { actualQuantity?: number }).actualQuantity || 0,
    mixGrade: o.mixDesign?.code || "C30",
  }));

  return (
    <div className="space-y-6" dir="rtl">
      {/* الصف 1: KPI Cards — 4 بطاقات قياسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: دفعات اليوم */}
        <div className="op-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Factory className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black font-mono text-white tracking-tight">
                {totalBatchesToday}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 op-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              دفعات خلط اليوم
            </p>
          </div>
        </div>

        {/* KPI 2: كمية الخرسانة المصبوبة اليوم */}
        <div className="op-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black font-mono text-white tracking-tight">
                {totalVolumeToday.toFixed(1)} <span className="text-sm font-normal text-slate-400">م³</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 op-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              إجمالي حجم الخرسانة اليوم
            </p>
          </div>
        </div>

        {/* KPI 3: الطلبات النشطة */}
        <div className="op-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Layers className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black font-mono text-white tracking-tight">
                {activeOrdersCount}
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 op-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              طلبيات قيد التنفيذ
            </p>
          </div>
        </div>

        {/* KPI 4: وقت آخر دفعة */}
        <div className="op-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black font-mono text-white tracking-tight mt-1">
                {lastBatchTime}
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 op-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              وقت آخر دفعة خلط
            </p>
          </div>
        </div>
      </div>

      {/* شريط حالة الخلاط الحي */}
      <MixerStatusBar />

      {/* لوحة الإنذارات الذكية */}
      <AlarmPanel />

      {/* خريطة تدفق المواد */}
      <ProcessFlow />

      {/* Cockpit Tabs Container */}
      <CockpitClientTabs
        PlantMap={<div className="op-card p-0 overflow-hidden"><PlantMap /></div>}
        LiveGauges={<div className="op-card p-4"><LiveGauges /></div>}
        DailyTimeline={<div className="op-card p-4"><DailyTimeline /></div>}
        ActiveOrdersKanban={<div className="op-card p-4"><ActiveOrdersKanban /></div>}
        DriverPwaSimulator={<div className="op-card p-4"><DriverPwaSimulator /></div>}
        OneClickProduction={<OneClickProduction orders={oneClickOrders} />}
      />
    </div>
  );
}
