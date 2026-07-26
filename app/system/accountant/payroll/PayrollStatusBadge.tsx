"use client";

import { useState } from "react";
import { processPayroll } from "@/app/actions/finance";
import { toast } from "sonner";

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

  const toggleStatus = async () => {
    if (loading || status === "PAID") return;
    setLoading(true);

    try {
      await processPayroll(companyId, payrollId);
      setStatus("PAID");
      toast.success("تم صرف الراتب بنجاح");
    } catch {
      toast.error("فشل تنفيذ العملية");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (status === "PAID") {
      return {
        label: "تم الصرف",
        className:
          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
      };
    }
    return {
      label: "بانتظار الصرف",
      className:
        "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:scale-105 active:scale-95",
    };
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={toggleStatus}
      disabled={loading || status === "PAID"}
      className={`px-3 py-1 rounded-full text-[9px] font-black border transition-all disabled:opacity-50 ${config.className}`}
    >
      {loading ? "..." : config.label}
    </button>
  );
}
