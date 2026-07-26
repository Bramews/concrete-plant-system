"use client";

import { Download } from "lucide-react";
import { ExportUtils } from "@/lib/export-utils";

interface ExportButtonProps {
  data: any[];
  filename: string;
  label: string;
  columns?: Array<{ header: string; key: string }>;
}

/**
 * Universal Export Button
 * Allows any table view to instantly export data to professional Excel files.
 */
export function ExportButton({
  data,
  filename,
  label,
  columns,
}: ExportButtonProps) {
  const handleExport = () => {
    // If columns aren't provided, we infer from first object keys
    const exportColumns =
      columns ||
      (data.length > 0
        ? Object.keys(data[0]).map((key) => ({ header: key, key }))
        : []);

    ExportUtils.toExcel(data, exportColumns, {
      filename: `${filename}_${new Date().toISOString().split("T")[0]}`,
      rtl: true,
    });
  };

  return (
    <button
      onClick={handleExport}
      className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 text-slate-300"
    >
      <Download className="w-3 h-3" />
      {label}
    </button>
  );
}
