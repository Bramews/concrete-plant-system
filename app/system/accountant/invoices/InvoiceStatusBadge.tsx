"use client";

import { useState } from "react";
import { updateInvoiceStatus } from "@/app/actions/finance";
import { toast } from "sonner";
import { getDictionary } from "@/lib/dictionary";

interface Props {
  invoiceId: string;
  initialStatus: string;
  companyId: number;
  lang: "ar" | "en";
}

export function InvoiceStatusBadge({
  invoiceId,
  initialStatus,
  companyId,
  lang,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const dict = getDictionary(lang);

  const toggleStatus = async () => {
    if (loading) return;
    setLoading(true);

    const newStatus = status === "PAID" ? "PENDING" : "PAID";
    try {
      await updateInvoiceStatus(companyId, invoiceId, newStatus);
      setStatus(newStatus);
      toast.success(dict.accounting.update_success);
    } catch {
      toast.error(dict.accounting.update_error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (status === "PAID") {
      return {
        label: dict.accounting.status_paid,
        className:
          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
      };
    }
    return {
      label: dict.accounting.status_pending,
      className:
        "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    };
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-[9px] font-black border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${config.className}`}
    >
      {loading ? "..." : config.label}
    </button>
  );
}
