"use client";
/* eslint-disable react/no-unknown-property */

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { NumInput } from "@/components/ui/NumInput";
import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  getLabMaterials,
  createLabMaterial,
  deleteLabMaterial,
} from "@/app/actions/lab-materials";
import {
  saveSieveStandard,
  deleteSieveStandard,
} from "@/app/actions/sieve-standards";

interface SieveSettingsPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  standards: any[];
  materials: any[];
  onRefresh?: () => void;
}

export default function SieveSettingsPanel({
  isOpen,
  onClose,
  standards,
  materials,
  onRefresh,
}: SieveSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "standards" | "sieves" | "materials"
  >("standards");
  const [editingStandard, setEditingStandard] = useState<any>(null);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={() => onClose?.()}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-[#0b0f1a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 text-white rtl">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Icons.Settings className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                إعدادات فحص المناخل والمواصفات
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                تخصيص كامل للمناخل والمواصفات والمواد
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 mt-6">
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
            {[
              { id: "standards", label: "المواصفات", icon: Icons.Scale },
              { id: "sieves", label: "المناخل", icon: Icons.Grid },
              { id: "materials", label: "المواد", icon: Icons.Box },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-900/10 space-y-8">
          {activeTab === "standards" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  إدارة مواصفات القبول
                </h3>
                <button
                  onClick={() =>
                    setEditingStandard({
                      name: "",
                      category: "SAND",
                      sieves: "[]",
                    })
                  }
                  className="text-sm font-bold font-black bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <Icons.Plus className="w-4 h-4" />
                  إضافة مواصفة جديدة
                </button>
              </div>

              {editingStandard ? (
                <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-6 space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold font-black text-slate-500 uppercase">
                        اسم المواصفة
                      </label>
                      <input
                        value={editingStandard.name}
                        onChange={(e) =>
                          setEditingStandard({
                            ...editingStandard,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                        placeholder="مثلاً: ASTM C33"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold font-black text-slate-500 uppercase">
                        التصنيف
                      </label>
                      <select
                        value={editingStandard.category}
                        onChange={(e) =>
                          setEditingStandard({
                            ...editingStandard,
                            category: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                      >
                        <option value="SAND">رمل</option>
                        <option value="GRAVEL">حصى</option>
                        <option value="COMBINED">مدمج</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold md:text-sm font-black text-slate-400 uppercase">
                      حدود المناخل (%)
                    </label>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {JSON.parse(editingStandard.sieves).map(
                        (s: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex gap-2 items-center bg-black/20 p-2 rounded-xl"
                          >
                            <NumInput
                              value={s.size}
                              placeholder="Size"
                              onChange={(v) => {
                                const ns = JSON.parse(editingStandard.sieves);
                                ns[idx].size = Number(v);
                                setEditingStandard({
                                  ...editingStandard,
                                  sieves: JSON.stringify(ns),
                                });
                              }}
                              className="w-20 bg-transparent border-b border-white/10 text-center font-bold"
                            />
                            <NumInput
                              value={s.min}
                              placeholder="Min"
                              onChange={(v) => {
                                const ns = JSON.parse(editingStandard.sieves);
                                ns[idx].min = Number(v);
                                setEditingStandard({
                                  ...editingStandard,
                                  sieves: JSON.stringify(ns),
                                });
                              }}
                              className="flex-1 bg-transparent border-b border-white/10 text-center"
                            />
                            <NumInput
                              value={s.max}
                              placeholder="Max"
                              onChange={(v) => {
                                const ns = JSON.parse(editingStandard.sieves);
                                ns[idx].max = Number(v);
                                setEditingStandard({
                                  ...editingStandard,
                                  sieves: JSON.stringify(ns),
                                });
                              }}
                              className="flex-1 bg-transparent border-b border-white/10 text-center"
                            />
                            <button
                              onClick={() => {
                                const ns = JSON.parse(editingStandard.sieves);
                                ns.splice(idx, 1);
                                setEditingStandard({
                                  ...editingStandard,
                                  sieves: JSON.stringify(ns),
                                });
                              }}
                              className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg"
                            >
                              <Icons.Trash className="w-4 h-4" />
                            </button>
                          </div>
                        ),
                      )}
                      <button
                        onClick={() => {
                          const ns = JSON.parse(editingStandard.sieves);
                          ns.push({ size: 0, min: 0, max: 100 });
                          setEditingStandard({
                            ...editingStandard,
                            sieves: JSON.stringify(ns),
                          });
                        }}
                        className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm font-black text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400 transition-all"
                      >
                        + إضافة منخل للمواصفة
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!editingStandard.name)
                          return toast.error("الاسم مطلوب");

                        try {
                          const sievesArray =
                            typeof editingStandard.sieves === "string"
                              ? JSON.parse(editingStandard.sieves)
                              : editingStandard.sieves;

                          const formattedSieves = (sievesArray || []).map(
                            (s: any) => ({
                              size: String(s.size),
                              min: Number(s.min),
                              max: Number(s.max),
                            }),
                          );

                          const res = await saveSieveStandard({
                            id: editingStandard.id,
                            name: editingStandard.name,
                            category: editingStandard.category,
                            sieves: formattedSieves,
                          });

                          if (res.success) {
                            toast.success("تم الحفظ بنجاح");
                            setEditingStandard(null);
                            onRefresh?.();
                          } else {
                            toast.error(res.error || "فشل حفظ المواصفة");
                          }
                        } catch (e) {
                          toast.error("فشل في تحليل بيانات المناخل");
                        }
                      }}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                      حفظ المواصفة
                    </button>
                    <button
                      onClick={() => setEditingStandard(null)}
                      className="flex-1 bg-slate-800 text-slate-400 py-3 rounded-xl font-black border border-white/5 hover:bg-slate-700 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {standards.map((std) => (
                    <div
                      key={std.id}
                      className="group bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-indigo-500/30 transition-all"
                    >
                      <div>
                        <h4 className="font-black text-white">{std.name}</h4>
                        <p className="text-sm font-bold md:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">
                          {std.category} | {JSON.parse(std.sieves).length} مناخل
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingStandard(std)}
                          className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-xl"
                        >
                          <Icons.Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmTitle("حذف المواصفة");
                            setConfirmDesc(
                              "هل أنت متأكد من حذف هذه المواصفة نهائياً؟",
                            );
                            setConfirmAction(() => async () => {
                              await deleteSieveStandard(std.id);
                              onRefresh?.();
                            });
                            setConfirmOpen(true);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                        >
                          <Icons.Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sieves" && (
            <div className="space-y-4 py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Icons.Grid className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">
                يمكنك إدارة قائمة المناخل الافتراضية للنظام من هنا مستقبلاً
              </p>
            </div>
          )}

          {activeTab === "materials" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">
                  إدارة أنواع المواد
                </h3>
                <button
                  onClick={() =>
                    setEditingMaterial({ name: "", code: "", unit: "kg" })
                  }
                  className="text-sm font-bold font-black bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <Icons.Plus className="w-4 h-4" />
                  إضافة مادة جديدة
                </button>
              </div>

              {editingMaterial ? (
                <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-6 space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold font-black text-slate-500 uppercase">
                        اسم المادة
                      </label>
                      <input
                        value={editingMaterial.name}
                        onChange={(e) =>
                          setEditingMaterial({
                            ...editingMaterial,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                        placeholder="مثلاً: رمل مغسول"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold font-black text-slate-500 uppercase">
                          كود المادة
                        </label>
                        <input
                          value={editingMaterial.code}
                          onChange={(e) =>
                            setEditingMaterial({
                              ...editingMaterial,
                              code: e.target.value,
                            })
                          }
                          className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                          placeholder="M-01"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold font-black text-slate-500 uppercase">
                          الوحدة
                        </label>
                        <input
                          value={editingMaterial.unit}
                          onChange={(e) =>
                            setEditingMaterial({
                              ...editingMaterial,
                              unit: e.target.value,
                            })
                          }
                          className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                          placeholder="kg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const res = await createLabMaterial(editingMaterial);
                        if (res.success) {
                          toast.success("تم الحفظ بنجاح");
                          setEditingMaterial(null);
                          onRefresh?.();
                        }
                      }}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                      حفظ المادة
                    </button>
                    <button
                      onClick={() => setEditingMaterial(null)}
                      className="flex-1 bg-slate-800 text-slate-400 py-3 rounded-xl font-black border border-white/5 hover:bg-slate-700 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {materials.map((m) => (
                    <div
                      key={m.id}
                      className="group bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-indigo-500/30 transition-all"
                    >
                      <div>
                        <h4 className="font-black text-white">{m.name}</h4>
                        <p className="text-sm font-bold md:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">
                          كود: {m.code || "-"} | الوحدة: {m.unit}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setConfirmTitle("حذف المادة");
                            setConfirmDesc("هل أنت متأكد من حذف هذه المادة؟");
                            setConfirmAction(() => async () => {
                              await deleteLabMaterial(m.id);
                              onRefresh?.();
                            });
                            setConfirmOpen(true);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                        >
                          <Icons.Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 text-center bg-slate-900/40 text-slate-700">
          <p className="text-[9px] font-black uppercase tracking-widest leading-loose">
            بروتوكول إعدادات التحليل المنخلي v1.0
          </p>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (confirmAction) await confirmAction();
          setConfirmOpen(false);
        }}
        title={confirmTitle}
        description={confirmDesc}
        variant="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />

      <style jsx global>{`
        .western-nums {
          font-family: "Inter", sans-serif !important;
          direction: ltr !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
