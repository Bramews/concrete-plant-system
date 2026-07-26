"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { Material } from "@prisma/client";
import { createMaterial, updateMaterial } from "@/app/actions/materials";
import { toast } from "sonner";
import { NumInput } from "@/components/ui/NumInput";

interface MaterialModalProps {
  onClose: () => void;
  onSuccess: (material: Material) => void;
  initialData?: Material;
}

export function MaterialModal({
  onClose,
  onSuccess,
  initialData,
}: MaterialModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code ?? "",
    unit: initialData?.unit ?? "kg",
    initialStock: (initialData as any)?.stock ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("اسم المادة مطلوب");

    setLoading(true);
    const result = initialData
      ? await updateMaterial(initialData.id, formData)
      : await createMaterial(formData);

    if (result.success) {
      toast.success(
        initialData
          ? "تم تحديث بيانات المادة بنجاح"
          : "تمت إضافة المادة الجديدة بنجاح",
      );
      onSuccess(result.data as Material);
    } else {
      toast.error("حدث خطأ أثناء المعالجة", {
        description:
          result.error || "فشل في تنفيذ الإجراء المطلوب، يرجى المحاولة لاحقاً",
      });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Icons.Box className="w-5 h-5 text-indigo-400" />
            {initialData ? "تعديل مادة" : "إضافة مادة جديدة"}
          </h2>
          <button
            onClick={onClose}
            title="إغلاق"
            aria-label="Close"
            className="p-2 hover:bg-slate-800 rounded-xl transition-all"
          >
            <Icons.BarChartX className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="material-name"
              className="text-sm font-bold font-black uppercase text-slate-500 tracking-widest ml-1"
            >
              اسم المادة
            </label>
            <input
              id="material-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="مثال: رمل مغسول، سمنت مقاوم..."
              title="اسم المادة"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="material-code"
              className="text-sm font-bold font-black uppercase text-slate-500 tracking-widest ml-1"
            >
              كود المادة (اختياري)
            </label>
            <input
              id="material-code"
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="MAT-001"
              title="كود المادة"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="material-unit"
                className="text-sm font-bold font-black uppercase text-slate-500 tracking-widest ml-1"
              >
                الوحدة
              </label>
              <select
                id="material-unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none"
                title="الوحدة"
              >
                <option value="kg">kg (كيلوغرام)</option>
                <option value="ton">ton (طن)</option>
                <option value="m3">m³ (متر مكعب)</option>
                <option value="L">L (لتر)</option>
                <option value="pcs">pcs (قطعة)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="material-stock"
                className="text-sm font-bold font-black uppercase text-slate-500 tracking-widest ml-1"
              >
                الرصيد الافتتاحي
              </label>
              <NumInput
                id="material-stock"
                value={formData.initialStock}
                onChange={(val) =>
                  setFormData({ ...formData, initialStock: val })
                }
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-2xl font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Icons.Loader className="animate-spin w-5 h-5" />
              ) : initialData ? (
                "تحديث"
              ) : (
                "إضافة"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
