"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-2.5 rounded-2xl shadow-lg shadow-blue-600/20 text-xs transition-all flex items-center gap-2 print:hidden"
    >
      <Printer className="w-4 h-4" />
      <span>طباعة التقرير المالي</span>
    </button>
  );
}
