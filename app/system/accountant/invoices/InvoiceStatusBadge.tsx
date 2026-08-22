"use client";

import { useState } from "react";
import { updateInvoiceStatus } from "@/app/actions/finance";
import { toast } from "sonner";
import { getDictionary } from "@/lib/dictionary";
import { ChevronDown, Check, Loader2 } from "lucide-react";

interface Props {
  invoiceId: string;
  initialStatus: string;
  companyId: number;
  lang: "ar" | "en";
}

const STATUS_OPTIONS = [
  { value: "PAID", labelAr: "مدفوعة", labelEn: "Paid", color: "emerald" },
  { value: "PENDING", labelAr: "بانتظار التحصيل", labelEn: "Pending", color: "amber" },
  { value: "DRAFT", labelAr: "مسودة", labelEn: "Draft", color: "slate" },
  { value: "OVERDUE", labelAr: "متأخرة", labelEn: "Overdue", color: "rose" },
  { value: "CANCELLED", labelAr: "ملغاة", labelEn: "Cancelled", color: "red" },
];

export function InvoiceStatusBadge({
  invoiceId,
  initialStatus,
  companyId,
  lang,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const handleSelectStatus = async (newStatus: string) => {
    if (loading || newStatus === status) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(false);

    try {
      await updateInvoiceStatus(companyId, invoiceId, newStatus);
      setStatus(newStatus);
      toast.success(dict.accounting.update_success || "تم تحديث حالة الفاتورة بنجاح");
    } catch {
      toast.error(dict.accounting.update_error || "فشل تحديث الحالة");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (st: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === st) || STATUS_OPTIONS[1];
    return {
      label: isRtl ? opt.labelAr : opt.labelEn,
      color: opt.color,
    };
  };

  const currentConfig = getStatusDisplay(status);

  const colorStyles: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="relative inline-block text-right">
      <button
        type="button"
        disabled={loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all inline-flex items-center gap-1.5 hover:scale-105 active:scale-95 disabled:opacity-50 ${
          colorStyles[currentConfig.color] || colorStyles.slate
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <span>{currentConfig.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1 w-36 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-fade-in">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.value === status;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleSelectStatus(opt.value)}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{isRtl ? opt.labelAr : opt.labelEn}</span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

