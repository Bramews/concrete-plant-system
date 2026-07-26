"use client";

import { useState, useTransition, useEffect } from "react";
import { inspectBackup } from "@/app/actions/backup";
import { X, Database, Loader2, Table2 } from "lucide-react";
import { createPortal } from "react-dom";

interface Props {
  backupId: number;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BackupInspector({
  backupId,
  filename,
  isOpen,
  onClose,
}: Props) {
  const [data, setData] = useState<{ table: string; count: number }[] | null>(
    null,
  );
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
        const result = await inspectBackup(backupId);
        if (result.success && result.tables) {
          setData(result.tables);
          setLoaded(true);
        } else {
          setError(result.error || "فشل القراءة");
        }
      });
    }
  }, [backupId, isOpen]);

  if (!isOpen) return null;

  const totalRecords =
    data?.reduce((s, t) => s + (t.count > 0 ? t.count : 0), 0) || 0;

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
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Table2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                استعراض محتويات النسخة
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
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400 font-bold">
                جاري قراءة النسخة...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-rose-400 font-bold text-sm">{error}</p>
            </div>
          )}

          {data && (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-slate-400 text-sm font-bold">
                  {data.length} جدول
                </span>
                <span className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-sm font-bold font-black border border-indigo-500/20">
                  {totalRecords.toLocaleString("ar")} سجل
                </span>
              </div>

              <div className="space-y-2">
                {data.map((t) => (
                  <div
                    key={t.table}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-bold text-slate-300">
                        {t.table}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-black ${t.count > 0 ? "text-emerald-400" : "text-slate-600"}`}
                    >
                      {t.count >= 0 ? t.count.toLocaleString("ar") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
