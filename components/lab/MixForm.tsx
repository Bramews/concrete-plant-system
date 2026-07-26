"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMixDesign,
  updateMixDesign,
  approveMixDesign,
  getMaterials,
} from "@/app/actions/lab";
import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  Plus,
  Trash2,
  Beaker,
  Scale,
  Droplets,
  Wind,
  Search,
  Check,
} from "lucide-react";
import { useEffect } from "react";

interface Component {
  materialId?: number;
  materialName: string;
  quantity: number;
  unit: string;
}

export default function MixForm({
  initialData,
  readonly = false,
  canApprove = false,
}: {
  initialData?: any;
  readonly?: boolean;
  canApprove?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    grade: initialData?.grade || initialData?.strengthClass || "",
    details: initialData?.details || "",
    targetWC: initialData?.targetWC || 0,
    targetSlump: initialData?.targetSlump || 0,
    targetAir: initialData?.targetAir || 0,
    targetDensity: initialData?.targetDensity || 0,
  });

  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [components, setComponents] = useState<Component[]>(
    initialData?.components?.map((c: any) => ({
      materialId: c.materialId,
      materialName: c.materialName,
      quantity: c.quantity,
      unit: c.unit,
    })) || [
      { materialName: "الماء", quantity: 175, unit: "لتر" },
      { materialName: "الأسمنت", quantity: 350, unit: "كجم" },
    ],
  );

  // Fetch materials on mount
  useEffect(() => {
    getMaterials().then(setAvailableMaterials);
  }, []);

  // Automated Calculations
  const totalWeight = components.reduce(
    (acc, curr) => acc + Number(curr.quantity || 0),
    0,
  );

  const cementComp = components.find(
    (c) =>
      c.materialName.toLowerCase().includes("cement") ||
      c.materialName.includes("أسمنت"),
  );
  const waterComp = components.find(
    (c) =>
      c.materialName.toLowerCase().includes("water") ||
      c.materialName.includes("ماء"),
  );
  const calculatedWC =
    cementComp && waterComp && cementComp.quantity > 0
      ? (Number(waterComp.quantity) / Number(cementComp.quantity)).toFixed(2)
      : "0.00";

  // Auto-update WC in form state if it's draft
  useEffect(() => {
    if (!readonly && calculatedWC !== "0.00") {
      setFormData((prev) => ({ ...prev, targetWC: Number(calculatedWC) }));
    }
  }, [calculatedWC, readonly]);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "success" | "info";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
    action: async () => {},
  });

  const addComponent = () => {
    setComponents([
      ...components,
      { materialName: "", quantity: 0, unit: "kg" },
    ]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (
    index: number,
    field: keyof Component,
    value: any,
  ) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setComponents(newComponents);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        components: components.map((c) => ({
          ...c,
          quantity: Number(c.quantity),
        })),
        targetWC: Number(formData.targetWC),
        targetSlump: Number(formData.targetSlump),
        targetAir: Number(formData.targetAir),
        targetDensity: Number(formData.targetDensity),
      };

      if (initialData?.id) {
        await updateMixDesign(initialData.id, payload);
      } else {
        await createMixDesign({
          ...payload,
          strengthClass: formData.grade,
        });
      }
      router.push("/system/lab/mix-designs");
      router.refresh();
      toast.success("تم حفظ الخلطة بنجاح");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!initialData?.id) return;

    setConfirmConfig({
      isOpen: true,
      title: "اعتماد الخلطة",
      description: "هل أنت متأكد من اعتماد الخلطة؟ (لا يمكن التعديل بعدها)",
      variant: "warning",
      action: async () => {
        setLoading(true);
        try {
          await approveMixDesign(initialData.id);
          router.push("/system/lab/mix-designs");
          router.refresh();
          toast.success("تم اعتماد الخلطة بنجاح");
        } catch (err: unknown) {
          toast.error((err as Error).message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="max-w-4xl bg-card text-card-foreground p-8 rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Beaker className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white">
              المعلومات الأساسية
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
              اسم الخلطة
            </label>
            <input
              className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-white placeholder:text-slate-700"
              placeholder="مثال: خلطة أعمدة C35"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={readonly || loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                الرمز
              </label>
              <input
                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 font-mono focus:ring-2 focus:ring-primary/50 outline-none transition-all uppercase text-indigo-400 placeholder:text-slate-700"
                placeholder="MX-001"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                disabled={readonly || loading}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                الدرجة
              </label>
              <input
                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-200 placeholder:text-slate-700"
                placeholder="C30"
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                disabled={readonly || loading}
                required
              />
            </div>
          </div>
        </section>

        {/* Technical Targets Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white">
              الأهداف الفنية
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Droplets className="w-3 h-3" /> نسبة الماء للإسمنت (W/C)
              </label>
              <input
                id="targetWC"
                type="number"
                step="0.01"
                className="w-full bg-background/30 border border-white/5 rounded-xl p-2.5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold text-white"
                placeholder="0.45"
                title="نسبة الماء للإسمنت (W/C)"
                value={formData.targetWC}
                onChange={(e) =>
                  setFormData({ ...formData, targetWC: e.target.value })
                }
                disabled={readonly || loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                الهبوط (مم)
              </label>
              <input
                id="targetSlump"
                type="number"
                className="w-full bg-background/30 border border-white/5 rounded-xl p-2.5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold text-white"
                placeholder="150"
                title="الهبوط (مم)"
                value={formData.targetSlump}
                onChange={(e) =>
                  setFormData({ ...formData, targetSlump: e.target.value })
                }
                disabled={readonly || loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Wind className="w-3 h-3" /> الهواء (%)
              </label>
              <input
                id="targetAir"
                type="number"
                step="0.1"
                className="w-full bg-background/30 border border-white/5 rounded-xl p-2.5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold text-white"
                placeholder="1.5"
                title="الهواء (%)"
                value={formData.targetAir}
                onChange={(e) =>
                  setFormData({ ...formData, targetAir: e.target.value })
                }
                disabled={readonly || loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                الكثافة (كجم/م³)
              </label>
              <input
                id="targetDensity"
                type="number"
                className="w-full bg-background/30 border border-white/5 rounded-xl p-2.5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold text-white"
                placeholder="2400"
                title="الكثافة (كجم/م³)"
                value={formData.targetDensity}
                onChange={(e) =>
                  setFormData({ ...formData, targetDensity: e.target.value })
                }
                disabled={readonly || loading}
              />
            </div>
          </div>
        </section>

        {/* Components Table Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <h3 className="font-black text-sm uppercase tracking-widest text-white">
                المكونات والنسب
              </h3>
            </div>
            {!readonly && (
              <button
                type="button"
                onClick={addComponent}
                className="flex items-center gap-1 text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
              >
                <Plus className="w-3 h-3" /> إضافة مادة
              </button>
            )}
          </div>

          <div className="border border-white/5 rounded-2xl overflow-hidden glass-card">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-start font-black uppercase tracking-tighter">
                    المادة
                  </th>
                  <th className="px-4 py-3 text-start font-black uppercase tracking-tighter">
                    الكمية
                  </th>
                  <th className="px-4 py-3 text-start font-black uppercase tracking-tighter">
                    الوحدة
                  </th>
                  {!readonly && <th className="px-4 py-3 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {components.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2">
                      <div className="relative">
                        <select
                          title="اختر المادة"
                          className="w-full bg-transparent border-none outline-none font-bold text-slate-200 appearance-none cursor-pointer"
                          value={comp.materialId || ""}
                          onChange={(e) => {
                            const mat = availableMaterials.find(
                              (m) => m.id === Number(e.target.value),
                            );
                            updateComponent(idx, "materialId", mat?.id);
                            updateComponent(
                              idx,
                              "materialName",
                              mat?.name || e.target.value,
                            );
                            updateComponent(
                              idx,
                              "unit",
                              mat?.unit || comp.unit,
                            );
                          }}
                          disabled={readonly || loading}
                        >
                          <option value="" className="bg-slate-900">
                            اختر مادة...
                          </option>
                          {availableMaterials.map((m) => (
                            <option
                              key={m.id}
                              value={m.id}
                              className="bg-slate-900"
                            >
                              {m.name} ({m.unit})
                            </option>
                          ))}
                          {/* Fallback for cases where material is not in DB but was in initialData */}
                          {!comp.materialId && comp.materialName && (
                            <option value="" disabled className="bg-slate-800">
                              {comp.materialName}
                            </option>
                          )}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`comp-qty-${idx}`}
                        type="number"
                        className="w-full bg-transparent border-none outline-none font-mono font-black text-indigo-400"
                        placeholder="0"
                        title="الكمية"
                        value={comp.quantity}
                        onChange={(e) =>
                          updateComponent(idx, "quantity", e.target.value)
                        }
                        disabled={readonly || loading}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">
                        {comp.unit}
                      </span>
                    </td>
                    {!readonly && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          title="حذف المادة"
                          onClick={() => removeComponent(idx)}
                          className="text-rose-500/50 hover:text-rose-500 transition-colors p-1 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="bg-indigo-500/5 font-black border-t border-indigo-500/20">
                  <td className="px-4 py-3 text-indigo-400 uppercase tracking-widest text-[10px]">
                    إجمالي الوزن
                  </td>
                  <td className="px-4 py-3 text-indigo-300 font-mono text-sm">
                    {totalWeight.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-indigo-400 text-[10px]">كجم</td>
                  {!readonly && <td className="px-4 py-3"></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
            تفاصيل إضافية
          </label>
          <textarea
            className="w-full bg-background/50 border border-white/10 rounded-xl p-3 h-24 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none text-slate-300"
            placeholder="ملاحظات حول النسب أو تعليمات التحضير..."
            value={formData.details}
            onChange={(e) =>
              setFormData({ ...formData, details: e.target.value })
            }
            disabled={readonly || loading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-slate-400 font-bold hover:bg-white/5 rounded-xl transition-colors text-sm"
          >
            إلغاء
          </button>

          {!readonly && (
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-10 py-2.5 rounded-xl font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 text-sm"
            >
              {loading ? "جاري الحفظ..." : "حفظ المسودة"}
            </button>
          )}
        </div>
      </form>

      {/* Approval Section */}
      {initialData && !readonly && canApprove && (
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-emerald-400 text-xl tracking-tight">
                اعتماد رسمي للخلطة
              </h4>
              <p className="text-sm text-emerald-500/60 font-bold mt-1">
                عند الاعتماد، سيتم قفل كافة النسب والمكونات نهائياً ولا يمكن
                التراجع أو التعديل.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
            >
              اعتماد نهائي
            </button>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        isPending={loading}
      />
    </div>
  );
}
