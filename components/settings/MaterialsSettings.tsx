"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";
import { NumInput } from "@/components/ui/NumInput";
import {
  getLabMaterials,
  saveLabMaterial,
  deleteLabMaterial,
} from "@/app/actions/lab-materials";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface Material {
  id?: number;
  name: string;
  code?: string;
  unit: string;
  category?: string;
  specificGravity?: number;
  absorption?: number;
  status: string;
}

export function MaterialsSettings({ lang = "ar" }: { lang?: "ar" | "en" }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [editForm, setEditForm] = useState<Material | null>(null);

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

  const categories = [
    { id: "CEMENTITIOUS", label: "إسمنتي" },
    {
      id: "COARSE_AGGREGATE",
      label: "ركام خشن",
    },
    {
      id: "FINE_AGGREGATE",
      label: "ركام ناعم",
    },
    { id: "WATER", label: "ماء" },
    { id: "ADMIXTURE", label: "إضافة" },
    { id: "OTHER", label: "أخرى" },
  ];

  const fetchMaterials = async () => {
    setLoading(true);
    const res = await getLabMaterials();
    if (res.success && res.materials) {
      setMaterials(res.materials as Material[]);
    } else {
      toast.error(res.error || "فشل في تحميل المواد");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleEdit = (mat: Material) => {
    setEditingId(mat.id!);
    setEditForm({ ...mat });
  };

  const handleNew = () => {
    setEditingId("new");
    setEditForm({
      name: "",
      code: "",
      unit: "kg",
      category: "CEMENTITIOUS",
      specificGravity: 0,
      absorption: 0,
      status: "ACTIVE",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm?.name) {
      toast.error("الاسم مطلوب");
      return;
    }

    // Optimistic Update
    const prevMaterials = [...materials];

    try {
      if (editingId === "new") {
        // Fake ID for optimistic render
        const tempId = Date.now();
        setMaterials([...materials, { ...editForm, id: tempId }]);
      } else {
        setMaterials(
          materials.map((m) => (m.id === editForm.id ? editForm : m)),
        );
      }

      setEditingId(null);
      const res = await saveLabMaterial(editForm);

      if (res.success) {
        toast.success("تم حفظ المادة بنجاح");
        fetchMaterials(); // Refresh from server to get real IDs
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      const err = error as Error;
      setMaterials(prevMaterials); // Rollback
      toast.error(err.message || "فشل في حفظ المادة");
      setEditingId(editingId); // Re-open
    }
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: "حذف المادة",
      description:
        "هل أنت متأكد من حذف هذه المادة؟ هذا الإجراء لا يمكن التراجع عنه.",
      variant: "danger",
      action: async () => {
        const prevMaterials = [...materials];
        setMaterials(materials.filter((m) => m.id !== id));

        const res = await deleteLabMaterial(id);
        if (res.success) {
          toast.success("تم حذف المادة بنجاح");
        } else {
          setMaterials(prevMaterials); // Rollback
          toast.error(res.error || "فشل في حذف المادة");
        }
      },
    });
  };

  return (
    <section className="soft-card p-4 sm:p-8 space-y-8 relative overflow-hidden lg:col-span-2">
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        onConfirm={async () => {
          await confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Icons.Database className="w-32 h-32" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-orange-500/20 text-orange-400">
            <Icons.Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              إدارة المواد المتطورة
            </h2>
            <p className="text-sm text-muted-foreground">
              إضافة و تعديل المواد لخلطات التصميم
            </p>
          </div>
        </div>

        <button
          onClick={handleNew}
          disabled={editingId !== null}
          title="إضافة مادة جديدة"
          aria-label="Add new material"
          className="soft-btn flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4" />
          إضافة مادة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Icons.Loader className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="relative z-10 space-y-6">
          <AnimatePresence>
            {(editingId === "new" || (editingId !== null && editForm)) && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <MaterialFormCard
                  form={editForm!}
                  categories={categories}
                  onChange={setEditForm}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  lang={lang}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-sm font-bold font-black uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-5">المادة / الكود</th>
                  <th className="px-6 py-5 text-center">التصنيف</th>
                  <th className="px-6 py-5 text-center">S.G (الوزن النوعي)</th>
                  <th className="px-6 py-5 text-center">الامتصاص %</th>
                  <th className="px-6 py-5 text-center">الوحدة</th>
                  <th className="px-6 py-5 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-bold">
                {materials.map((mat) => (
                  <tr
                    key={mat.id}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white text-base">{mat.name}</span>
                        {mat.code && (
                          <span className="text-sm font-bold text-slate-500 font-mono">
                            {mat.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold font-black uppercase">
                        {categories.find((c) => c.id === mat.category)?.label ||
                          mat.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-300 font-mono">
                      {mat.specificGravity || "---"}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-300 font-mono">
                      {mat.absorption !== undefined
                        ? `${mat.absorption}%`
                        : "---"}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400 text-sm font-bold">
                      {mat.unit}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(mat)}
                          className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          title="تعديل"
                          aria-label="Edit Material"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id!)}
                          className="p-2.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="حذف"
                          aria-label="Delete Material"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-20 text-center text-muted-foreground italic"
                    >
                      <Icons.Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      لا توجد مواد مضافة بعد...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function MaterialFormCard({
  form,
  categories,
  onChange,
  onSave,
  onCancel,
  lang,
}: {
  form: Material;
  categories: { id: string; label: string }[];
  onChange: (form: Material) => void;
  onSave: () => void;
  onCancel: () => void;
  lang: "ar" | "en";
}) {
  const inputClass =
    "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-slate-600";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-800/80 border border-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] rounded-2xl p-6 relative"
    >
      <div className="space-y-4">
        {/* Name & Code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label
              htmlFor="mat-name"
              className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
              اسم المادة
            </label>
            <input
              id="mat-name"
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="مثال: رمل طبيعي"
              autoFocus
              title="اسم المادة"
            />
          </div>
          <div>
            <label
              htmlFor="mat-code"
              className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
              الرمز
            </label>
            <input
              id="mat-code"
              type="text"
              value={form.code || ""}
              onChange={(e) => onChange({ ...form, code: e.target.value })}
              className={inputClass}
              placeholder="e.g., NS-01"
              title="رمز المادة"
            />
          </div>
          <div>
            <label
              htmlFor="mat-unit"
              className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
              الوحدة
            </label>
            <select
              id="mat-unit"
              value={form.unit}
              onChange={(e) => onChange({ ...form, unit: e.target.value })}
              className={`${inputClass} appearance-none cursor-pointer`}
              title="وحدة القياس"
            >
              <option value="kg">kg</option>
              <option value="liter">liter</option>
              <option value="ton">ton</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="mat-category"
            className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"
          >
            الفئة
          </label>
          <select
            id="mat-category"
            value={form.category || "OTHER"}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className={`${inputClass} appearance-none cursor-pointer`}
            title="فئة المادة"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Physical Properties */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="mat-sg"
              className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
              الوزن النوعي (S.G)
            </label>
            <NumInput
              id="mat-sg"
              value={form.specificGravity || ""}
              onChange={(v) =>
                onChange({ ...form, specificGravity: v ?? undefined })
              }
              className={`${inputClass} font-mono`}
              placeholder="0.00"
              title="الوزن النوعي"
            />
          </div>
          <div>
            <label
              htmlFor="mat-absorption"
              className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
              الامتصاص %
            </label>
            <NumInput
              id="mat-absorption"
              value={form.absorption || ""}
              onChange={(v) =>
                onChange({ ...form, absorption: v ?? undefined })
              }
              className={`${inputClass} font-mono`}
              placeholder="0.0 %"
              title="نسبة الامتصاص"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={onSave}
          title="حفظ المادة"
          aria-label="Save Material"
          className="flex-1 py-2.5 rounded-xl bg-primary text-slate-950 font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform"
        >
          حفظ المادة
        </button>
      </div>
    </motion.div>
  );
}
