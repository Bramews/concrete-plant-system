"use client";

import { useState, useTransition, useEffect } from "react";
import { compareBackup } from "@/app/actions/backup";
import {
  X,
  GitCompareArrows,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { createPortal } from "react-dom";

interface Props {
  backupId: number;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BackupCompare({ backupId, filename, isOpen, onClose }: Props) {
  const [data, setData] = useState<
    { table: string; backup: number; live: number; diff: number }[] | null
  >(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && backupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("");
      setData(null);
      setLoaded(false);
      startTransition(async () => {
        const result = await compareBackup(backupId);
        if (result.success && result.comparison) {
          setData(result.comparison);
          setLoaded(true);
        } else {
          setError(result.error || "فشل المقارنة");
        }
      });
    }
  }, [backupId, isOpen]);

  if (!isOpen) return null;

  const tableNameAr: Record<string, string> = {
    User: "المستخدمون",
    Company: "الشركات",
    Order: "الطلبات",
    MixDesign: "الخلطات",
    CubeTest: "مكعبات الفحص",
    SieveAnalysis: "التحليل المنخلي",
    AuditLog: "سجل المراقبة",
    BackupRecord: "سجلات النسخ",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-slate-900/95 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <GitCompareArrows className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                مقارنة مع القاعدة الحالية
              </h3>
              <p className="text-sm font-bold text-slate-500 font-bold">
                {filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isPending && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm text-slate-400 font-bold">
                جاري المقارنة...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-rose-400 font-bold text-sm">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                <span>الجدول</span>
                <span className="text-center">النسخة</span>
                <span className="text-center">الحالي</span>
                <span className="text-center">الفرق</span>
              </div>

              {data.map((row) => (
                <div
                  key={row.table}
                  className="grid grid-cols-4 gap-4 items-center px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-sm font-bold text-slate-300">
                    {tableNameAr[row.table] || row.table}
                  </span>
                  <span className="text-center text-sm font-black text-slate-400">
                    {row.backup.toLocaleString("ar")}
                  </span>
                  <span className="text-center text-sm font-black text-white">
                    {row.live.toLocaleString("ar")}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {row.diff > 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm font-black text-emerald-400">
                          +{row.diff}
                        </span>
                      </>
                    ) : row.diff < 0 ? (
                      <>
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-sm font-black text-rose-400">
                          {row.diff}
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-sm font-black text-slate-600">
                          0
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
