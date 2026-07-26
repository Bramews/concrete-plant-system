"use client";

import { useState } from "react";
import { submitOrderToLab, deleteOrder } from "@/app/actions/order";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface OrderCabinetProps {
  orders: any[];
  auditLogs: any[];
  lang: "en" | "ar";
  translations: any;
  role: string;
}

export default function OrderCabinet({
  orders,
  auditLogs,
  lang,
  translations: t,
  role,
}: OrderCabinetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSubmit = async (id: number) => {
    const formData = new FormData();
    formData.append("id", id.toString());

    const loadingToast = toast.loading("جاري الإرسال للمختبر...");
    try {
      const result = await submitOrderToLab(formData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
      } else {
        toast.error(result.error, { id: loadingToast });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setConfirmOpen(false);
    const id = deleteId;
    setDeleteId(null);

    const formData = new FormData();
    formData.append("id", id.toString());

    const loadingToast = toast.loading("جاري الحذف...");
    try {
      const result = await deleteOrder(formData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
      } else {
        toast.error(result.error, { id: loadingToast });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ORDERS TABLE */}
      <div className="soft-card flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-semibold text-lg">{"إدارة الطلبيات"}</h3>
        </div>
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="text-muted-foreground/50 border-b border-white/5">
                <th className="p-4 font-normal text-start">{t.order.id}</th>
                <th className="p-4 font-normal text-start">{t.common.date}</th>
                <th className="p-4 font-normal text-start">
                  {t.order.customer}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.order.project}
                </th>
                <th className="p-4 font-normal text-start">{t.order.mix}</th>
                <th className="p-4 font-normal text-start">{t.order.qty}</th>
                <th className="p-4 font-normal text-start">
                  {t.common.status}
                </th>
                <th className="p-4 font-normal text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-slate-200"
                >
                  <td className="p-4 font-mono text-sm font-bold text-primary">
                    {order.orderNumber}
                  </td>
                  <td className="p-4 whitespace-nowrap opacity-70">
                    {new Date(order.date).toLocaleDateString("ar-u-nu-latn")}
                  </td>
                  <td className="p-4 font-medium">
                    {order.customer?.name || "---"}
                  </td>
                  <td className="p-4 opacity-70">
                    {order.project?.name || "---"}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-sm font-bold font-mono">
                      {order.mixDesign?.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{order.volume} m³</td>
                  <td className="p-4">
                    <span
                      className={`soft-badge ${
                        order.status === "READY"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : order.status === "DRAFT"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-end">
                    <div className="flex justify-end gap-2">
                      {order.status === "DRAFT" &&
                        (role === "SALES" ||
                          role === "DEPARTMENT_MANAGER" ||
                          role === "COMPANY_ADMIN") && (
                          <>
                            <button
                              onClick={() => handleSubmit(order.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-bold"
                            >
                              {"إرسال"}
                            </button>

                            <Link href={`/orders/edit/${order.id}`}>
                              <button className="px-3 py-1 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                                {"تعديل"}
                              </button>
                            </Link>

                            <button
                              onClick={() => handleDelete(order.id)}
                              className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-bold"
                            >
                              {"حذف"}
                            </button>
                          </>
                        )}
                      {order.status !== "DRAFT" && (
                        <span className="text-sm font-bold uppercase tracking-widest opacity-30">
                          {"مغلق"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-20 text-center opacity-30">
                    <div className="text-4xl mb-4">📦</div>
                    {t.order.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIVITY LOGS SECTION */}
      <div className="soft-card p-6">
        <h3 className="font-semibold text-lg mb-6">{"سجلات نشاط الطلبات"}</h3>
        <div className="space-y-4 relative">
          <div className="absolute start-2 top-2 bottom-2 w-[1px] bg-gradient-to-b from-primary/50 to-transparent"></div>

          {(auditLogs || []).map((log: any, i: number) => (
            <div
              key={log.id}
              className="flex gap-4 items-start group pl-6 rtl:pr-6 rtl:pl-0"
            >
              <div className="absolute start-[5px] rtl:end-[5px] w-2 h-2 rounded-full bg-slate-900 border border-primary/50 z-10 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(255,0,255,0.3)]"></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {log.action}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground opacity-50">
                    {new Date(log.timestamp).toLocaleString("ar-u-nu-latn")}
                  </span>
                </div>
                <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                  <span className="text-primary/70">
                    {log.user?.name || "النظام"}
                  </span>
                  : {log.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
        onConfirm={executeDelete}
        title="حذف المسودة"
        description="هل أنت متأكد من حذف هذه المسودة؟"
        variant="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
