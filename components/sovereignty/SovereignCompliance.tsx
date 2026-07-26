"use client";

import { Icons } from "@/components/ui/Icons";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { usePreferences } from "@/context/PreferenceContext";

interface Violation {
  id: number;
  type: string;
  severity: string;
  details: string;
}

export function SovereignCompliance({
  violations,
}: {
  violations: Violation[];
}) {
  const { t } = usePreferences();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
          <Icons.ShieldCheck className="w-8 h-8 text-emerald-400" />
          {t.sovereignty.compliance.title}
        </h2>
        <div className="flex gap-2">
          <PremiumBadge variant="outline">
            {t.sovereignty.compliance.trust_level}: 98%
          </PremiumBadge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard className="bg-emerald-500/5 border-emerald-500/10">
          <div className="flex items-center gap-3 mb-2">
            <Icons.Activity className="w-5 h-5 text-emerald-500" />
            <h4 className="text-sm font-bold text-emerald-100">
              {t.sovereignty.compliance.integrity_check}
            </h4>
          </div>
          <p className="text-2xl font-black text-white">
            {t.sovereignty.health.status_map.HEALTHY}
          </p>
          <p className="text-sm font-bold text-emerald-500/60 mt-1">
            Cross-reference verify: {t.sovereignty.compliance.pass}
          </p>
        </PremiumCard>

        <PremiumCard className="bg-amber-500/5 border-amber-500/10">
          <div className="flex items-center gap-3 mb-2">
            <Icons.Unlock className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-bold text-amber-100">
              {t.sovereignty.compliance.access_density}
            </h4>
          </div>
          <p className="text-2xl font-black text-white">
            {t.sovereignty.health.status_map.NORMAL}
          </p>
          <p className="text-sm font-bold text-amber-500/60 mt-1">
            {t.sovereignty.compliance.overrides}: 2{" "}
            {t.sovereignty.compliance.week}
          </p>
        </PremiumCard>

        <PremiumCard className="bg-cyan-500/5 border-cyan-500/10">
          <div className="flex items-center gap-3 mb-2">
            <Icons.Box className="w-5 h-5 text-cyan-500" />
            <h4 className="text-sm font-bold text-cyan-100">
              {t.sovereignty.compliance.redundancy_status}
            </h4>
          </div>
          <p className="text-2xl font-black text-white">
            {t.sovereignty.health.status_map.ACTIVE}
          </p>
          <p className="text-sm font-bold text-cyan-500/60 mt-1">
            {t.sovereignty.compliance.backup_ago}: 42m
          </p>
        </PremiumCard>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2">
          <Icons.FileText className="w-4 h-4" />
          {t.sovereignty.compliance.violation_reports}
        </h3>

        {violations.map((v) => (
          <PremiumCard key={v.id} className="border-rose-500/20 bg-rose-500/5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Icons.Alert className="w-5 h-5 text-rose-500" />
                <div>
                  <h4 className="text-sm font-bold text-rose-100">
                    {v.type || t.sovereignty.health.status_map.breach}
                  </h4>
                  <p className="text-sm font-bold text-rose-100/60">
                    {v.details}
                  </p>
                </div>
              </div>
              <PremiumBadge variant="error">
                {v.severity || t.sovereignty.health.status_map.HIGH}
              </PremiumBadge>
            </div>
          </PremiumCard>
        ))}

        {violations.length === 0 && (
          <div className="py-8 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
            <Icons.ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-emerald-300 font-medium">
              {t.sovereignty.compliance.no_violations}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
