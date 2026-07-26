"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Check,
  X,
  ChevronRight,
  Search,
  Plus,
  Inbox,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { Icons } from "@/components/ui/Icons";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  updateOrderStatus,
  updateOrderDeliveryDate,
} from "@/app/actions/orders";
import { deleteOrder } from "@/app/actions/order";

interface OrderListClientProps {
  orders: any[];
  userRole: string;
  dict: any;
  lang: string;
  filteredMix?: any;
}

export function OrderListClient({
  orders,
  userRole,
  dict,
  lang,
  filteredMix,
}: OrderListClientProps) {
  const router = useRouter();
  const t = dict.orders;
  const isRtl = lang === "ar";

  const [ordersList, setOrdersList] = useState(orders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // Rejection Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

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

  const isLabRole = [
    "LAB_TECH",
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "LAB_TECHNICIAN",
  ].includes(userRole);

  const canCreate =
    [
      "SALES",
      "DISPATCHER",
      "MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
    ].includes(userRole) && !isLabRole;

  const canApprove = ["MANAGER", "SYSTEM_OWNER", "COMPANY_ADMIN"].includes(
    userRole,
  );

  const canManage = [
    "DISPATCHER",
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
    "SALES_MANAGER",
    "SALES",
  ].includes(userRole);

  // Search Filter logic
  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      const orderIdStr = `#${order.id}`;
      const customerName = order.customer?.name || "";
      const projectName = order.project?.name || "";
      const mixCode = order.mixDesign?.code || "";

      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        orderIdStr.includes(query) ||
        customerName.toLowerCase().includes(query) ||
        projectName.toLowerCase().includes(query) ||
        mixCode.toLowerCase().includes(query)
      );
    });
  }, [ordersList, searchQuery]);

  const handleApprove = async (id: number) => {
    setIsProcessing(true);
    try {
      await updateOrderStatus(id, "APPROVED");
      toast.success(
        isRtl
          ? "تم اعتماد الطلب وتوجيهه إلى المختبر للموافقة النهائية!"
          : "Order approved and sent to Lab for final approval!",
      );
      setOrdersList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "SUBMITTED" } : o)),
      );
    } catch (err: any) {
      toast.error(
        err.message || (isRtl ? "فشلت الموافقة." : "Approval failed."),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (
    id: number,
    newStatus: string,
    reason?: string,
  ) => {
    setConfirmConfig({
      isOpen: true,
      title: isRtl ? "تأكيد تغيير حالة الطلب" : "Confirm Status Change",
      description: isRtl
        ? `هل أنت متأكد من تغيير حالة الطلب؟`
        : `Are you sure you want to change status to ${newStatus}?`,
      action: async () => {
        try {
          setIsProcessing(true);
          await updateOrderStatus(id, newStatus, reason);
          toast.success(
            isRtl ? `تم تحديث حالة الطلب بنجاح` : `Status updated successfully`,
          );
          setOrdersList((prev) =>
            prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
          );
        } catch (e: any) {
          toast.error(
            e.message ||
              (isRtl ? "فشل تحديث حالة الطلب" : "Failed to update status"),
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: isRtl ? "تأكيد حذف الطلب" : "Confirm Delete",
      description: isRtl
        ? "هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this order permanently? This action cannot be undone.",
      action: async () => {
        setIsProcessing(true);
        try {
          const formData = new FormData();
          formData.append("id", id.toString());
          const res = await deleteOrder(formData);
          if (res.success) {
            toast.success(
              isRtl ? "تم حذف الطلب بنجاح" : "Order deleted successfully",
            );
            setOrdersList((prev) => prev.filter((o) => o.id !== id));
          } else {
            toast.error(res.error || "Failed to delete order");
          }
        } catch (err: any) {
          toast.error(err.message || "Delete failed");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleCancelClick = (id: number) => {
    setSelectedOrderId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !rejectReason.trim()) {
      toast.error(
        isRtl
          ? "يرجى كتابة سبب الرفض/الإلغاء"
          : "Please specify rejection reason",
      );
      return;
    }
    setIsProcessing(true);
    try {
      await updateOrderStatus(
        selectedOrderId,
        "CANCELLED",
        rejectReason.trim(),
      );
      toast.success(
        isRtl
          ? "تم رفض وإلغاء الطلبية وتوثيق السبب بنجاح."
          : "Order rejected successfully.",
      );
      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === selectedOrderId
            ? {
                ...o,
                status: "CANCELLED",
                approverName: `Manager | ${rejectReason.trim()}`,
              }
            : o,
        ),
      );
      setShowRejectModal(false);
    } catch (err: any) {
      toast.error(err.message || (isRtl ? "فشل الرفض." : "Rejection failed."));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Icons.Box className="w-5 h-5 text-indigo-500" />
              {t.title}
            </h1>
            <p className="text-slate-400 text-xs font-medium leading-tight">
              {t.subtitle}
            </p>
          </div>

          {canCreate && !isLabRole && (
            <button
              onClick={() => router.push("/system/orders/create")}
              className="flex items-center gap-1.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.new_order}
            </button>
          )}
        </div>

        {filteredMix && (
          <div className="mt-3 p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Icons.FlaskConical className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div>
                <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">
                  {t.filter.by_mix}
                </div>
                <div className="text-sm font-semibold text-slate-300">
                  {filteredMix.name}
                  <span className="mx-2 text-slate-700">|</span>
                  <span className="font-mono text-indigo-400/80">
                    {filteredMix.code}
                  </span>
                </div>
              </div>
            </div>
            {!isLabRole && (
              <button
                onClick={() => router.push("/system/orders")}
                className="text-sm font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors bg-slate-800/50 px-2 py-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
                {t.filter.clear}
              </button>
            )}
          </div>
        )}
      </div>

      {!isLabRole && (
        <div className="flex items-center">
          <div className="relative group w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
            <input
              placeholder={t.search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/40 border border-slate-800/60 focus:border-indigo-500/40 rounded-lg pl-9 pr-4 py-1.5 text-sm font-bold w-full transition-all outline-none text-slate-200"
            />
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-800/30 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400">
                  {t.table.id}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400 text-center">
                  {isRtl ? "تاريخ الطلب" : "Order Date"}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400 text-center">
                  {isRtl ? "تاريخ الصب" : "Delivery Date"}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400">
                  {t.table.project_customer}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400 text-center">
                  {t.table.mix}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400 text-center">
                  {t.table.volume}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400 text-center">
                  {t.table.status}
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-slate-400 text-right">
                  {t.table.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {t.no_orders}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-800/30 transition-all cursor-pointer group"
                    onClick={() =>
                      router.push(`/system/orders/details/${order.id}`)
                    }
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-indigo-400 text-sm">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-sm font-medium text-center">
                      {format(
                        new Date(order.createdAt || new Date()),
                        "dd/MM/yyyy",
                      )}
                    </td>
                    {editingOrderId === order.id ? (
                      <td
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="date"
                          value={
                            new Date(order.date).toISOString().split("T")[0]
                          }
                          onChange={async (e) => {
                            const newDateStr = e.target.value;
                            if (!newDateStr) return;
                            const newDate = new Date(newDateStr);

                            try {
                              setOrdersList((prev) =>
                                prev.map((o) =>
                                  o.id === order.id
                                    ? { ...o, date: newDate }
                                    : o,
                                ),
                              );
                              await updateOrderDeliveryDate(order.id, newDate);
                              toast.success(
                                isRtl
                                  ? "تم تحديث تاريخ التوصيل بنجاح"
                                  : "Delivery date updated successfully",
                              );
                            } catch (err: any) {
                              toast.error(
                                isRtl
                                  ? "فشل التحديث: " + err.message
                                  : "Failed to update: " + err.message,
                              );
                            } finally {
                              setEditingOrderId(null);
                            }
                          }}
                          onBlur={() => setEditingOrderId(null)}
                          className="bg-slate-950 border border-slate-800 text-indigo-400 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500 font-bold font-mono text-center cursor-pointer"
                          autoFocus
                          onClick={(e) => e.currentTarget.showPicker?.()}
                        />
                      </td>
                    ) : (
                      <td
                        className={cn(
                          "px-6 py-4 font-mono text-slate-400 text-sm font-medium text-center transition-all",
                          canManage &&
                            "hover:text-indigo-400 hover:bg-slate-800/40 cursor-pointer border-b border-dashed border-slate-700/50",
                        )}
                        onClick={(e) => {
                          if (canManage) {
                            e.stopPropagation();
                            setEditingOrderId(order.id);
                          }
                        }}
                        title={
                          canManage
                            ? isRtl
                              ? "اضغط للتعديل"
                              : "Click to edit"
                            : undefined
                        }
                      >
                        {format(new Date(order.date), "dd/MM/yyyy")}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-300 group-hover:text-white transition-colors text-sm">
                        {order.project?.name || "مشروع عام"}
                      </div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-tight">
                        {order.customer?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-extrabold text-indigo-400/90 text-sm">
                      <div
                        className="max-w-[140px] truncate mx-auto"
                        title={order.mixDesign?.code || ""}
                      >
                        {order.mixDesign?.code || "---"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-center text-slate-300 text-sm">
                      {order.volume}{" "}
                      <span className="text-xs text-slate-400 ml-0.5">m³</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={order.status} dict={dict} />
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1.5 items-center flex-wrap">
                        {/* Approval buttons for managers */}
                        {(order.status === "PENDING_APPROVAL" ||
                          order.status === "PENDING") &&
                          canApprove && (
                            <>
                              <button
                                onClick={() => handleApprove(order.id)}
                                disabled={isProcessing}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-0.5 shadow-md shadow-emerald-900/10"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>موافقة</span>
                              </button>
                              <button
                                onClick={() => handleCancelClick(order.id)}
                                disabled={isProcessing}
                                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            </>
                          )}

                        {/* Start Production for dispatchers/operators ONLY and ONLY if LAB_APPROVED */}
                        {order.status === "LAB_APPROVED" &&
                          ["DISPATCHER", "OPERATOR"].includes(userRole) && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "PRODUCTION")
                              }
                              disabled={isProcessing}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-md"
                            >
                              <span>بدء الإنتاج</span>
                            </button>
                          )}

                        {/* Dispatch Trucks for dispatchers/managers */}
                        {order.status === "PRODUCTION" &&
                          [
                            "DISPATCHER",
                            "MANAGER",
                            "COMPANY_ADMIN",
                            "SYSTEM_OWNER",
                          ].includes(userRole) && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "DISPATCHED")
                              }
                              disabled={isProcessing}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-md"
                            >
                              <span>إرسال الشاحنات</span>
                            </button>
                          )}

                        {/* Mark Delivered for dispatchers/managers */}
                        {order.status === "DISPATCHED" &&
                          [
                            "DISPATCHER",
                            "MANAGER",
                            "COMPANY_ADMIN",
                            "SYSTEM_OWNER",
                          ].includes(userRole) && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "DELIVERED")
                              }
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-md"
                            >
                              <span>تعيين كمستلم</span>
                            </button>
                          )}

                        {/* Permanent Delete for allowed roles before loading starts */}
                        {![
                          "PRODUCTION",
                          "DISPATCHED",
                          "DELIVERED",
                          "COMPLETED",
                          "IN_PROGRESS",
                        ].includes(order.status) &&
                          [
                            "SALES",
                            "SALES_MANAGER",
                            "MANAGER",
                            "COMPANY_ADMIN",
                            "SYSTEM_OWNER",
                          ].includes(userRole) && (
                            <button
                              onClick={() => handleDelete(order.id)}
                              disabled={isProcessing}
                              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] font-bold p-1.5 rounded-lg transition-all flex items-center justify-center"
                              title={isRtl ? "حذف نهائي" : "Delete Order"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        {/* View Details Chevron link */}
                        <button
                          onClick={() =>
                            router.push(`/system/orders/details/${order.id}`)
                          }
                          className="bg-slate-800/50 hover:bg-indigo-500 w-7 h-7 rounded-md flex items-center justify-center transition-all ml-auto cursor-pointer"
                          title={isRtl ? "عرض التفاصيل" : "View Details"}
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
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

      {/* ── Rejection Reason Dialog Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-right animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-white border-b border-white/5 pb-2">
              {isRtl ? "رفض وإلغاء الطلبية" : "Reject and Cancel Order"}
            </h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  {isRtl ? "سبب الرفض (إجباري)" : "Rejection Reason (Required)"}
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-indigo-500 h-20 placeholder:text-slate-600"
                  placeholder={
                    isRtl
                      ? "مثال: تعارض مواعيد الصب أو عدم جاهزية الخلاطة..."
                      : "e.g., Pour timing conflict..."
                  }
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  {isRtl ? "تراجع" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !rejectReason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRtl ? "تأكيد الرفض" : "Confirm Rejection"}
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

function StatusBadge({ status, dict }: { status: string; dict: any }) {
  const t = dict.orders.status;
  const styles = {
    PENDING: "bg-blue-500/5 text-blue-400 border-blue-500/10",
    PENDING_APPROVAL: "bg-amber-500/5 text-amber-400 border-amber-500/10",
    APPROVED: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
    LAB_APPROVED: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
    PRODUCTION: "bg-amber-500/5 text-amber-400 border-amber-500/10",
    DISPATCHED: "bg-purple-500/5 text-purple-400 border-purple-500/10",
    DELIVERED: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
    CANCELLED: "bg-rose-500/5 text-rose-400 border-rose-500/10",
    CANCELED: "bg-rose-500/5 text-rose-400 border-rose-500/10",
    REJECTED: "bg-rose-500/5 text-rose-400 border-rose-500/10",
  };

  const style =
    styles[status as keyof typeof styles] ||
    "bg-slate-500/5 text-slate-400 border-slate-500/10";

  const label = t[status as keyof typeof t] || status;

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full font-semibold text-xs uppercase tracking-wider border inline-block whitespace-nowrap",
        style,
      )}
    >
      {label}
    </span>
  );
}
