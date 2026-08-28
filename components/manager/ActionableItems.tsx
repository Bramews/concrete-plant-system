"use client";
import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import {
  AttentionItemStrict,
  acknowledgeLabNotification,
} from "@/app/actions/manager";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

interface ActionableItemsProps {
  initialItems: AttentionItemStrict[];
  dict: any;
}

export function ActionableItems({ initialItems, dict }: ActionableItemsProps) {
  const [selectedItem, setSelectedItem] = useState<AttentionItemStrict | null>(
    null,
  );
  const [loadingConfig, setLoadingConfig] = useState<Record<string, boolean>>(
    {},
  );
  const router = useRouter();

  const handleAck = async (refId: string) => {
    setLoadingConfig((prev) => ({ ...prev, [refId]: true }));
    try {
      await acknowledgeLabNotification(refId);
      setSelectedItem(null);
      router.refresh();
      toast.success(dict.ack_success || "تمت المعالجة");
    } catch (error) {
      console.error(error);
      toast.error(dict.ack_fail || "فشل الإجراء");
    } finally {
      setLoadingConfig((prev) => ({ ...prev, [refId]: false }));
    }
  };

  const getSeverity = (s: string) => {
    if (s === "high")
      return {
        dot: "bg-rose-500",
        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        line: "bg-rose-500",
        label: "عالي",
      };
    if (s === "medium")
      return {
        dot: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        line: "bg-amber-500",
        label: "متوسط",
      };
    return {
      dot: "bg-blue-500",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      line: "bg-blue-500",
      label: "منخفض",
    };
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <Icons.Bell className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {dict.title || "التنبيهات الحرجة"}
            </h3>
            <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
              CRITICAL NOTIFICATIONS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-400">
            {initialItems.length} تنبيه
          </span>
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold font-black ${initialItems.length > 0 ? "bg-rose-500 text-white" : "bg-emerald-500/20 text-emerald-400"}`}
          >
            {initialItems.length}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {initialItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Icons.CheckCircle className="w-8 h-8 text-emerald-500/50" />
            </div>
            <p className="text-sm font-black text-emerald-500/50">
              جميع الأنظمة سليمة
            </p>
            <p className="text-sm font-bold text-slate-600 font-bold uppercase tracking-widest mt-1">
              ALL SYSTEMS CLEAR
            </p>
          </div>
        )}

        {initialItems.map((item, idx) => {
          const sev = getSeverity(item.severity);
          return (
            <motion.div
              key={item.refId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              onClick={() => setSelectedItem(item)}
              className="group relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
            >
              {/* Severity line */}
              <div
                className={`absolute right-0 top-3 bottom-3 w-0.5 rounded-full ${sev.line} opacity-60`}
              />

              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${sev.badge}`}
              >
                {item.type === "LAB_REJECTION" ? (
                  <Icons.FlaskConical className="w-4 h-4" />
                ) : (
                  <Icons.Box className="w-4 h-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5 ${sev.badge}`}
                  >
                    {sev.label}
                  </span>
                  <span className="text-sm font-bold text-slate-600 font-mono">
                    {item.refId}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">
                  {item.type === "LAB_REJECTION"
                    ? dict.lab_rejection || "رفض مختبري"
                    : dict.order_check || "مراجعة طلب"}
                </h4>
                <p className="text-sm font-bold text-slate-500 mt-0.5 line-clamp-1 font-medium">
                  {item.details || "لا توجد تفاصيل"}
                </p>
              </div>

              {/* Arrow */}
              <Icons.ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-3 rotate-180" />
            </motion.div>
          );
        })}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-[#0a0d15] border-l border-white/[0.06] z-[70] flex flex-col"
            >
              {/* Panel Header */}
              <div className="p-6 border-b border-white/[0.05] flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest mb-1">
                    {selectedItem.type.replace("_", " ")}
                  </p>
                  <h2 className="text-2xl font-black text-white">
                    {selectedItem.refId}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  title="إغلاق"
                  className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Details */}
                <div>
                  <p className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest mb-3">
                    {dict.details_label || "تفاصيل الحدث"}
                  </p>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-sm text-slate-300 leading-relaxed font-medium">
                    {selectedItem.details}
                  </div>
                </div>

                {/* Timestamp */}
                {selectedItem.timestamp && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <Icons.Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold font-black text-slate-500 uppercase">
                        {dict.timestamp_label || "وقت الحدث"}
                      </p>
                      <p className="text-sm text-white font-bold">
                        {new Date(selectedItem.timestamp).toLocaleString(
                          "ar-IQ",
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <p className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest mb-3">
                    {dict.actions_label || "الإجراءات"}
                  </p>
                  <div className="space-y-3">
                    {selectedItem.type === "LAB_REJECTION" && (
                      <button
                        disabled={loadingConfig[selectedItem.refId]}
                        onClick={() => handleAck(selectedItem.refId)}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black py-3.5 rounded-xl text-sm transition-all flex justify-center items-center gap-2.5 shadow-xl shadow-violet-500/20"
                      >
                        {loadingConfig[selectedItem.refId] ? (
                          <Icons.Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Icons.CheckCircle className="w-4 h-4" />
                            {dict.ack_btn || "معالجة والإغلاق"}
                          </>
                        )}
                      </button>
                    )}
                    <button className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-500 font-bold py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 cursor-not-allowed">
                      <Icons.Info className="w-4 h-4" />
                      {dict.view_only || "وضع المراجعة فقط"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/[0.05]">
                <p className="text-[9px] text-center text-slate-700 font-bold uppercase tracking-widest">
                  Concrete Plant System · Decision Support
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
