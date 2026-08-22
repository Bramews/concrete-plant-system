"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/app/actions/finance";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getDictionary } from "@/lib/dictionary";
import { Plus, X, Loader2 } from "lucide-react";

interface Props {
  companyId: number;
  lang: "ar" | "en";
}

export function AddExpenseButton({ companyId, lang }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dict = getDictionary(lang);

  const [data, setData] = useState({
    category: "MISC",
    amount: "",
    details: "",
    reference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    setLoading(true);
    try {
      await createExpense(companyId, {
        category: data.category,
        amount: parsedAmount,
        details: data.details,
        reference: data.reference,
      });
      toast.success(dict.accounting.expense_saved || "تم تسجيل المصروف بنجاح");
      setIsOpen(false);
      setData({ category: "MISC", amount: "", details: "", reference: "" });
      router.refresh();
    } catch {
      toast.error(dict.accounting.expense_error || "فشل تسجيل المصروف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 rounded-2xl px-6 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 text-white"
      >
        <Plus className="w-4 h-4" />
        <span>{dict.accounting.add_expense || "إضافة مصروف تشغيلي"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white">
                    {dict.accounting.add_expense || "تسجيل مصروف جديد"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets for Rapid Accounting */}
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    قوالب سريعة بنقرة واحدة:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setData({
                          ...data,
                          category: "FUEL",
                          details: "تزويد وقود ديزل للأسطول والخلاطات",
                        })
                      }
                      className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                    >
                      ⛽ وقود ديزل
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setData({
                          ...data,
                          category: "MAINTENANCE",
                          details: "صيانة دورية للمضخات والخلاطات",
                        })
                      }
                      className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                    >
                      🔧 صيانة مضخات
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setData({
                          ...data,
                          category: "RAW_MATERIALS",
                          details: "شراء وتوريد ركام ورمل وإسمنت",
                        })
                      }
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                    >
                      🧱 توريد مواد خام
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setData({
                          ...data,
                          category: "UTILITIES",
                          details: "فواتير كهرباء ومياه المحطة",
                        })
                      }
                      className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                    >
                      ⚡ كهرباء ومياه
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="category-select"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      {dict.accounting.expense_category || "الفئة"}
                    </label>
                    <select
                      id="category-select"
                      value={data.category}
                      onChange={(e) =>
                        setData({ ...data, category: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-bold text-white outline-none focus:ring-2 ring-rose-500/20"
                    >
                      <option value="FUEL" className="bg-slate-900 text-white">
                        {dict.accounting.fuel || "وقود ومحروقات"}
                      </option>
                      <option value="MAINTENANCE" className="bg-slate-900 text-white">
                        {dict.accounting.maintenance || "صيانة وقطع غيار"}
                      </option>
                      <option value="RAW_MATERIALS" className="bg-slate-900 text-white">
                        {dict.accounting.raw_materials || "مواد خام وإمدادات"}
                      </option>
                      <option value="UTILITIES" className="bg-slate-900 text-white">
                        {dict.accounting.utilities || "كهرباء ومياه ومرافق"}
                      </option>
                      <option value="RENT" className="bg-slate-900 text-white">
                        {dict.accounting.rent || "إيجار ومنشآت"}
                      </option>
                      <option value="MISC" className="bg-slate-900 text-white">
                        {dict.accounting.misc || "نثريات ومصروفات عامة"}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="amount-input"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      {dict.accounting.amount || "المبلغ"}
                    </label>
                    <input
                      id="amount-input"
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      placeholder="0.00"
                      value={data.amount}
                      onChange={(e) =>
                        setData({ ...data, amount: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm font-mono font-bold text-white outline-none focus:ring-2 ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="details-input"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      {dict.accounting.expense_details || "التفاصيل"}
                    </label>
                    <textarea
                      id="details-input"
                      placeholder="بيان سبب وتفاصيل المصروف..."
                      value={data.details}
                      onChange={(e) =>
                        setData({ ...data, details: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-bold text-white outline-none focus:ring-2 ring-rose-500/20 h-24 resize-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ref-input"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      {dict.accounting.expense_reference || "المرجع"}
                    </label>
                    <input
                      id="ref-input"
                      placeholder="رقم الفاتورة أو الإيصال (اختياري)..."
                      type="text"
                      value={data.reference}
                      onChange={(e) =>
                        setData({ ...data, reference: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-mono font-bold text-white outline-none focus:ring-2 ring-rose-500/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-300 transition-all"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 rounded-xl px-4 py-3 text-xs font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "حفظ المصروف"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

