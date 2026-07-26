"use client";

import { useState } from "react";
import { triggerManualBackup } from "@/app/actions/backup";
import { Icons } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "@/lib/toast";

// Utility to format bytes (could be moved to utils)
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

import { BackupRecord } from "@prisma/client";

export function BackupManager({
  backups,
  dict,
}: {
  backups: BackupRecord[];
  dict: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleBackup = () => {
    setConfirmOpen(true);
  };

  const executeBackup = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = await triggerManualBackup();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم بدء النسخ الاحتياطي بنجاح");
        router.refresh();
      }
    } catch (e) {
      toast.error("حدث خطأ أثناء بدء النسخ الاحتياطي");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-lg border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">
            {dict.admin.backup.manual_title}
          </h2>
          <p className="text-sm text-slate-400">
            {dict.admin.backup.manual_desc}
          </p>
        </div>
        <button
          onClick={handleBackup}
          disabled={loading}
          className={`
            bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all
            ${loading ? "opacity-50 cursor-wait" : "hover:scale-105"}
          `}
        >
          {loading ? (
            <Icons.Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Icons.Database className="w-5 h-5" />
          )}
          {loading ? "Backing up..." : dict.admin.backup.trigger_btn}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/20">
        <table className="w-full text-sm text-left rtl:text-right">
          <thead className="text-sm font-bold text-slate-400 uppercase bg-slate-950/50 border-b border-white/5">
            <tr>
              <th className="px-6 py-4">{dict.admin.backup.table.filename}</th>
              <th className="px-6 py-4">{dict.admin.backup.table.size}</th>
              <th className="px-6 py-4">{dict.admin.backup.table.status}</th>
              <th className="px-6 py-4">{dict.admin.backup.table.date}</th>
              <th className="px-6 py-4 text-right">
                {dict.admin.backup.table.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {backups.map((bk) => (
              <tr key={bk.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <Icons.FileText className="w-4 h-4 text-slate-500" />
                    {bk.filename}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono">
                  {formatBytes(bk.sizeBytes)}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-500/10 text-emerald-400 text-sm font-bold px-2 py-1 rounded font-bold">
                    {bk.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(bk.timestamp).toLocaleString("en-US")}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-cyan-400 hover:text-cyan-300 text-sm font-bold transition-colors">
                    {dict.settings.backup.download}
                  </button>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  {dict.admin.backup.table.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeBackup}
        title="نسخ احتياطي يدوي"
        description="بدء النسخ الاحتياطي اليدوي؟ قد يؤثر هذا على أداء النظام مؤقتاً."
        variant="warning"
        confirmText="بدء"
        cancelText="إلغاء"
      />
    </div>
  );
}
