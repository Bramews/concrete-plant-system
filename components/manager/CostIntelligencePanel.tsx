"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  ShieldAlert,
} from "lucide-react";

interface OrderCostItem {
  id: number;
  orderNumber: string;
  customerName: string;
  volume: number; // m3
  materialCostPerM3: number; // IQD
  laborCostPerM3: number; // IQD
  transportDistance: number; // km
  revenue: number; // IQD
}

export function CostIntelligencePanel() {
  const [transportRatePerKm, setTransportRatePerKm] = useState<number>(3000); // IQD per km
  const [fixedOverhead, setFixedOverhead] = useState<number>(5000); // IQD per m3

  const orders: OrderCostItem[] = [
    {
      id: 1,
      orderNumber: "ORD-8392",
      customerName: "شركة الفرات للمقاولات",
      volume: 150,
      materialCostPerM3: 55000,
      laborCostPerM3: 3500,
      transportDistance: 12,
      revenue: 10500000,
    }, // Revenue is 70k/m3 * 150 = 10,500,000 IQD
    {
      id: 2,
      orderNumber: "ORD-9821",
      customerName: "بلدية بغداد الكبرى",
      volume: 80,
      materialCostPerM3: 58000,
      laborCostPerM3: 3500,
      transportDistance: 45,
      revenue: 5600000,
    }, // Revenue is 70k/m3 * 80 = 5,600,000 IQD
    {
      id: 3,
      orderNumber: "ORD-2041",
      customerName: "أبراج الكرادة السكنية",
      volume: 300,
      materialCostPerM3: 52000,
      laborCostPerM3: 3500,
      transportDistance: 8,
      revenue: 21600000,
    }, // Revenue is 72k/m3 * 300 = 21,600,000 IQD
    {
      id: 4,
      orderNumber: "ORD-1192",
      customerName: "مقاولات الجنوب الفرعية",
      volume: 40,
      materialCostPerM3: 62000,
      laborCostPerM3: 3500,
      transportDistance: 70,
      revenue: 2700000,
    }, // Revenue is 67.5k/m3 * 40 = 2,700,000 IQD
  ];

  const calculatedOrders = useMemo(() => {
    return orders.map((o) => {
      const materialCost = o.materialCostPerM3 * o.volume;
      const laborCost = o.laborCostPerM3 * o.volume;
      const transportCost =
        o.transportDistance * transportRatePerKm * (o.volume / 8); // Assuming 8m3 truck capacity
      const overheadCost = fixedOverhead * o.volume;
      const totalCost = materialCost + laborCost + transportCost + overheadCost;

      const profit = o.revenue - totalCost;
      const margin = (profit / o.revenue) * 100;
      const isLoss = profit < 0;

      return {
        ...o,
        materialCost,
        laborCost,
        transportCost,
        totalCost,
        profit,
        margin: Number(margin.toFixed(1)),
        isLoss,
      };
    });
  }, [orders, transportRatePerKm, fixedOverhead]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalRev = calculatedOrders.reduce((acc, o) => acc + o.revenue, 0);
    const totalCost = calculatedOrders.reduce((acc, o) => acc + o.totalCost, 0);
    const totalProfit = totalRev - totalCost;
    const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

    return {
      totalRev,
      totalCost,
      totalProfit,
      avgMargin: Number(avgMargin.toFixed(1)),
    };
  }, [calculatedOrders]);

  return (
    <div className="space-y-6 text-right">
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          ذكاء التكلفة وهامش الأرباح (Cost Intelligence)
        </h3>
        <p className="text-xs text-slate-400">
          تقدير وتحليل الربحية التفصيلية للطلبيات بناءً على استهلاك المواد
          الفعلي ومسافة النقل
        </p>
      </div>

      {/* Settings / Simulator Slider Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/20 border border-white/5 rounded-3xl p-5">
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-bold block">
            تعرفة النقل للكم (IQD/km)
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={transportRatePerKm}
              onChange={(e) => setTransportRatePerKm(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-sm font-bold text-white font-mono shrink-0 w-24 text-left">
              <BidiText>{transportRatePerKm.toLocaleString()}</BidiText> د.ع
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-bold block">
            التكاليف التشغيلية الثابتة (IQD/m³)
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="range"
              min="2000"
              max="15000"
              step="1000"
              value={fixedOverhead}
              onChange={(e) => setFixedOverhead(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-sm font-bold text-white font-mono shrink-0 w-24 text-left">
              <BidiText>{fixedOverhead.toLocaleString()}</BidiText> د.ع
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 p-5 rounded-2xl border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold block">
            إجمالي إيراد الطلبيات
          </span>
          <span className="text-xl font-black text-white mt-1 block">
            <BidiText>{stats.totalRev.toLocaleString()}</BidiText> IQD
          </span>
        </div>
        <div className="bg-slate-950 p-5 rounded-2xl border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold block">
            التكاليف والتحميلات الإجمالية
          </span>
          <span className="text-xl font-black text-slate-300 mt-1 block">
            <BidiText>{stats.totalCost.toLocaleString()}</BidiText> IQD
          </span>
        </div>
        <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block">
              صافي الربح المتوقع
            </span>
            <span className="text-xl font-black text-emerald-400 block">
              <BidiText>{stats.totalProfit.toLocaleString()}</BidiText> IQD
            </span>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-xl font-bold">
            <BidiText>{stats.avgMargin}</BidiText>%
          </span>
        </div>
      </div>

      {/* Orders Profitability Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  رقم الطلبية
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  العميل
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  الكمية (م³)
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  تكلفة المواد
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  تكلفة النقل
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  إجمالي التكلفة
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  هامش الربح
                </th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  الربحية المباشرة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-bold">
              {calculatedOrders.map((o) => (
                <tr
                  key={o.id}
                  className={`hover:bg-white/[0.02] border-b border-white/5 ${o.isLoss ? "bg-rose-950/5" : ""}`}
                >
                  <td className="px-6 py-4 font-mono text-sm text-indigo-400">
                    #{o.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-white text-sm">
                    {o.customerName}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <BidiText>{o.volume}</BidiText>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <BidiText>{o.materialCost.toLocaleString()}</BidiText>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <BidiText>
                      {Math.round(o.transportCost).toLocaleString()}
                    </BidiText>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <BidiText>
                      {Math.round(o.totalCost).toLocaleString()}
                    </BidiText>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${o.isLoss ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}
                    >
                      <BidiText>{o.margin}</BidiText>%
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-center text-sm font-black ${o.isLoss ? "text-rose-400" : "text-emerald-400"}`}
                  >
                    <BidiText>{o.profit.toLocaleString()}</BidiText> IQD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {calculatedOrders.some((o) => o.isLoss) && (
        <div className="p-4 bg-rose-950/20 border border-rose-500/10 rounded-2xl text-xs text-rose-400 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            تنبيه ربحية: هناك طلبيات تسجل هوامش ربح سالبة (خسائر مادية) بسبب
            تكاليف النقل البعيدة أو أسعار المواد الخام المرتفعة. يوصى بمراجعة
            الحد الأدنى لرسوم النقل للمناطق البعيدة.
          </p>
        </div>
      )}
    </div>
  );
}
