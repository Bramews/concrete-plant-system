"use client";

import { useState } from "react";
import { processPayroll } from "@/app/actions/finance";
import { toast } from "sonner";
import { Check, Clock, Loader2 } from "lucide-react";

interface Props {
  payrollId: number;
  initialStatus: string;
  companyId: number;
  lang: "ar" | "en";
}

export function PayrollStatusBadge({
  payrollId,
  initialStatus,
  companyId,
  lang,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const isRtl = lang === "ar";

  const handleProcess = async () => {
    if (loading || status === "PAID") return;
    setLoading(true);

    try {
      await processPayroll(companyId, payrollId);
      setStatus("PAID");
      toast.success(isRtl ? "تم صرف مستحقات الراتب بنجاح" : "Payroll processed successfully");
    } catch {
      toast.error(isRtl ? "فشل تنفيذ عملية الصرف" : "Failed to process payroll");
    } finally {
      setLoading(false);
    }
  };

  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5">
        <Check className="w-3 h-3 stroke-[3]" />
        <span>{isRtl ? "تم الصرف" : "Paid"}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleProcess}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border bg-amber-500/10 text-amber-400 border-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      title={isRtl ? "اضغط للصرف الفوري" : "Click to process payment"}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <>
          <Clock className="w-3 h-3" />
          <span>{isRtl ? "بانتظار الصرف" : "Pending"}</span>
        </>
      )}
    </button>
  );
}

