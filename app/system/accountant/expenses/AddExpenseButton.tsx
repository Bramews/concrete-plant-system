"use client";

import { useState } from "react";
import { createExpense } from "@/app/actions/finance";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  companyId: number;
  lang: "ar" | "en";
}

export function AddExpenseButton({ companyId, lang }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    category: "MISC",
    amount: "",
    details: "",
    reference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.amount) return;

    setLoading(true);
    try {
      await createExpense(companyId, {
        category: data.category,
        amount: Number(data.amount),
        details: data.details,
        reference: data.reference,
      });
      toast.success("تم تسجيل المصروف بنجاح");
      setIsOpen(false);
      setData({ category: "MISC", amount: "", details: "", reference: "" });
      // Revalidate path is usually better but for now toast and close
      window.location.reload();
    } catch {
      toast.error("فشل التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 rounded-xl px-6 py-2.5 text-sm font-black transition-all flex items-center justify-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        {"إضافة مصاريف"}
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
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-white mb-6">
                  {"تسجيل مصروف جديد"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="category-select"
                      className="text-sm font-bold font-black text-slate-500 uppercase mb-1 block"
                    >
                      {"الفئة"}
                    </label>
                    <select
                      id="category-select"
                      title={"اختر الفئة"}
                      value={data.category}
                      onChange={(e) =>
                        setData({ ...data, category: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-rose-500/20"
                    >
                      <option value="FUEL">{"وقود"}</option>
                      <option value="MAINTENANCE">{"صيانة"}</option>
                      <option value="MISC">{"نثريات"}</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="amount-input"
                      className="text-sm font-bold font-black text-slate-500 uppercase mb-1 block"
                    >
                      {"المبلغ"}
                    </label>
                    <input
                      id="amount-input"
                      title={"المبلغ"}
                      type="number"
                      required
                      value={data.amount}
                      onChange={(e) =>
                        setData({ ...data, amount: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="details-input"
                      className="text-sm font-bold font-black text-slate-500 uppercase mb-1 block"
                    >
                      {"التفاصيل"}
                    </label>
                    <textarea
                      id="details-input"
                      title={"التفاصيل"}
                      placeholder={"أدخل التفاصيل هنا..."}
                      value={data.details}
                      onChange={(e) =>
                        setData({ ...data, details: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-rose-500/20 h-24"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ref-input"
                      className="text-sm font-bold font-black text-slate-500 uppercase mb-1 block"
                    >
                      {"المرجع"}
                    </label>
                    <input
                      id="ref-input"
                      title={"المرجع"}
                      placeholder={"رقم الفاتورة أو المرجع..."}
                      type="text"
                      value={data.reference}
                      onChange={(e) =>
                        setData({ ...data, reference: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-rose-500/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                    >
                      {"إلغاء"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 rounded-xl px-4 py-3 text-sm font-black transition-all disabled:opacity-50"
                    >
                      {loading ? "..." : "حفظ"}
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
