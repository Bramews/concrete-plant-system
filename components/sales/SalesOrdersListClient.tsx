"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  User,
  Briefcase,
  FileText,
  Check,
  X,
  Send,
  AlertCircle,
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";
import { BidiText } from "@/components/ui/BidiText";
import { updateOrderStatus } from "@/app/actions/orders";
import { submitOrderToLab, deleteOrder } from "@/app/actions/order";
import { Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { TransitTimerBadge } from "@/components/logistics/TransitTimerBadge";

interface SalesOrdersListClientProps {
  initialOrders: any[];
  userRole: string;
  approvedPrices: Record<string, number>;
  isRtl: boolean;
  dict: any;
}

export default function SalesOrdersListClient({
  initialOrders,
  userRole,
  approvedPrices,
  isRtl,
  dict,
}: SalesOrdersListClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Cancellation Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom confirmation dialog config
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = order.customer?.name || "";
      const projectName = order.project?.name || "";
      const orderNo = order.orderNumber || "";

      const matchesSearch =
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orderNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" &&
          (order.status === "PENDING" ||
            order.status === "DRAFT" ||
            order.status === "PENDING_APPROVAL" ||
            order.status === "SUBMITTED")) ||
        (statusFilter === "APPROVED" &&
          (order.status === "APPROVED" || order.status === "LAB_APPROVED")) ||
        (statusFilter === "DISPATCHED" &&
          (order.status === "DISPATCHED" ||
            order.status === "IN_PROGRESS" ||
            order.status === "DELIVERED")) ||
        (statusFilter === "CANCELLED" &&
          (order.status === "CANCELLED" || order.status === "REJECTED"));

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleApprove = async (id: number) => {
    setIsProcessing(true);
    try {
      await updateOrderStatus(id, "APPROVED");
      toast.success(
        isRtl
          ? "تم اعتماد الطلب وتوجيهه إلى المختبر للموافقة النهائية!"
          : "Order approved and sent to Lab for final approval!",
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "SUBMITTED" } : o)),
      );
    } catch (err: any) {
      toast.error(err.message || "فشلت الموافقة.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelClick = (id: number) => {
    setSelectedOrderId(id);
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !cancelReason.trim()) {
      toast.error(
        isRtl ? "يرجى كتابة سبب الإلغاء" : "Please specify cancellation reason",
      );
      return;
    }
    setIsProcessing(true);
    try {
      await updateOrderStatus(
        selectedOrderId,
        "CANCELLED",
        cancelReason.trim(),
      );
      toast.success(
        isRtl
          ? "تم إلغاء الطلبية وتوثيق السبب بنجاح."
          : "Order cancelled successfully.",
      );

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === selectedOrderId) {
            const userName = "Manager"; // Fallback name
            return {
              ...o,
              status: "CANCELLED",
              approverName: `${userName} | ${cancelReason.trim()}`,
            };
          }
          return o;
        }),
      );

      setShowCancelModal(false);
      setCancelReason("");
      setSelectedOrderId(null);
    } catch (err: any) {
      toast.error(err.message || "فشل الإلغاء.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareWithDriver = (order: any) => {
    const locationString = order.project?.location || "";
    const gpsMatch = locationString.match(
      /GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    );
    const gpsCoords = gpsMatch ? `${gpsMatch[1]}, ${gpsMatch[2]}` : "";

    if (!gpsCoords) {
      toast.error(
        isRtl
          ? "لا توجد إحداثيات GPS مسجلة لهذا المشروع"
          : "No GPS coordinates archived for this project",
      );
      return;
    }

    const grade = order.mixDesign?.strengthClass || "C30";
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gpsCoords)}`;
    const text = isRtl
      ? `طلب خرسانة رقم: ${order.orderNumber}\nالعميل: ${order.customer?.name || "—"}\nالكمية: ${order.volume} م³\nالرتبة: ${grade}\nرابط موقع الصب: ${mapsUrl}`
      : `Order: ${order.orderNumber}\nCustomer: ${order.customer?.name || "—"}\nVolume: ${order.volume} m3\nGrade: ${grade}\nLocation: ${mapsUrl}`;

    navigator.clipboard.writeText(text);
    window.open(mapsUrl, "_blank");
    toast.success(
      isRtl
        ? "تم نسخ تفاصيل الطلبية ورابط الـ GPS! وجارٍ فتح الخريطة..."
        : "Order details & GPS coordinates copied! Opening maps...",
    );
  };

  return (
    <div className="high-density w-full space-y-4">
      {/* ── Filter Toolbar (Extremely Compact) ── */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-stretch justify-between bg-slate-900/40 p-3 rounded-2xl border border-white/5"
        dir="rtl"
      >
        <div className="flex-1 flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={
                isRtl
                  ? "بحث برقم العقد، العميل، أو المشروع..."
                  : "Search contract, customer..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500"
            />
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">
              {isRtl ? "كافة الحالات" : "All Statuses"}
            </option>
            <option value="PENDING">
              {isRtl ? "بانتظار الموافقات" : "Pending"}
            </option>
            <option value="APPROVED">{isRtl ? "المعتمدة" : "Approved"}</option>
            <option value="DISPATCHED">
              {isRtl ? "قيد الشحن / التنفيذ" : "Dispatched"}
            </option>
            <option value="CANCELLED">
              {isRtl ? "الملغاة / المرفوضة" : "Cancelled"}
            </option>
          </select>
        </div>
      </div>

      {/* ── High Density Smart Data Grid ── */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-sm">
        <table className="w-full text-right table-dense" dir="rtl">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="w-24 text-right">رقم العقد</th>
              <th className="text-right">العميل والمشروع</th>
              <th className="text-center w-14">رتبة الخرسانة</th>
              <th className="text-center w-14">الكمية</th>
              <th className="text-left w-32">الحساب الإجمالي المقدر</th>
              <th className="text-center w-28">حالة الطلب</th>
              <th className="text-center w-40">الإجراءات والعمليات الفورية</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-slate-500 font-bold"
                >
                  {isRtl
                    ? "لا توجد نتائج مطابقة لتصفية الطلبات."
                    : "No matching orders found."}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                // Direct Pricing calculation
                const grade = order.mixDesign?.strengthClass || "C30";
                const unitPrice = approvedPrices[grade] || 72000;
                const hasPump =
                  order.project?.name?.includes("[شامل مضخة]") || false;
                const pumpCost = hasPump ? 5000 * order.volume : 0;
                const baseCost = unitPrice * order.volume;
                const totalCost = baseCost + pumpCost;

                // Status configuration
                const status = order.status;
                const isPending =
                  status === "PENDING" ||
                  status === "DRAFT" ||
                  status === "PENDING_APPROVAL";
                const isApproved =
                  status === "APPROVED" || status === "LAB_APPROVED";
                const isDispatched =
                  status === "DISPATCHED" ||
                  status === "IN_PROGRESS" ||
                  status === "DELIVERED" ||
                  status === "COMPLETED";
                const isCancelled =
                  status === "CANCELLED" || status === "REJECTED";

                let statusBadge =
                  "text-amber-400 bg-amber-500/10 border-amber-500/20";
                let statusText = isRtl ? "بانتظار الموافقات" : "Pending";
                let borderIndicator = "border-r-4 border-amber-500";

                if (isApproved) {
                  statusBadge =
                    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  statusText = isRtl ? "معتمد" : "Approved";
                  borderIndicator = "border-r-4 border-emerald-500";
                } else if (isDispatched) {
                  statusBadge =
                    "text-blue-400 bg-blue-500/10 border-blue-500/20";
                  statusText = isRtl ? "قيد الشحن" : "Dispatched";
                  borderIndicator = "border-r-4 border-blue-500";
                } else if (isCancelled) {
                  statusBadge =
                    "text-rose-400 bg-rose-500/10 border-rose-500/20";
                  statusText = isRtl ? "ملغى / مرفوض" : "Cancelled";
                  borderIndicator = "border-r-4 border-rose-500";
                }

                // Parse cancel details
                let cancelledBy = "";
                let cancellationWhy = "";
                if (isCancelled && order.approverName) {
                  const parts = order.approverName.split(" | ");
                  cancelledBy = parts[0] || "";
                  cancellationWhy = parts[1] || "";
                }

                // Check GPS
                const locationString = order.project?.location || "";
                const gpsMatch = locationString.match(
                  /GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
                );
                const hasGps = !!gpsMatch;

                return (
                  <tr
                    key={order.id}
                    className={`border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors ${borderIndicator}`}
                  >
                    {/* Order Number */}
                    <td className="font-mono font-black text-white text-[11px]">
                      <div className="flex flex-col">
                        <span>{order.orderNumber}</span>
                        <span className="text-[9px] text-slate-500 font-normal">
                          {new Date(order.date).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                    </td>

                    {/* Customer & Project */}
                    <td>
                      <div className="flex flex-col max-w-[220px]">
                        <span className="font-extrabold text-white text-xs truncate">
                          {order.customer?.name}
                        </span>
                        <span className="text-indigo-400 font-bold text-[10px] truncate">
                          {order.project?.name || "بلا مشروع"}
                        </span>
                        {/* Red cancellation reason shown inline beneath the row to maximize space */}
                        {isCancelled && cancelledBy && (
                          <span
                            className="text-[10px] text-rose-400 font-medium leading-none mt-1 truncate"
                            title={`بواسطة ${cancelledBy}: ${cancellationWhy}`}
                          >
                            🔴 ملغى بواسطة ({cancelledBy}): {cancellationWhy}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Concrete Grade */}
                    <td className="text-center font-mono font-extrabold text-indigo-300">
                      {grade}
                    </td>

                    {/* Quantity */}
                    <td className="text-center font-mono font-bold text-white">
                      {order.volume}{" "}
                      <span className="text-[9px] text-slate-500">م³</span>
                    </td>

                    {/* Total Price */}
                    <td className="text-left font-mono font-black text-emerald-400">
                      <BidiText>{totalCost.toLocaleString()}</BidiText> د.ع
                    </td>

                    {/* Status Badge */}
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                        {isDispatched && (
                          <TransitTimerBadge
                            dispatchedAt={order.dispatchedAt || order.updatedAt || order.createdAt}
                            status={order.status}
                          />
                        )}
                      </div>
                    </td>

                    {/* Operations */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Share Location to Driver */}
                        {hasGps && (isApproved || isDispatched) && (
                          <button
                            onClick={() => handleShareWithDriver(order)}
                            className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                            title="توجيه وإرسال للسائق"
                          >
                            <Send className="w-3 h-3" />
                            <span>السائق</span>
                          </button>
                        )}

                        {/* Approved controls ONLY for Plant Manager (MANAGER) & System Owner (SYSTEM_OWNER) */}
                        {(status === "PENDING" ||
                          status === "SUBMITTED" ||
                          status === "PENDING_APPROVAL") &&
                          (userRole === "MANAGER" ||
                            userRole === "SYSTEM_OWNER") && (
                            <>
                              <button
                                onClick={() => handleApprove(order.id)}
                                disabled={isProcessing}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-lg transition-all flex items-center gap-0.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>موافقة</span>
                              </button>
                              <button
                                onClick={() => handleCancelClick(order.id)}
                                disabled={isProcessing}
                                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-0.5"
                              >
                                <X className="w-3 h-3" />
                                <span>رفض</span>
                              </button>
                            </>
                          )}

                        {/* Send to Lab (Sales) */}
                        {status === "DRAFT" && (
                          <form
                            action={async (formData) => {
                              try {
                                await submitOrderToLab(formData);
                                toast.success(
                                  isRtl
                                    ? "تم إرسال الطلب لمدير المعمل للموافقة!"
                                    : "Order submitted for Plant Manager approval!",
                                );
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id
                                      ? { ...o, status: "PENDING_APPROVAL" }
                                      : o,
                                  ),
                                );
                              } catch (e) {
                                toast.error("فشل الإرسال.");
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={order.id} />
                            <button
                              type="submit"
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>إرسال للمدير</span>
                            </button>
                          </form>
                        )}

                        {/* Delete Order (Sales / Admin) */}
                        {![
                          "PRODUCTION",
                          "DISPATCHED",
                          "DELIVERED",
                          "COMPLETED",
                          "IN_PROGRESS",
                        ].includes(status) && (
                          <button
                            onClick={() => {
                              setConfirmConfig({
                                isOpen: true,
                                title: isRtl
                                  ? "تأكيد حذف الطلب"
                                  : "Confirm Delete",
                                description: isRtl
                                  ? "هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
                                  : "Are you sure you want to delete this order permanently? This action cannot be undone.",
                                action: async () => {
                                  try {
                                    const formData = new FormData();
                                    formData.append("id", order.id.toString());
                                    const res = await deleteOrder(formData);
                                    if (res.success) {
                                      toast.success(
                                        isRtl
                                          ? "تم حذف الطلب بنجاح"
                                          : "Order deleted successfully",
                                      );
                                      setOrders((prev) =>
                                        prev.filter((o) => o.id !== order.id),
                                      );
                                    } else {
                                      toast.error(
                                        res.error || "Failed to delete order",
                                      );
                                    }
                                  } catch (e) {
                                    toast.error("فشل الحذف.");
                                  }
                                },
                              });
                            }}
                            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                            title="حذف الطلب نهائياً"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        {/* Default details page link */}
                        <Link
                          href={`/system/orders/details/${order.id}`}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                        >
                          تفاصيل
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Cancel Reason Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-right">
            <h3 className="text-xs font-black text-white border-b border-white/5 pb-2">
              رفض وإلغاء الطلبية
            </h3>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold block">
                  سبب الإلغاء/الرفض (إجباري)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-indigo-500 h-20"
                  placeholder="مثال: تعارض مواعيد الصب..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-black transition-all"
                >
                  تأكيد الإلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={async () => {
          await confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        isPending={isProcessing}
      />
    </div>
  );
}
