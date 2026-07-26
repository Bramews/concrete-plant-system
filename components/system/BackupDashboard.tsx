"use client";

import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BackupStats {
  totalCount: number;
  lastBackupAt: Date | null;
  lastStatus: string | null;
  totalSizeBytes: number;
}

export function BackupDashboard({ stats }: { stats: BackupStats }) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "لا يوجد";
    const d = new Date(date);
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  const cards = [
    {
      title: "إجمالي الأرشيف",
      value: `${stats.totalCount} نسخة`,
      subValue: "إجمالي الملفات المخزنة",
      icon: <Icons.Archive className="w-5 h-5" />,
      color: "blue",
    },
    {
      title: "آخر عملية ناجحة",
      value: formatDate(stats.lastBackupAt),
      subValue:
        stats.lastStatus === "COMPLETED"
          ? "الحالة: مكتملة بنجاح"
          : "بانتظار المزامنة",
      icon: <Icons.CheckCircle className="w-5 h-5" />,
      color: "green",
    },
    {
      title: "سعة التخزين المستخدمة",
      value: formatSize(stats.totalSizeBytes),
      subValue: "مساحة القرص المستهلكة",
      icon: <Icons.Database className="w-5 h-5" />,
      color: "purple",
    },
    {
      title: "المزامنة السحابية",
      value: "مفعل (Google Drive)",
      subValue: "التشفير: AES-256 بت",
      icon: <Icons.Globe className="w-5 h-5" />,
      color: "orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-card/40 backdrop-blur-xl border border-border/60 p-6 rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative"
        >
          <div
            className={cn(
              "absolute -right-6 -top-6 w-20 h-20 rounded-full blur-[3rem] opacity-20 group-hover:opacity-40 transition-opacity",
              card.color === "blue"
                ? "bg-blue-500"
                : card.color === "green"
                  ? "bg-green-500"
                  : card.color === "purple"
                    ? "bg-purple-500"
                    : "bg-orange-500",
            )}
          />

          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div
              className={cn(
                "p-3 rounded-2xl transition-all shadow-inner",
                card.color === "blue"
                  ? "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20"
                  : card.color === "green"
                    ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/20"
                    : card.color === "purple"
                      ? "bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20"
                      : "bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20",
              )}
            >
              {card.icon}
            </div>
            <span className="text-sm font-bold font-black text-muted-foreground uppercase tracking-[0.2em]">
              {card.title}
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-xl font-black text-foreground mb-1">
              {card.value}
            </div>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              {card.subValue}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
