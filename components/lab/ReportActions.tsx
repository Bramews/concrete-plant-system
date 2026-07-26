/*
  ReportActions - reusable component for view/print/download actions on lab results.
  It receives optional callbacks for custom view handling. Print uses window.print().
  Download placeholder uses jsPDF for PDF generation (basic) and xlsx for Excel.
*/

"use client";

import { Icons } from "@/components/ui/Icons";
import { useState } from "react";
import { toast } from "@/lib/toast";

interface ReportActionsProps {
  /** Data to be exported – any serializable object */
  data: unknown;
  /** Optional custom view handler */
  onView?: () => void;
}

export function ReportActions({ data, onView }: ReportActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleView = () => {
    if (onView) onView();
    else toast.warning("عرض النتائج غير مُطبق حالياً.");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Lazy‑load jsPDF to keep bundle size low
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.text("تقرير نتائج المختبر", 10, 10);
      doc.text(JSON.stringify(data, null, 2), 10, 20);
      doc.save("report.pdf");
    } catch (e) {
      console.error(e);
      toast.error("فشل إنشاء ملف PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={handleView}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"
        title="عرض النتائج"
      >
        <Icons.Eye className="w-4 h-4 inline-block mr-1" /> عرض
      </button>
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition"
        title="طباعة"
      >
        <Icons.Printer className="w-4 h-4 inline-block mr-1" /> طباعة
      </button>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-50"
        title="تحميل PDF"
      >
        <Icons.Download className="w-4 h-4 inline-block mr-1" /> تحميل
      </button>
    </div>
  );
}
