"use client";

import { Icons } from "@/components/ui/Icons";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { usePreferences } from "@/context/PreferenceContext";

export function SovereignConstitution() {
  const { t } = usePreferences();

  const laws = [
    {
      id: 1,
      name: t.sovereignty.constitution.laws.audit.name,
      rule: t.sovereignty.constitution.rules.audit,
      status: "ACTIVE",
      severity: "CONSTITUTIONAL",
      description: t.sovereignty.constitution.laws.audit.desc,
    },
    {
      id: 2,
      name: t.sovereignty.constitution.laws.intent.name,
      rule: t.sovereignty.constitution.rules.intent,
      status: "ACTIVE",
      severity: "CONSTITUTIONAL",
      description: t.sovereignty.constitution.laws.intent.desc,
    },
    {
      id: 3,
      name: t.sovereignty.constitution.laws.science.name,
      rule: t.sovereignty.constitution.rules.science,
      status: "ACTIVE",
      severity: "CONSTITUTIONAL",
      description: t.sovereignty.constitution.laws.science.desc,
    },
    {
      id: 4,
      name: t.sovereignty.constitution.laws.emergency.name,
      rule: t.sovereignty.constitution.rules.emergency,
      status: "READY",
      severity: "OPERATIONAL",
      description: t.sovereignty.constitution.laws.emergency.desc,
    },
    {
      id: 5,
      name: t.sovereignty.constitution.laws.lang_sovereignty.name,
      rule: t.sovereignty.constitution.rules.lang_sovereignty,
      status: "ACTIVE",
      severity: "CONSTITUTIONAL",
      description: t.sovereignty.constitution.laws.lang_sovereignty.desc,
    },
    {
      id: 6,
      name: t.sovereignty.constitution.laws.stability.name,
      rule: t.sovereignty.constitution.rules.stability,
      status: "ACTIVE",
      severity: "CONSTITUTIONAL",
      description: t.sovereignty.constitution.laws.stability.desc,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
          <Icons.ShieldAlert className="w-8 h-8 text-rose-500" />
          {t.sovereignty.constitution.title}
        </h2>
        <PremiumBadge variant="outline">
          {t.sovereignty.constitution.ver}
        </PremiumBadge>
      </div>

      <div className="grid gap-4">
        {laws.map((law) => (
          <PremiumCard
            key={law.id}
            className="border-rose-500/10 hover:border-rose-500/30 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100">{law.name}</h3>
                  <span className="text-sm font-bold font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                    {law.rule}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-400 max-w-md">
                  {law.description}
                </p>
                <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                  Severity:{" "}
                  {law.severity === "CONSTITUTIONAL"
                    ? t.sovereignty.health.status_map.constitutional
                    : t.sovereignty.health.status_map.operational}
                </span>
              </div>
              <PremiumBadge
                variant={law.status === "ACTIVE" ? "success" : "secondary"}
                size="sm"
              >
                {law.status === "ACTIVE"
                  ? t.sovereignty.health.status_map.ACTIVE
                  : t.sovereignty.health.status_map.READY}
              </PremiumBadge>
            </div>
          </PremiumCard>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-rose-500/20 text-rose-500 animate-pulse">
          <Icons.Alert className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-100">
            {t.sovereignty.constitution.emergency.title}
          </h4>
          <p className="text-sm font-bold text-rose-100/60">
            {t.sovereignty.constitution.emergency.desc}
          </p>
        </div>
        <button className="ms-auto soft-btn bg-rose-500 text-white border-rose-600 hover:bg-rose-600">
          {t.sovereignty.constitution.emergency.btn}
        </button>
      </div>
    </div>
  );
}
