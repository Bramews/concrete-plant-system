"use client";

import { Icons } from "@/components/ui/Icons";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { formatDistance } from "date-fns";
import {
  approveAndApplyChange,
  rollbackChange,
} from "@/app/actions/change-management";
import { usePreferences } from "@/context/PreferenceContext";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "@/lib/toast";

export function SovereignVersioning({ requests }: { requests: any[] }) {
  const { t } = usePreferences();

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "success";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "warning",
    action: async () => {},
  });

  const handleApprove = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "تأكيد تنفيذ التغيير",
      description: t.sovereignty.evolution.confirm_apply,
      variant: "success",
      action: async () => {
        await approveAndApplyChange(id);
        toast.success("تم تطبيق التغيير بنجاح");
      },
    });
  };

  const handleRollback = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "تأكيد التراجع",
      description: t.sovereignty.evolution.confirm_rollback,
      variant: "danger",
      action: async () => {
        await rollbackChange(id);
        toast.success("تم التراجع عن التغيير بنجاح");
      },
    });
  };

  const executeAction = async () => {
    try {
      await confirmConfig.action();
    } catch (error) {
      console.error(error);
      toast.error("فشل تنفيذ الإجراء");
    } finally {
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
          <Icons.GitBranch className="w-8 h-8 text-cyan-400" />
          {t.sovereignty.evolution.title}
        </h2>
        <div className="flex gap-2">
          <PremiumBadge variant="secondary">
            {t.sovereignty.evolution.global_ver}: 1.4.2
          </PremiumBadge>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((req: any) => (
          <div key={req.id} className="relative group">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <PremiumCard className="hover:bg-slate-800/50 transition-colors border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      req.status === "APPLIED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : req.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {req.type === "POLICY_UPDATE" ? (
                      <Icons.Settings className="w-5 h-5" />
                    ) : (
                      <Icons.Lock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      {req.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 font-mono">
                      <span>{req.id.substring(0, 8)}</span>
                      <span>•</span>
                      <span>
                        {formatDistance(new Date(req.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <PremiumBadge
                      variant={
                        req.status === "APPLIED"
                          ? "success"
                          : req.status === "PENDING"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {req.status === "APPLIED"
                        ? "تم التطبيق"
                        : req.status === "PENDING"
                          ? "قيد الانتظار"
                          : req.status}
                    </PremiumBadge>
                  </div>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="p-2 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 rounded-lg transition-all"
                      title={t.sovereignty.evolution.request.approve}
                    >
                      <Icons.Shield className="w-4 h-4" />
                    </button>
                  )}
                  {req.status === "APPLIED" && (
                    <button
                      onClick={() => handleRollback(req.id)}
                      className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                      title={t.sovereignty.evolution.request.rollback}
                    >
                      <Icons.History className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </PremiumCard>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
            <Icons.Box className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 italic">
              {t.sovereignty.evolution.no_changes}
            </p>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
      />
    </div>
  );
}
