"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import {
  getSieveStandards,
  saveSieveStandard,
  deleteSieveStandard,
} from "@/app/actions/sieve-standards";
import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

const DEFAULT_SIEVES = [
  "75mm",
  "63mm",
  "50mm",
  "37.5mm",
  "25mm",
  "20mm",
  "14mm",
  "12.5mm",
  "10mm",
  "9.5mm",
  "5mm",
  "4.75mm",
  "2.36mm",
  "1.18mm",
  "600µm",
  "300µm",
  "150µm",
  "75µm",
];

export function SieveStandardsManager() {
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "SAND",
    sieves: [] as { size: string; min: number; max: number }[],
  });

  const fetchStandards = async () => {
    setLoading(true);
    const data = await getSieveStandards();
    setStandards(data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStandards();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (std: any) => {
    setEditingId(std.id);
    setFormData({
      name: std.name,
      category: std.category || "SAND",
      sieves: JSON.parse(std.sieves),
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsConfirmOpen(false);
    const id = deleteId;
    setDeleteId(null);
    const res = await deleteSieveStandard(id);
    if (res.success) {
      toast.success("تم الحذف بنجاح");
      fetchStandards();
    } else {
      toast.error(res.error || "فشل الحذف");
    }
  };

  const addSieveRow = () => {
    setFormData({
      ...formData,
      sieves: [...formData.sieves, { size: "10mm", min: 0, max: 100 }],
    });
  };

  const removeSieveRow = (index: number) => {
    setFormData({
      ...formData,
      sieves: formData.sieves.filter((_, i) => i !== index),
    });
  };

  const updateSieveRow = (index: number, field: string, value: any) => {
    const newSieves = [...formData.sieves];
    newSieves[index] = { ...newSieves[index], [field]: value };
    setFormData({ ...formData, sieves: newSieves });
  };

  const handleSave = async () => {
    if (!formData.name) return toast.error("يرجى إدخال اسم المواصفة");
    setLoading(true);
    const res = await saveSieveStandard({
      id: editingId || undefined,
      ...formData,
    });
    setLoading(false);
    if (res.success) {
      toast.success("تم الحفظ بنجاح");
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ name: "", category: "SAND", sieves: [] });
      fetchStandards();
    } else {
      toast.error(res.error || "فشل الحفظ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icons.Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black">مواصفات المناخل الثابتة</h3>
            <p className="text-muted-foreground text-sm font-bold leading-none mt-1">
              إدارة حدود المواصفات للمواد المختلفة (ASTM, BS, etc.)
            </p>
          </div>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", category: "SAND", sieves: [] });
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm transition-all hover:scale-105"
          >
            <Icons.Plus className="w-4 h-4" /> إضافة مواصفة جديدة
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-muted/30 border border-primary/20 rounded-3xl p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="std-name"
                className="text-sm font-bold font-black uppercase text-muted-foreground ml-1"
              >
                اسم المواصفة
              </label>
              <input
                id="std-name"
                type="text"
                placeholder="مثال: ASTM C33 Sand Zone 2"
                className="w-full px-4 py-3 bg-background border rounded-2xl outline-none focus:ring-2 ring-primary/20 font-bold"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                aria-label="اسم المواصفة"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="std-category"
                className="text-sm font-bold font-black uppercase text-muted-foreground ml-1"
              >
                التصنيف
              </label>
              <select
                id="std-category"
                className="w-full px-4 py-3 bg-background border rounded-2xl outline-none focus:ring-2 ring-primary/20 font-bold"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as "SAND" | "GRAVEL" | "COMBINED",
                  })
                }
                aria-label="تصنيف المواصفة"
              >
                <option value="SAND">رمل (Sand)</option>
                <option value="GRAVEL">حصى (Gravel)</option>
                <option value="COMBINED">خليط (Combined)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Icons.Activity className="w-4 h-4 text-primary" /> حدود المناخل
              </h4>
              <button
                onClick={addSieveRow}
                aria-label="إضافة منخل جديد"
                className="text-sm font-bold font-black text-primary hover:underline flex items-center gap-1"
              >
                <Icons.Plus className="w-3 h-3" /> إضافة منخل
              </button>
            </div>

            <div className="border border-border/50 rounded-2xl overflow-hidden bg-background/50">
              <table className="w-full text-sm text-center">
                <thead className="bg-muted/50 border-b border-border/50 text-sm font-bold font-black uppercase">
                  <tr>
                    <th className="px-4 py-3">المنخل</th>
                    <th className="px-4 py-3">الحد الأدنى (Min %)</th>
                    <th className="px-4 py-3">الحد الأقصى (Max %)</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono">
                  {formData.sieves.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-2 py-2">
                        <select
                          aria-label="Sieve Size"
                          className="w-full bg-transparent border-none outline-none text-center font-bold text-primary"
                          value={row.size}
                          onChange={(e) =>
                            updateSieveRow(idx, "size", e.target.value)
                          }
                        >
                          {DEFAULT_SIEVES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          aria-label="Min Passing %"
                          className="w-full bg-transparent border-none outline-none text-center font-bold"
                          value={row.min}
                          onChange={(e) =>
                            updateSieveRow(
                              idx,
                              "min",
                              parseFloat(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          aria-label="Max Passing %"
                          className="w-full bg-transparent border-none outline-none text-center font-bold"
                          value={row.max}
                          onChange={(e) =>
                            updateSieveRow(
                              idx,
                              "max",
                              parseFloat(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeSieveRow(idx)}
                          title="حذف هذا المنخل"
                          aria-label="حذف هذا المنخل"
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.sieves.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-muted-foreground italic text-sm font-bold"
                      >
                        لم يتم إضافة أي مناخل بعد...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {standards.map((std) => (
            <div
              key={std.id}
              className="group bg-card border border-border/60 rounded-3xl p-5 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icons.FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm line-clamp-1">
                      {std.name}
                    </h4>
                    <span className="text-sm font-bold text-muted-foreground uppercase">
                      {std.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(std)}
                    title="تعديل المواصفة"
                    aria-label="Edit Standard"
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(std.id)}
                    title="حذف المواصفة"
                    aria-label="Delete Standard"
                    className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {JSON.parse(std.sieves)
                    .slice(0, 4)
                    .map((s: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-black font-mono"
                      >
                        {s.size}: {s.min}-{s.max}
                      </span>
                    ))}
                  {JSON.parse(std.sieves).length > 4 && (
                    <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-black">
                      +{JSON.parse(std.sieves).length - 4} أكثر
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {standards.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-muted/20 border-2 border-dashed border-muted rounded-3xl">
              <Icons.Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">
                لا يوجد أي مواصفات معرفة بعد...
              </p>
            </div>
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDeleteId(null);
        }}
        onConfirm={confirmDelete}
        title="حذف المواصفة"
        description="هل أنت متأكد من حذف هذه المواصفة؟"
        variant="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
