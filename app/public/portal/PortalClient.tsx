"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  Map,
  Navigation,
  Layers,
  Activity,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  FileText,
} from "lucide-react";

interface PortalClientProps {
  companyId: number;
  guestToken: string;
  allowedOrderId: number | null;
  allowedMixId: number | null;
  showMap: boolean;
  showHistory: boolean;
  companyName: string;
  branding?: any;
  initialOrderInfo?: any;
  notes?: string;
}

export function PortalClient({
  companyId,
  guestToken,
  allowedOrderId,
  allowedMixId,
  showMap,
  showHistory,
  companyName,
  branding,
  initialOrderInfo,
  notes,
}: PortalClientProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Styling options from branding
  const primaryColor = branding?.primaryColor || "#6366f1";
  const secondaryColor = branding?.secondaryColor || "#a855f7";
  const accentColor = branding?.accentColor || "#22d3ee";
  const systemName = branding?.systemName || "كور كونكريت";

  const fetchLatestData = async () => {
    setIsRefreshing(true);
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
          setBatches(data.batches || []);
          setTickets(data.tickets || []);
          setTotalVolume(data.totalVolume || 0);
          setTotalBatches(data.totalBatches || 0);
          setIsOffline(false);
          setLastUpdated(new Date());
        } else {
          setIsOffline(true);
        }
      } else {
        setIsOffline(true);
      }
    } catch (e) {
      console.error("Portal polling error:", e);
      setIsOffline(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLatestData();

    // Poll every 10 seconds
    const interval = setInterval(fetchLatestData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute order details
  const requiredVolume = initialOrderInfo?.volume || 0;
  const progressPercent =
    requiredVolume > 0
      ? Math.min(Math.round((totalVolume / requiredVolume) * 100), 100)
      : 0;
  const remainingVolume = Math.max(requiredVolume - totalVolume, 0);

  // Status mapper in Arabic
  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return "مسودة الطلب";
      case "PENDING":
        return "بانتظار التأكيد";
      case "APPROVED":
        return "مقبول وجاهز للجدولة";
      case "PRODUCTION":
        return "قيد الخلط والإنتاج";
      case "DISPATCHED":
        return "جاري التوصيل للموقع";
      case "IN_TRANSIT":
        return "في الطريق للموقع";
      case "ARRIVED":
        return "وصل للموقع";
      case "POURING":
        return "قيد الصب والتفريغ";
      case "DELIVERED":
      case "COMPLETED":
        return "تم التسليم بنجاح";
      case "REJECTED":
        return "مرفوضة من الموقع";
      default:
        return status || "تحت التجهيز";
    }
  };

  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "DISPATCHED":
      case "IN_TRANSIT":
      case "POURING":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse";
      case "ARRIVED":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 dir-rtl"
      style={{ direction: "rtl" }}
    >
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg text-slate-950"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              {systemName.charAt(0)}
            </div>
            <div>
              <h1 className="text-md font-black tracking-tight">
                {systemName}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold">
                {companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOffline ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                أوفلاين (تحديث مؤقت)
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                  آخر تحديث: {lastUpdated.toLocaleTimeString("ar-EG")}
                </span>
                <button
                  onClick={fetchLatestData}
                  disabled={isRefreshing}
                  className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all"
                  title="تحديث البيانات"
                >
                  <RotateCw
                    className={`w-3.5 h-3.5 text-slate-300 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            )}
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-black">
              بوابة الزبون
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome & Info Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black">
              <Activity className="w-4 h-4" />
              لوحة متابعة صب الخرسانة الذكية
            </div>
            <h2 className="text-xl font-black text-white">
              مرحباً بك، {initialOrderInfo?.customer?.name || "عميلنا الكريم"}{" "}
              👋
            </h2>
            <p className="text-slate-400 text-xs font-bold">
              المشروع:{" "}
              <span className="text-slate-300 font-black">
                {initialOrderInfo?.project?.name || "مشروعكم العام"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t md:border-t-0 md:border-r border-white/5 pt-4 md:pt-0 md:pr-6">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">
                رقم الطلبية
              </div>
              <div className="text-sm font-black text-white">
                {initialOrderInfo?.orderNumber || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold">
                الخلطة الخرسانية
              </div>
              <div className="text-sm font-black text-indigo-400">
                {initialOrderInfo?.mixDesign?.code || "—"}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-[10px] text-slate-400 font-bold">
                حالة التوريد
              </div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mt-1 ${getStatusBadge(initialOrderInfo?.status)}`}
              >
                {getStatusText(initialOrderInfo?.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Quantities & Progress Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                نسبة تقدم صب وتجهيز الطلب
              </h3>
              <span className="text-lg font-black text-indigo-400">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-3">
              <div className="w-full h-4 bg-slate-950 rounded-full border border-white/5 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>تم توريد: {totalVolume.toFixed(1)} م³</span>
                <span>المطلوب: {requiredVolume.toFixed(1)} م³</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">
                  المورد اليوم
                </div>
                <div className="text-md font-black text-emerald-400 mt-1">
                  {totalVolume.toFixed(1)} <span className="text-xs">م³</span>
                </div>
              </div>
              <div className="border-x border-white/5">
                <div className="text-[10px] text-slate-400 font-bold">
                  المتبقي للصب
                </div>
                <div className="text-md font-black text-slate-300 mt-1">
                  {remainingVolume.toFixed(1)}{" "}
                  <span className="text-xs">م³</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold">
                  الشحنات المستلمة
                </div>
                <div className="text-md font-black text-indigo-400 mt-1">
                  {totalBatches} <span className="text-xs">سيارة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar Card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
            <h3 className="text-sm font-black text-slate-300 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              ملاحظات وتفاصيل التوريد
            </h3>

            <div className="flex-1 space-y-4">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <div className="text-[10px] text-indigo-400 font-black mb-1">
                  المواصفات الفنية للصبة:
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>
                    الخلطة: {initialOrderInfo?.mixDesign?.name || "خلطة معتمدة"}
                  </li>
                  <li>
                    المقاومة المستهدفة:{" "}
                    {initialOrderInfo?.mixDesign?.grade || "حسب المخططات"}
                  </li>
                  <li>
                    طريقة الصب:{" "}
                    {initialOrderInfo?.mixDesign?.method || "مضخة خرسانة"}
                  </li>
                </ul>
              </div>

              {notes && (
                <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400 italic">
                  💡 {notes}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Live GPS Tracker Section */}
        {showMap && (
          <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-400 animate-pulse" />
                  تتبع حركة شاحنات الخرسانة مباشر (Live GPS Tracker)
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  تتبع مسار وحالة الخلاطات من محطة الخلط وحتى موقع مشروعكم.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-black text-slate-300">
                  {tickets.length > 0
                    ? `${tickets.length} شاحنة في الطريق`
                    : "لا توجد شاحنات في الطريق حالياً"}
                </span>
              </div>
            </div>

            {/* Simulated Live Vector Map */}
            <div className="relative w-full h-[220px] bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between p-6">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

              {/* Header inside Map */}
              <div className="z-10 flex justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>موقع المصنع</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    الموقع: {initialOrderInfo?.project?.name || "الصب المستهدف"}
                  </span>
                </div>
              </div>

              {/* Map Route Visualizer */}
              <div className="relative w-full flex items-center h-20 my-auto z-10 px-6 sm:px-12">
                {/* Route Path Line */}
                <div className="absolute left-6 right-6 sm:left-12 sm:right-12 h-1.5 bg-slate-800 rounded-full">
                  <div className="h-full bg-gradient-to-l from-indigo-500 to-emerald-500 rounded-full opacity-60 w-full animate-pulse" />
                </div>

                {/* Dotted Moving overlay */}
                <div className="absolute left-6 right-6 sm:left-12 sm:right-12 h-1.5 border-t border-dashed border-white/40 opacity-40 animate-pulse" />

                {/* Dispatched Trucks rendering */}
                {tickets.length > 0 ? (
                  tickets.map((ticket, index) => {
                    // Spread trucks across path for simulation
                    const progress = index === 0 ? 70 : index === 1 ? 35 : 15;
                    return (
                      <div
                        key={ticket.id}
                        className="absolute flex flex-col items-center -translate-y-8 -translate-x-1/2 transition-all duration-1000"
                        style={{
                          left: `calc(12px + ${100 - progress}%)`,
                        }}
                      >
                        {/* Truck label */}
                        <div className="px-2 py-1 bg-indigo-600 border border-indigo-400/30 text-[9px] text-white rounded-lg font-black shadow-lg mb-1 whitespace-nowrap">
                          {ticket.truckNumber} ({getStatusText(ticket.status)})
                        </div>
                        {/* Truck Pin */}
                        <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border border-indigo-400 animate-bounce">
                          <Truck className="w-4 h-4 text-slate-950" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-12 text-center">
                    <p className="text-xs text-slate-500 font-bold">
                      لا توجد خلاطات متحركة في هذا المسار حالياً
                    </p>
                  </div>
                )}
              </div>

              {/* Map Legend & Summary */}
              <div className="z-10 bg-slate-900/90 p-3 rounded-xl border border-white/5 text-xs flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  <span className="text-slate-400">شاحنة متحركة</span>
                  <span className="w-2.5 h-2.5 bg-slate-700 rounded-full ml-2" />
                  <span className="text-slate-400">مسار الصب المعتمد</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  تحديث فوري كل 10 ثوانٍ تلقائياً
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Shipment History Table Section */}
        {showHistory && (
          <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                سجل حركة خروج الشحنات والخلطات
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                تتبع كشوفات تحميل وتوصيل الشحنات والكميات المستلمة بالتفصيل.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-black">
                    <th className="py-3 px-4">رقم الشحنة</th>
                    <th className="py-3 px-4">رقم الخلاطة</th>
                    <th className="py-3 px-4">اسم السائق</th>
                    <th className="py-3 px-4 text-center">الكمية المحملة</th>
                    <th className="py-3 px-4">وقت المغادرة</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {batches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-500 font-bold italic"
                      >
                        لم يتم توريد أي شحنات لهذا الطلب اليوم بعد.
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => {
                      const date = new Date(batch.createdAt);
                      return (
                        <tr
                          key={batch.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4 font-mono font-black text-slate-300">
                            SHP-{batch.id.toString().padStart(5, "0")}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-300">
                            {batch.deliveryTicket?.truckNumber ||
                              "خلاطة المحطة"}
                          </td>
                          <td className="py-4 px-4 text-slate-400">
                            {batch.deliveryTicket?.driverName || "سائق المحطة"}
                          </td>
                          <td className="py-4 px-4 text-center font-black text-slate-200">
                            {batch.quantity.toFixed(1)} م³
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {date.toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${getStatusBadge(batch.deliveryTicket?.status || "COMPLETED")}`}
                            >
                              {getStatusText(
                                batch.deliveryTicket?.status || "COMPLETED",
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/5 py-8 mt-12 bg-slate-900/20 text-center">
        <p className="text-[10px] text-slate-500 font-bold">
          جميع البيانات الموضحة تخضع للرقابة والتحقق من مركز العمليات بمحطة{" "}
          {companyName}.
        </p>
      </footer>
    </div>
  );
}
