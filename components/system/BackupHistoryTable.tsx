"use client";

import { Icons } from "@/components/ui/Icons";
import {
  deleteBackup,
  restoreBackup,
  verifyBackupIntegrity,
} from "@/app/actions/backup";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BackupRecord {
  id: number;
  filename: string;
  sizeBytes: number;
  status: string;
  testStatus: string | null;
  timestamp: Date;
}

export function BackupHistoryTable({
  initialBackups,
}: {
  initialBackups: BackupRecord[];
}) {
  const [backups, setBackups] = useState(initialBackups);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    id: number;
    type: "delete" | "restore";
    message: string;
  } | null>(null);

  const executeDelete = async (id: number) => {
    setConfirmDialog(null);
    setDeletingId(id);
    try {
      const res = await deleteBackup(id);
      if (res.success) {
        setBackups(backups.filter((b) => b.id !== id));
        toast.success("تم حذف النسخة بنجاح");
      } else {
        toast.error("فشل حذف النسخة");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const executeRestore = async (id: number) => {
    setConfirmDialog(null);
    setRestoringId(id);
    const promise = restoreBackup(id);
    toast.promise(promise, {
      loading: "جاري استعادة النظام...",
      success: (res: any) => {
        if (res.error) throw new Error(res.error);
        setTimeout(() => window.location.reload(), 2000);
        return "تمت الاستعادة بنجاح! سيتم إعادة تحميل الصفحة...";
      },
      error: (err: any) => {
        setRestoringId(null);
        return `فشل في الاستعادة: ${err.message}`;
      },
    });
  };

  const handleVerify = async (id: number) => {
    const promise = verifyBackupIntegrity(id);
    toast.promise(promise, {
      loading: "جاري فحص سلامة النسخة...",
      success: (res: any) => {
        if (res.error) throw new Error(res.error);
        return res.isValid
          ? "النسخة سليمة 100%"
          : "فشل الفحص: النسخة قد تكون تالفة";
      },
      error: "فشل في الاتصال بمحرك الفحص",
    });
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(2) + " MB";
  };

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Icons.Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">
              سجل النسخ الاحتياطي
            </h3>
            <p className="text-sm font-bold text-muted-foreground font-bold uppercase tracking-widest">
              سجلات النسخ المحفوظة
            </p>
          </div>
        </div>
        <span className="bg-background/80 text-primary px-4 py-1.5 rounded-full text-sm font-bold font-black border border-primary/20 shadow-sm uppercase">
          {backups.length} نسخة
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border/50">
              <th className="p-4 text-sm font-black text-muted-foreground uppercase tracking-widest">
                التاريخ / الوقت
              </th>
              <th className="p-4 text-sm font-black text-muted-foreground uppercase tracking-widest">
                اسم الملف
              </th>
              <th className="p-4 text-sm font-black text-muted-foreground uppercase tracking-widest">
                الحجم
              </th>
              <th className="p-4 text-sm font-black text-muted-foreground uppercase tracking-widest">
                الحالة
              </th>
              <th className="p-4 text-sm font-black text-muted-foreground uppercase tracking-widest text-center">
                التحكم
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {backups.map((backup, idx) => (
                <motion.tr
                  layout
                  key={backup.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-border/30 hover:bg-muted/40 transition-colors group"
                >
                  <td className="p-4">
                    <div className="text-sm font-bold text-foreground">
                      {new Date(backup.timestamp).toLocaleDateString("ar-EG")}
                    </div>
                    <div className="text-sm font-bold text-muted-foreground font-medium">
                      {new Date(backup.timestamp).toLocaleTimeString("ar-EG")}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-mono text-primary font-medium flex items-center gap-2">
                      <Icons.FileText className="w-3 h-3 text-muted-foreground" />
                      {backup.filename}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-bold text-muted-foreground">
                    {formatSize(backup.sizeBytes)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider w-fit",
                          backup.status === "COMPLETED"
                            ? "bg-green-500/10 text-green-600 border border-green-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20",
                        )}
                      >
                        {backup.status === "COMPLETED" ? "ناجحة" : "فاشلة"}
                      </span>
                      {backup.testStatus && (
                        <span
                          className={cn(
                            "text-[8px] font-black px-2 uppercase",
                            backup.testStatus === "PASSED"
                              ? "text-green-500"
                              : "text-red-500",
                          )}
                        >
                          {backup.testStatus === "PASSED"
                            ? "✓ سليمة"
                            : "✗ تالفة"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handleVerify(backup.id)}
                      title="فحص السلامة"
                      className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white transition-all shadow-sm border border-purple-500/10 active:scale-90"
                    >
                      <Icons.ShieldCheck className="w-4 h-4" />
                    </button>

                    <a
                      href={`/api/backup/download/${backup.id}`}
                      title="تحميل مباشر"
                      className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-500/10 active:scale-90 flex items-center justify-center transition-all"
                    >
                      <Icons.Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() =>
                        setConfirmDialog({
                          id: backup.id,
                          type: "restore",
                          message:
                            "تحذير: استعادة النسخة الاحتياطية سيؤدي إلى مسح البيانات الحالية. هل أنت متأكد؟",
                        })
                      }
                      disabled={restoringId === backup.id}
                      title="استعادة البيانات"
                      className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-500/10 active:scale-90 disabled:opacity-50"
                    >
                      {restoringId === backup.id ? (
                        <Icons.Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icons.Play className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setConfirmDialog({
                          id: backup.id,
                          type: "delete",
                          message:
                            "هل أنت متأكد من حذف هذه النسخة الاحتياطية نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
                        })
                      }
                      disabled={deletingId === backup.id}
                      title="حذف نهائي"
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/10 active:scale-90 disabled:opacity-50"
                    >
                      {deletingId === backup.id ? (
                        <Icons.Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icons.Trash className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {backups.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Icons.Archive className="w-12 h-12 opacity-10" />
                    <p className="font-black text-sm uppercase tracking-widest">
                      لا توجد نسخ حالياً
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-sm w-full relative"
            >
              <div className="flex items-center gap-4 mb-4 text-orange-500">
                <Icons.AlertTriangle className="w-8 h-8" />
                <h3 className="text-lg font-black">تأكيد الإجراء</h3>
              </div>
              <p className="text-sm font-bold text-muted-foreground mb-8 leading-loose">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-5 py-2 font-bold text-sm bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() =>
                    confirmDialog.type === "delete"
                      ? executeDelete(confirmDialog.id)
                      : executeRestore(confirmDialog.id)
                  }
                  className={cn(
                    "px-5 py-2 font-black text-sm text-white rounded-xl transition-colors",
                    confirmDialog.type === "delete"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-orange-500 hover:bg-orange-600",
                  )}
                >
                  تأكيد التنفيذ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
