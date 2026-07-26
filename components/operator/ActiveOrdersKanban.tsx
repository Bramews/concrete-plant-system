"use client";

import React, { useState } from "react";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";

interface KanbanOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  volume: number; // m³
  actualQuantity: number; // m³
  mixGrade: string;
  status: string; // PENDING, LAB_APPROVED, PRODUCTION, COMPLETED
  projectAddress: string;
}

interface KanbanProps {
  orders?: KanbanOrder[];
  onStatusChange?: (orderId: number, newStatus: string) => Promise<boolean>;
}

export default function ActiveOrdersKanban({
  orders = [],
  onStatusChange,
}: KanbanProps) {
  const [localOrders, setLocalOrders] = useState<KanbanOrder[]>(orders);

  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const columns = [
    {
      id: "PENDING",
      label: "بانتظار موافقة المختبر",
      color: "border-slate-800 bg-slate-900/10 text-slate-400",
    },
    {
      id: "LAB_APPROVED",
      label: "جاهز للإنتاج",
      color: "border-cyan-800 bg-cyan-900/10 text-cyan-400",
    },
    {
      id: "PRODUCTION",
      label: "قيد الصب والإنتاج",
      color: "border-amber-800 bg-amber-900/10 text-amber-400",
    },
    {
      id: "COMPLETED",
      label: "مكتمل ومغلق",
      color: "border-emerald-800 bg-emerald-900/10 text-emerald-400",
    },
  ];

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    const loader = toast.loading("جاري تحديث حالة الطلبية...");
    try {
      let success = true;
      if (onStatusChange) {
        success = await onStatusChange(orderId, newStatus);
      }

      if (success) {
        setLocalOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        toast.success("تم تحديث حالة الطلبية بنجاح!", { id: loader });
      } else {
        toast.error("فشل تحديث حالة الطلبية", { id: loader });
      }
    } catch (e) {
      toast.error("حدث خطأ غير متوقع", { id: loader });
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">
          لوحة تدفق الطلبيات (Kanban)
        </h3>
        <p className="text-slate-400 text-sm font-medium mt-1">
          متابعة وتحديث حالة الطلبيات النشطة في خطوط الإنتاج
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colOrders = localOrders.filter((o) => o.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border p-4 min-h-[400px] ${col.color}`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="font-bold text-sm">{col.label}</span>
                <span className="px-2.5 py-0.5 text-xs font-black bg-white/5 border border-white/10 rounded-full">
                  <BidiText>{colOrders.length}</BidiText>
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm font-bold italic">
                    لا توجد طلبيات
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const progress =
                      order.volume > 0
                        ? (order.actualQuantity / order.volume) * 100
                        : 0;
                    return (
                      <div
                        key={order.id}
                        className="p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-white/10 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-cyan-400 font-mono">
                            <BidiText>{order.orderNumber}</BidiText>
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-white/5 text-slate-300 rounded border border-white/10">
                            <BidiText>{order.mixGrade}</BidiText>
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-white text-sm font-bold truncate">
                            {order.customerName}
                          </h4>
                          <p className="text-slate-400 text-xs font-bold truncate">
                            {order.projectAddress}
                          </p>
                        </div>

                        {/* Progress Bar for Production */}
                        {col.id === "PRODUCTION" && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-400">
                                الصب الفعلي:
                              </span>
                              <span className="text-amber-400 font-bold">
                                <BidiText>
                                  {order.actualQuantity} / {order.volume} م³
                                </BidiText>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-amber-500 to-cyan-500 rounded-full"
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Quick action buttons based on status */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          {col.id === "LAB_APPROVED" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, "PRODUCTION")
                              }
                              className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 rounded-lg text-xs font-bold transition-all"
                            >
                              بدء الصب والإنتاج
                            </button>
                          )}
                          {col.id === "PRODUCTION" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, "COMPLETED")
                              }
                              className="w-full py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-bold transition-all"
                            >
                              إكمال الطلبية
                            </button>
                          )}
                          {col.id === "COMPLETED" && (
                            <span className="text-xs text-emerald-500/80 font-bold block text-center w-full">
                              ✓ تم التوصيل بالكامل
                            </span>
                          )}
                          {col.id === "PENDING" && (
                            <span className="text-xs text-slate-500 font-bold block text-center w-full">
                              بانتظار تقرير المختبر
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
