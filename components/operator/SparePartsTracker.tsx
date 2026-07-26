"use client";

import React, { useState } from "react";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import {
  addSparePart,
  adjustSparePartStock,
} from "@/app/actions/operator-cockpit";

interface SparePartItem {
  id: number;
  name: string;
  code: string | null;
  quantity: number;
  reorderPoint: number;
  unit: string;
  price: number;
  supplier: string | null;
  supplierPhone: string | null;
}

interface SparePartsTrackerProps {
  initialParts?: SparePartItem[];
}

export default function SparePartsTracker({
  initialParts = [],
}: SparePartsTrackerProps) {
  const [parts, setParts] = useState<SparePartItem[]>(initialParts);

  React.useEffect(() => {
    setParts(initialParts);
  }, [initialParts]);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loader = toast.loading("جاري إضافة قطعة الغيار...");

    try {
      const res = await addSparePart(formData);
      if (res.success && res.data) {
        toast.success("تم إضافة القطعة بنجاح!", { id: loader });
        setParts((prev) => [...prev, res.data as SparePartItem]);
        setIsAddOpen(false);
      } else {
        toast.error(res.error || "فشل إضافة القطعة", { id: loader });
      }
    } catch (err) {
      toast.error("حدث خطأ ما", { id: loader });
    }
  };

  const handleAdjustStock = async (partId: number, adjustment: number) => {
    const loader = toast.loading("جاري تعديل كمية المخزون...");
    try {
      const res = await adjustSparePartStock(partId, adjustment);
      if (res.success && res.data) {
        toast.success("تم تعديل كمية المخزون بنجاح!", { id: loader });
        setParts((prev) =>
          prev.map((p) => (p.id === partId ? (res.data as SparePartItem) : p)),
        );
      } else {
        toast.error(res.error || "فشل تعديل المخزون", { id: loader });
      }
    } catch (err) {
      toast.error("حدث خطأ ما", { id: loader });
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">مخزون قطع الغيار</h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            تتبع قطع الصيانة الحساسة والتنبيه عند انخفاض الكمية
          </p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary">
          + إضافة قطعة
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>اسم القطعة</th>
              <th>الكود</th>
              <th>الكمية الحالية</th>
              <th>حد الأمان</th>
              <th>السعر التقريبي</th>
              <th>المورد</th>
              <th>حالة التنبيه</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => {
              const isLow = p.quantity <= p.reorderPoint;
              return (
                <tr key={p.id}>
                  <td className="text-slate-300 font-bold">{p.name}</td>
                  <td className="font-mono text-xs text-slate-400">
                    <BidiText>{p.code || "-"}</BidiText>
                  </td>
                  <td>
                    <span className="font-mono text-white font-black">
                      <BidiText>
                        {p.quantity} {p.unit}
                      </BidiText>
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-slate-500 font-bold">
                      <BidiText>
                        {p.reorderPoint} {p.unit}
                      </BidiText>
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-slate-300 font-bold">
                      <BidiText>
                        {p.price
                          ? `${p.price.toLocaleString("en-US")} د.ع`
                          : "-"}
                      </BidiText>
                    </span>
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      <p className="text-white text-xs font-bold">
                        {p.supplier || "-"}
                      </p>
                      {p.supplierPhone && (
                        <p className="text-slate-500 text-[10px] font-mono font-bold">
                          <BidiText>{p.supplierPhone}</BidiText>
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    {isLow ? (
                      <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-900 text-xs font-bold">
                        ⚠️ مخزون منخفض جداً
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-bold">
                        ✓ آمن
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustStock(p.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black transition-all"
                        title="زيادة الكمية بـ 1"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleAdjustStock(p.id, -1)}
                        disabled={p.quantity <= 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black transition-all"
                        title="تنقيص الكمية بـ 1"
                      >
                        -
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD SPARE PART */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">
              إضافة قطعة غيار جديدة
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  اسم القطعة
                </label>
                <input
                  name="name"
                  required
                  placeholder="مثال: رولمان بلي 6310"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    رمز القطعة / الكود
                  </label>
                  <input
                    name="code"
                    placeholder="مثال: BRG-6310"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    السعر التقريبي (IQD)
                  </label>
                  <input
                    name="price"
                    type="number"
                    defaultValue="0"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    الكمية البدئية
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    defaultValue="1"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    حد الأمان (تنبيه)
                  </label>
                  <input
                    name="reorderPoint"
                    type="number"
                    defaultValue="1"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    وحدة القياس
                  </label>
                  <input
                    name="unit"
                    defaultValue="pcs"
                    placeholder="مثال: قطعة، متر، لتر"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    اسم المورد
                  </label>
                  <input
                    name="supplier"
                    placeholder="مثال: صادق لقطع الغيار"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    هاتف المورد
                  </label>
                  <input
                    name="supplierPhone"
                    placeholder="0770XXXXXXX"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 rounded-xl text-sm font-black transition-all"
                >
                  حفظ في المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
