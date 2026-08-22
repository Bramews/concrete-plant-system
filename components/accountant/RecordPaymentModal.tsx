"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCustomerPayment } from "@/app/actions/finance";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, X, Check, Loader2, CreditCard } from "lucide-react";

interface Props {
  companyId: number;
  customerId: number;
  customerName: string;
  currency: string;
  invoiceId?: string;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export function RecordPaymentModal({
  companyId,
  customerId,
  customerName,
  currency,
  invoiceId,
  defaultAmount,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState("نقداً (كاش)");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("يرجى إدخال مبلغ دفع صحيح");
      return;
    }

    setLoading(true);
    try {
      await recordCustomerPayment(companyId, {
        customerId,
        invoiceId,
        amount: parsedAmount,
        paymentMethod,
        reference,
        notes,
      });

      toast.success("تم تسجيل سند القبض وتحديث رصيد العميل بنجاح");
      setIsOpen(false);
      setAmount("");
      setReference("");
      setNotes("");
      router.refresh();
      if (onSuccess) onSuccess();
    } catch {
      toast.error("فشل تسجيل سند القبض");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 text-white rounded-xl px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5"
      >
        <CreditCard className="w-3.5 h-3.5" />
        <span>تسجيل دفعة / سند قبض</span>
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
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      تسجيل سند قبض مالي
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      العميل: <span className="text-white">{customerName}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="payment-amount"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      المبلغ المحصل ({currency})
                    </label>
                    <input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-base font-mono font-bold text-white outline-none focus:ring-2 ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="payment-method"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      طريقة الدفع
                    </label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-bold text-white outline-none focus:ring-2 ring-emerald-500/20"
                    >
                      <option value="نقداً (كاش)" className="bg-slate-900 text-white">
                        نقداً (كاش)
                      </option>
                      <option value="تحويل بنكي" className="bg-slate-900 text-white">
                        تحويل بنكي
                      </option>
                      <option value="شيك مصرفي" className="bg-slate-900 text-white">
                        شيك مصرفي
                      </option>
                      <option value="سند مقاصة" className="bg-slate-900 text-white">
                        سند مقاصة / دفعة مسبقة
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="payment-ref"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      رقم الشيك / الإيصال / الحوالة
                    </label>
                    <input
                      id="payment-ref"
                      type="text"
                      placeholder="مثال: CHQ-88219 أو رقم الحوالة..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-mono font-bold text-white outline-none focus:ring-2 ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="payment-notes"
                      className="text-xs font-black text-slate-400 uppercase mb-1.5 block"
                    >
                      ملاحظات أو بيان السند
                    </label>
                    <textarea
                      id="payment-notes"
                      placeholder="دفعة عن توريد خرسانة..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-bold text-white outline-none focus:ring-2 ring-emerald-500/20 h-20 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5">
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
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl px-4 py-3 text-xs font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          اعتماد سند القبض
                        </>
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
