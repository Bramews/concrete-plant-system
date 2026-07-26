"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";

interface SystemOwnerControlsProps {
  userRole: string;
  isRtl?: boolean;
}

export function SystemOwnerControls({
  userRole,
  isRtl = true,
}: SystemOwnerControlsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    "shutdown" | "restart" | "clear-cache" | null
  >(null);
  const [isPending, setIsPending] = useState(false);

  // Only render for SYSTEM_OWNER
  if (userRole !== "SYSTEM_OWNER") return null;

  const handleAction = async () => {
    setIsPending(true);
    try {
      const response = await fetch("/api/system/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: currentAction }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isRtl
            ? data.message || "تم تنفيذ الإجراء"
            : data.message || "Action executed",
        );
        setIsConfirmOpen(false);
      } else {
        toast.error(
          data.error || (isRtl ? "فشل تنفيذ الإجراء" : "Action failed"),
        );
      }
    } catch {
      toast.error(isRtl ? "خطأ في الاتصال بالخادم" : "Server connection error");
    } finally {
      setIsPending(false);
    }
  };

  const getDialogConfig = () => {
    switch (currentAction) {
      case "shutdown":
        return {
          title: isRtl ? "إيقاف تشغيل النظام" : "System Shutdown",
          description: isRtl
            ? "سيتم إيقاف خادم النظام بالكامل. ستحتاج لتشغيله يدوياً من السيرفر."
            : "The system server will be stopped completely. Manual restart required.",
          variant: "danger" as const,
        };
      case "restart":
        return {
          title: isRtl ? "إعادة تشغيل النظام" : "System Restart",
          description: isRtl
            ? "سيتم إعادة تشغيل محرك النظام (PM2). قد ينقطع الاتصال لثوانٍ."
            : "The system engine (PM2) will restart. Connection may drop briefly.",
          variant: "warning" as const,
        };
      case "clear-cache":
      default:
        return {
          title: isRtl ? "تنظيف الذاكرة المؤقتة" : "Clear System Cache",
          description: isRtl
            ? "سيتم مسح الملفات المؤقتة وتسريع أداء النظام."
            : "Temporary files will be cleared to optimize performance.",
          variant: "info" as const,
        };
    }
  };

  const config = getDialogConfig();

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/[0.03] border border-white/[0.05] mx-1">
      {/* Shutdown Button */}
      <button
        onClick={() => {
          setCurrentAction("shutdown");
          setIsConfirmOpen(true);
        }}
        title={isRtl ? "إيقاف التشغيل" : "Shutdown"}
        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
      >
        <Icons.LogOut className="w-4 h-4" />
      </button>

      {/* Restart Button */}
      <button
        onClick={() => {
          setCurrentAction("restart");
          setIsConfirmOpen(true);
        }}
        title={isRtl ? "إعادة التشغيل" : "Restart"}
        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all active:scale-90"
      >
        <Icons.RefreshCw className="w-4 h-4" />
      </button>

      {/* Clear Cache Button */}
      <button
        onClick={() => {
          setCurrentAction("clear-cache");
          setIsConfirmOpen(true);
        }}
        title={isRtl ? "تنظيف الكاش" : "Clear Cache"}
        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all active:scale-90"
      >
        <Icons.Trash className="w-4 h-4" />
      </button>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => !isPending && setIsConfirmOpen(false)}
        onConfirm={handleAction}
        title={config.title}
        description={config.description}
        variant={config.variant}
        isPending={isPending}
        confirmText={isRtl ? "نعم، قم بالتنفيذ" : "Yes, Proceed"}
        cancelText={isRtl ? "إلغاء" : "Cancel"}
      />
    </div>
  );
}
