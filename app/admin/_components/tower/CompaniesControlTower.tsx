"use client";

import { Icons } from "@/components/ui/Icons";
import { useState } from "react";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "monitored";
  risk: "low" | "medium" | "high";
  lastActive: string;
}

export function CompaniesControlTower({
  dict,
  companies: initialCompanies,
}: {
  dict: any;
  companies: any[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const t = dict?.admin?.tower ?? dict?.tower ?? {};

  // Map real database entities to the visual component structure
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const companies = initialCompanies.map((c) => ({
    id: String(c.id),
    name: c.name,
    slug: c.slug,
    status: (c.status?.toLowerCase() === "active"
      ? "active"
      : c.status?.toLowerCase() === "suspended"
        ? "suspended"
        : "monitored") as "active" | "suspended" | "monitored",
    risk: (c.riskLevel?.toLowerCase() || "low") as "low" | "medium" | "high",
    lastActive: c.updatedAt
      ? new Intl.RelativeTimeFormat("ar").format(
          Math.floor((c.updatedAt.getTime() - now) / 60000),
          "minute",
        )
      : "N/A",
  }));

  const statusMap = {
    active: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      label: dict.dashboard.kpi.active,
    },
    suspended: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: dict.companies.list.status_suspended,
    },
    monitored: {
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "تحت المراقبة",
    },
  };

  const riskColors = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">
            {t.entity_sovereignty}
          </h2>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            {t.enterprise_command}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder={t.locate_node}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm font-bold font-black text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-slate-700 w-48 lg:w-64"
            />
          </div>

          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1">
            {["all", "active", "monitored"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-primary text-black" : "text-slate-500 hover:text-white"}`}
              >
                {f === "all"
                  ? dict.dashboard.sections.view_all
                  : f === "active"
                    ? dict.dashboard.kpi.active
                    : "المراقبة"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl hover:border-white/10 transition-all flex flex-col"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${statusMap[company.status].bg} ${statusMap[company.status].color} ${statusMap[company.status].border}`}
                >
                  {statusMap[company.status].label}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-slate-600 uppercase">
                    {t.risk_level}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${riskColors[company.risk]}`}
                  />
                </div>
              </div>

              <h3 className="text-sm font-black text-white mb-0.5">
                {company.name}
              </h3>
              <p className="text-sm font-bold text-slate-500 font-bold font-mono">
                ID: {company.slug}
              </p>

              <div className="mt-4 flex items-center justify-between py-3 border-y border-white/5">
                <span className="text-[9px] font-black text-slate-600 uppercase">
                  {t.last_signal}
                </span>
                <span className="text-sm font-bold font-black text-white">
                  {company.lastActive}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/5 bg-white/5">
              <button className="py-3 text-[9px] font-black text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                {t.read_only_entry}
              </button>
              <button className="py-3 text-[9px] font-black text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                {t.control_log}
              </button>
            </div>

            <button className="w-full py-4 text-sm font-bold font-black uppercase tracking-[0.2em] bg-slate-950 text-slate-500 hover:text-red-500 transition-all border-t border-white/5">
              {company.status === "suspended"
                ? t.reactivate_node
                : t.suspend_entity}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
