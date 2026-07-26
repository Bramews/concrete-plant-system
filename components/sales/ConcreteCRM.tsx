"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import {
  User,
  Phone,
  Briefcase,
  Plus,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";
import {
  getDeals,
  saveDeal,
  deleteDeal as removeDeal,
  DealItem,
} from "@/app/actions/sales";

interface Stage {
  readonly id:
    | "LEAD"
    | "CONTACTED"
    | "PROPOSAL"
    | "NEGOTIATING"
    | "WON"
    | "CANCELLED";
  readonly label: string;
  readonly color: string;
}

const STAGES: readonly Stage[] = [
  {
    id: "LEAD",
    label: "عميل محتمل",
    color: "border-slate-800 bg-slate-900/10",
  },
  {
    id: "CONTACTED",
    label: "تم التواصل",
    color: "border-blue-500/20 bg-blue-500/5",
  },
  {
    id: "PROPOSAL",
    label: "عرض السعر",
    color: "border-purple-500/20 bg-purple-500/5",
  },
  {
    id: "NEGOTIATING",
    label: "قيد التفاوض",
    color: "border-amber-500/20 bg-amber-500/5",
  },
  {
    id: "WON",
    label: "كسب الصفقة",
    color: "border-emerald-500/20 bg-emerald-500/5",
  },
  { id: "CANCELLED", label: "ملغى", color: "border-rose-500/20 bg-rose-500/5" },
] as const;

export function ConcreteCRM() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Load deals from persistent storage
  useEffect(() => {
    async function loadDeals() {
      try {
        const loadedDeals = await getDeals();
        setDeals(loadedDeals);
      } catch (err) {
        console.error("Failed to load deals:", err);
        toast.error("حدث خطأ أثناء تحميل الفرص البيعية.");
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newProject || !newValue) {
      toast.error("الرجاء إدخال الحقول المطلوبة");
      return;
    }

    try {
      const val = parseFloat(newValue) || 0;
      const res = await saveDeal({
        customerName: newName,
        projectName: newProject,
        value: val,
        stage: "LEAD",
        phone: newPhone || "غير متوفر",
      });

      if (res.success && res.deal) {
        setDeals((prev) => [...prev, res.deal!]);
        toast.success("تم إضافة الفرصة البيعية بنجاح.");
        setShowAddModal(false);
        setNewName("");
        setNewProject("");
        setNewValue("");
        setNewPhone("");
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ الصفقة.");
    }
  };

  const moveDeal = async (id: number, direction: "next" | "prev") => {
    const targetDeal = deals.find((d) => d.id === id);
    if (!targetDeal) return;

    const currentIdx = STAGES.findIndex((s) => s.id === targetDeal.stage);
    const nextIdx = currentIdx + (direction === "next" ? 1 : -1);
    if (nextIdx < 0 || nextIdx >= STAGES.length) return;

    const newStage = STAGES[nextIdx].id;

    try {
      // Optimistic update
      setDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, stage: newStage } : d)),
      );

      await saveDeal({
        ...targetDeal,
        stage: newStage,
      });

      toast.success(`تم نقل الصفقة إلى مرحلة: ${STAGES[nextIdx].label}`);
    } catch (err) {
      console.error(err);
      toast.error("فشل تحديث مرحلة الصفقة.");
      // Rollback
      const loadedDeals = await getDeals();
      setDeals(loadedDeals);
    }
  };

  const handleDeleteDeal = async (id: number) => {
    try {
      // Optimistic update
      setDeals((prev) => prev.filter((d) => d.id !== id));
      await removeDeal(id);
      toast.success("تم حذف الفرصة البيعية بنجاح.");
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف الصفقة.");
      const loadedDeals = await getDeals();
      setDeals(loadedDeals);
    }
  };

  return (
    <div className="high-density space-y-3" dir="rtl">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-white/5 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            نظام إدارة المبيعات والعملاء (Concrete CRM)
          </h3>
          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
            تتبع الفرص والصفقات البيعية الخاصة بمشاريع الخرسانة الجاهزة ومراحل
            تفاوضها
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة فرصة بيعية
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-600 font-bold text-xs">
          جاري تحميل الفرص البيعية...
        </div>
      ) : (
        /* Kanban Board Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-stretch">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.id);

            return (
              <div
                key={stage.id}
                className={`rounded-2xl border p-2 flex flex-col space-y-2 min-h-[320px] ${stage.color}`}
              >
                <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                  <span className="text-[10px] font-black text-white">
                    {stage.label}
                  </span>
                  <span className="bg-white/5 text-slate-400 px-1.5 py-0.2 rounded text-[9px] font-bold">
                    <BidiText>{stageDeals.length}</BidiText>
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-2 rounded-xl bg-slate-950/80 border border-white/5 space-y-2 hover:border-white/10 transition-all group relative text-right"
                    >
                      <div>
                        <h4 className="font-black text-white text-[11px] truncate leading-tight">
                          {deal.customerName}
                        </h4>
                        <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                          {deal.projectName}
                        </p>
                      </div>

                      <div className="text-[9px] text-slate-400 font-bold font-mono">
                        القيمة:{" "}
                        <span className="text-emerald-400 font-black">
                          <BidiText>{deal.value.toLocaleString()}</BidiText> د.ع
                        </span>
                      </div>

                      {deal.phone && (
                        <p className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-600" />
                          <BidiText>{deal.phone}</BidiText>
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="text-slate-600 hover:text-rose-400 transition-colors"
                          title="حذف الفرصة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="flex gap-0.5" dir="ltr">
                          {STAGES.findIndex((s) => s.id === deal.stage) > 0 && (
                            <button
                              onClick={() => moveDeal(deal.id, "prev")}
                              className="bg-white/5 hover:bg-white/10 text-slate-400 px-1 py-0.2 rounded text-[9px] transition-all"
                              title="المرحلة السابقة"
                            >
                              →
                            </button>
                          )}
                          {STAGES.findIndex((s) => s.id === deal.stage) <
                            STAGES.length - 1 && (
                            <button
                              onClick={() => moveDeal(deal.id, "next")}
                              className="bg-white/5 hover:bg-white/10 text-slate-400 px-1 py-0.2 rounded text-[9px] transition-all"
                              title="المرحلة التالية"
                            >
                              ←
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <h3 className="text-lg font-black text-white">
              إضافة فرصة بيعية جديدة
            </h3>
            <form onSubmit={handleAddDeal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  اسم العميل
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: شركة الرافدين للمقاولات"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  اسم المشروع
                </label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: إنشاء جدران ساندة للموقع"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  القيمة التقديرية (د.ع)
                </label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  هاتف العميل
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: 07701112223"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-black transition-all"
                >
                  إضافة الصفقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
