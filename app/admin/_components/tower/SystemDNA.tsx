"use client";

import { Icons } from "@/components/ui/Icons";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface Rule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  critical: boolean;
}

export function SystemDNA({ dict }: { dict: any }) {
  const t = dict?.admin?.tower ?? dict?.tower ?? {};
  const [rules, setRules] = useState<Rule[]>([
    {
      id: "strict_auth",
      title: "توثيق الأوامر الصارم",
      description: "يتطلب توقيعاً متعدد الأطراف لأي تغييرات في إعدادات النظام.",
      enabled: true,
      critical: true,
    },
    {
      id: "auto_suspend",
      title: "عتبة التعليق التلقائي",
      description:
        "تعليق الكيانات تلقائياً عند تجاوز 3 إخفاقات حرجة خلال ساعة واحدة.",
      enabled: false,
      critical: true,
    },
    {
      id: "deep_audit",
      title: "سجل تدقيق موسع",
      description:
        "تسجيل كل نقطة اتصال بما في ذلك عمليات القراءة فقط لأغراض التحقيق.",
      enabled: true,
      critical: false,
    },
  ]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRule, setPendingRule] = useState<{
    id: string;
    enabled: boolean;
  } | null>(null);

  const toggleRule = (id: string, currentlyEnabled: boolean) => {
    setPendingRule({ id, enabled: currentlyEnabled });
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (pendingRule) {
      setRules(
        rules.map((r) =>
          r.id === pendingRule.id ? { ...r, enabled: !pendingRule.enabled } : r,
        ),
      );
    }
    setConfirmOpen(false);
    setPendingRule(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest text-right">
            {t.system_dna}
          </h2>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest text-right">
            {t.governance_rules}
          </p>
        </div>
        <Icons.GitBranch className="w-6 h-6 text-slate-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl hover:bg-slate-900/80 transition-all flex flex-col justify-between"
          >
            <div className="mb-6 text-right">
              <div className="flex items-center justify-between mb-4 flex-row-reverse">
                <div
                  className={`w-2 h-2 rounded-full ${rule.enabled ? "bg-primary" : "bg-slate-700"} ${rule.enabled && "animate-pulse"}`}
                />
                {rule.critical && (
                  <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase">
                    {t.critical_policy}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold font-black text-white uppercase tracking-wider mb-2">
                {rule.title}
              </h3>
              <p className="text-sm font-bold text-slate-500 font-bold leading-relaxed">
                {rule.description}
              </p>
            </div>

            <button
              onClick={() => toggleRule(rule.id, rule.enabled)}
              className={`w-full py-2 rounded-lg text-sm font-bold font-black uppercase tracking-widest transition-all ${
                rule.enabled
                  ? "bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 hover:bg-emerald-500/20"
              }`}
            >
              {rule.enabled ? t.disable_policy : t.enable_policy}
            </button>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingRule(null);
        }}
        onConfirm={handleConfirm}
        title="تغيير DNA النظام"
        description="تحذير: تغيير DNA النظام سيغير سلوك جميع العقد. هل تريد المتابعة؟"
        variant="warning"
        confirmText="متابعة"
        cancelText="إلغاء"
      />
    </div>
  );
}
