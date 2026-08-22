"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processAllPendingPayrolls } from "@/app/actions/finance";
import { toast } from "sonner";
import { Printer, CheckCheck, Loader2 } from "lucide-react";

interface Props {
  companyId: number;
  pendingCount: number;
}

export function PayrollActions({ companyId, pendingCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleProcessAll = async () => {
    if (pendingCount === 0) {
      toast.info("جميع الرواتب لهذا الشهر تم صرفها بالفعل");
      return;
    }

    setLoading(true);
    try {
      const res = await processAllPendingPayrolls(companyId);
      toast.success(`تم صرف رواتب (${res.count}) موظف بنجاح`);
      router.refresh();
    } catch {
      toast.error("فشل تنفيذ صرف الرواتب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 w-full md:w-auto print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2"
      >
        <Printer className="w-4 h-4 text-slate-400" />
        <span>طباعة كشف الرواتب</span>
      </button>

      <button
        type="button"
        disabled={loading || pendingCount === 0}
        onClick={handleProcessAll}
        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 text-white rounded-2xl px-6 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري الصرف...</span>
          </>
        ) : (
          <>
            <CheckCheck className="w-4 h-4" />
            <span>صرف جميع الرواتب</span>
          </>
        )}
      </button>
    </div>
  );
}
