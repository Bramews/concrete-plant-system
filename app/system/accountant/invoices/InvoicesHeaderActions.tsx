"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { batchGenerateInvoices } from "@/app/actions/finance";
import { toast } from "sonner";
import { Zap, Download, Loader2, FileSpreadsheet, CheckCheck } from "lucide-react";

interface Props {
  companyId: number;
  pendingTicketsCount: number;
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
    order?: {
      customer?: { name: string } | null;
      orderNumber?: string | null;
    } | null;
  }>;
}

export function InvoicesHeaderActions({
  companyId,
  pendingTicketsCount,
  invoices,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAutoGenerate = async () => {
    if (pendingTicketsCount === 0) {
      toast.info("جميع تذاكر التسليم المكتملة تم إصدار فواتير لها بالفعل");
      return;
    }

    setLoading(true);
    try {
      const res = await batchGenerateInvoices(companyId);
      toast.success(`تم إنشاء (${res.count}) فاتورة جديدة آلياً بنجاح`);
      router.refresh();
    } catch {
      toast.error("فشل التوليد الآلي للفواتير");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      toast.info("لا توجد فواتير لتصديرها");
      return;
    }

    const headers = ["Invoice ID", "Customer", "Order #", "Amount", "Currency", "Status", "Date"];
    const rows = invoices.map((inv) => [
      `INV-${inv.id}`,
      `"${inv.order?.customer?.name || "عميل عام"}"`,
      inv.order?.orderNumber || "—",
      inv.amount,
      inv.currency,
      inv.status,
      new Date(inv.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير ملف الفواتير بنجاح");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
      <button
        type="button"
        onClick={handleExportCSV}
        className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-2xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2"
        title="تصدير جدول الفواتير إلى ملف CSV / Excel"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
        <span>تصدير Excel/CSV</span>
      </button>

      <button
        type="button"
        onClick={handleAutoGenerate}
        disabled={loading || pendingTicketsCount === 0}
        className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white rounded-2xl px-5 py-2.5 text-xs font-black transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التوليد...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>توليد الفواتير آلياً</span>
            {pendingTicketsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                {pendingTicketsCount} تذاكر جاهزة
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
