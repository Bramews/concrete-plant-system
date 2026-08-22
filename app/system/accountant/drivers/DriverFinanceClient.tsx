"use client";

import React, { useState, useTransition } from "react";
import {
  DriverTripSummary,
  DriverFinanceDashboardData,
  saveDriverTripRate,
  recordDriverPayout,
} from "@/app/actions/driver-finance";
import { toast } from "sonner";
import {
  Truck,
  Users,
  Receipt,
  Layers,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Edit3,
  X,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Download,
} from "lucide-react";

interface DriverFinanceClientProps {
  initialData: DriverFinanceDashboardData;
  companyId: number;
}

export function DriverFinanceClient({
  initialData,
  companyId,
}: DriverFinanceClientProps) {
  const [data, setData] = useState<DriverFinanceDashboardData>(initialData);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"DRIVERS" | "ALL_TICKETS">("DRIVERS");

  // Modals state
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState<DriverTripSummary | null>(null);
  const [payoutDriver, setPayoutDriver] = useState<DriverTripSummary | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [payoutNotes, setPayoutNotes] = useState("");

  const [editingRateDriver, setEditingRateDriver] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState<number>(15000);

  const [isPending, startTransition] = useTransition();

  const filteredDrivers = data.drivers.filter(
    (d) =>
      d.driverName.toLowerCase().includes(search.toLowerCase()) ||
      d.truckNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredTickets = data.allTickets.filter(
    (t) =>
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.truckNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSaveRate = (driverName: string) => {
    if (newRateValue < 0) {
      toast.error("أجر النقلة يجب أن يكون رقماً موجباً");
      return;
    }
    startTransition(async () => {
      try {
        const res = await saveDriverTripRate(companyId, driverName, newRateValue);
        if (res.success) {
          toast.success(`تم تحديث أجر النقلة للسائق ${driverName} بنجاح`);
          setData((prev) => ({
            ...prev,
            drivers: prev.drivers.map((d) =>
              d.driverName === driverName
                ? {
                    ...d,
                    ratePerTrip: newRateValue,
                    totalEarned: d.totalTrips * newRateValue,
                    balanceDue: Math.max(0, d.totalTrips * newRateValue - d.totalPaid),
                  }
                : d,
            ),
          }));
          setEditingRateDriver(null);
        }
      } catch {
        toast.error("فشل حفظ أجر النقلة");
      }
    });
  };

  const handleExecutePayout = () => {
    if (!payoutDriver || payoutAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح للصرف");
      return;
    }

    startTransition(async () => {
      try {
        const res = await recordDriverPayout(companyId, {
          driverName: payoutDriver.driverName,
          amount: payoutAmount,
          tripsSettledCount: payoutDriver.totalTrips,
          paymentMethod: payoutMethod,
          notes: payoutNotes,
        });

        if (res.success) {
          toast.success(
            `تم صرف مبلغ (${payoutAmount.toLocaleString()} ${data.currency}) وترحيله لدفتر الحسابات بنجاح`,
          );
          setData((prev) => ({
            ...prev,
            drivers: prev.drivers.map((d) =>
              d.driverName === payoutDriver.driverName
                ? {
                    ...d,
                    totalPaid: d.totalPaid + payoutAmount,
                    balanceDue: Math.max(0, d.balanceDue - payoutAmount),
                  }
                : d,
            ),
          }));
          setPayoutDriver(null);
        } else {
          toast.error(res.error || "فشل تسجيل الصرف");
        }
      } catch {
        toast.error("حدث خطأ أثناء ترحيل الصرف");
      }
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Truck className="w-6 h-6" />
            </div>
            حسابات وأجور ونشاط السائقين
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            متابعة عدد وصولات ونقلات الصب لكل سائق واحتساب المستحقات المالية وصرف الأجور مباشرة
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab("DRIVERS")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "DRIVERS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            كشف السائقين والأجور ({data.drivers.length})
          </button>
          <button
            onClick={() => setActiveTab("ALL_TICKETS")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "ALL_TICKETS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            سجل كافة الوصولات ({data.allTickets.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">إجمالي السائقين النشطين</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {data.totalDriversCount}
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            سائقين مسجلين بالأسطول
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">إجمالي الوصولات (النقلات)</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {data.totalTripsCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            وصل صب وتوصيل مسجل
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">حجم الخرسانة المنقولة</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-violet-300 font-mono">
            {data.totalDeliveredVolumeM3.toLocaleString()} <span className="text-xs">م³</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            كميات الصب المفرغة بالمواقع
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold">المستحقات المتبقية للصرف</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {data.totalEstimatedPayout.toLocaleString()} <span className="text-xs">{data.currency}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            أجور نقلات غير مسددة
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === "DRIVERS"
              ? "ابحث باسم السائق، رقم الشاحنة..."
              : "ابحث برقم الوصل، السائق، العميل، أو الشاحنة..."
          }
          className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-11 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/[0.02] transition-all font-bold"
        />
        <Search className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* TAB 1: DRIVERS FINANCIAL TABLE */}
      {activeTab === "DRIVERS" && (
        <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    السائق والآلية
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    عدد الوصولات (النقلات)
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    الحجم المنقول (م³)
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    أجر الوصل / النقلة
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    المستحق / الرصيد
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5 text-center">
                    الإجراءات المحاسبية
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                      لا يوجد سائقين مطابقين لخيارات البحث
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.driverName} className="hover:bg-white/[0.02] transition-colors">
                      {/* Driver & Truck */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">
                              {driver.driverName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              شاحنة: {driver.truckNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Trips Count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {driver.totalTrips} وصل
                          </span>
                          {driver.inTransitTrips > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 animate-spin" />
                              {driver.inTransitTrips} بالطريق
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Delivered Volume */}
                      <td className="px-6 py-4 font-mono text-slate-300 font-bold text-sm">
                        {driver.totalVolumeM3.toLocaleString()} م³
                      </td>

                      {/* Rate Per Trip */}
                      <td className="px-6 py-4">
                        {editingRateDriver === driver.driverName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={newRateValue}
                              onChange={(e) => setNewRateValue(parseFloat(e.target.value) || 0)}
                              className="w-24 bg-slate-900 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                            <button
                              onClick={() => handleSaveRate(driver.driverName)}
                              disabled={isPending}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingRateDriver(null)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">
                              {driver.ratePerTrip.toLocaleString()} {data.currency}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRateDriver(driver.driverName);
                                setNewRateValue(driver.ratePerTrip);
                              }}
                              className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
                              title="تعديل أجر الوصل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Balance & Earned */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono font-black text-amber-400 block text-sm">
                            {driver.balanceDue.toLocaleString()} {data.currency}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            إجمالي مستحق: {driver.totalEarned.toLocaleString()} (سُدد: {driver.totalPaid.toLocaleString()})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedDriverForDetails(driver)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            عرض الوصولات ({driver.totalTrips})
                          </button>
                          <button
                            onClick={() => {
                              setPayoutDriver(driver);
                              setPayoutAmount(driver.balanceDue > 0 ? driver.balanceDue : driver.totalEarned);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            صرف المستحقات
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ALL TICKETS / DISPATCH LOG */}
      {activeTab === "ALL_TICKETS" && (
        <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    رقم الوصل / التذكرة
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    السائق والشاحنة
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    العميل والمشروع
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    الكمية (م³)
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    الحالة والتاريخ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                      لا توجد وصولات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-400 block">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          طلب: {ticket.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-white block">
                          {ticket.driverName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ticket.truckNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-200 block">
                          {ticket.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ticket.projectName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">
                        {ticket.quantityM3} م³
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.status === "DELIVERED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : ticket.status === "IN_TRANSIT"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}
                          >
                            {ticket.status === "DELIVERED"
                              ? "تم التسليم بالموقع"
                              : ticket.status === "IN_TRANSIT"
                                ? "بالطريق للموقع"
                                : ticket.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ticket.createdAt).toLocaleDateString("ar-EG")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: DRIVER TICKETS DETAILS */}
      {selectedDriverForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col text-right">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  وصولات ونقلات السائق: {selectedDriverForDetails.driverName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  إجمالي الوصولات: {selectedDriverForDetails.totalTrips} وصل | إجمالي الكمية: {selectedDriverForDetails.totalVolumeM3} م³ | الأجر المقدر: {selectedDriverForDetails.totalEarned.toLocaleString()} {data.currency}
                </p>
              </div>
              <button
                onClick={() => setSelectedDriverForDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedDriverForDetails.recentTickets.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  لا توجد وصولات صب مسجلة لهذا السائق حتى الآن
                </div>
              ) : (
                selectedDriverForDetails.recentTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-400">
                          {t.ticketNumber}
                        </span>
                        <span className="text-slate-500 font-mono">({t.orderNumber})</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        العميل: <span className="text-white font-bold">{t.customerName}</span> | المشروع: {t.projectName}
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-emerald-400 font-black block text-sm">
                        {t.quantityM3} م³
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(t.createdAt).toLocaleString("ar-EG")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedDriverForDetails(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PAYOUT TO DRIVER */}
      {payoutDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                صرف مستحقات السائق ({payoutDriver.driverName})
              </h3>
              <button
                onClick={() => setPayoutDriver(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">إجمالي النقلات المنجزة:</span>
                  <span className="font-mono font-bold text-white">{payoutDriver.totalTrips} وصل</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">أجر النقلة الواحدة:</span>
                  <span className="font-mono font-bold text-white">
                    {payoutDriver.ratePerTrip.toLocaleString()} {data.currency}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span className="text-amber-400 font-bold">الرصيد المستحق غير المصروف:</span>
                  <span className="font-mono font-black text-amber-400">
                    {payoutDriver.balanceDue.toLocaleString()} {data.currency}
                  </span>
                </div>
              </div>

              {/* Payout Amount Field */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">
                  المبلغ المراد صرفه ({data.currency}) *
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("CASH")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === "CASH"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-white/[0.02] border-white/5 text-slate-400"
                    }`}
                  >
                    نقداً (صندوق المحطة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("BANK_TRANSFER")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === "BANK_TRANSFER"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-white/[0.02] border-white/5 text-slate-400"
                    }`}
                  >
                    تحويل بنكي / محفظة
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">ملاحظات الصرف المحاسبية</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="مثال: صرف مستحقات نقلات شهر آب..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayoutDriver(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={isPending || payoutAmount <= 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isPending ? "جاري الترحيل..." : "تأكيد وصرف السند"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
