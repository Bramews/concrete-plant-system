"use client";

import { Icons } from "@/components/ui/Icons";
import { useState } from "react";
import { DictionaryType } from "@/lib/dictionary";

export function NotificationsMaster({ dict }: { dict: DictionaryType }) {
  const t = dict?.admin?.tower ?? dict?.tower ?? {};
  const [policies] = useState([
    {
      id: "crit",
      channel: "دفع / رسائل نصية",
      recipient: "مالك النظام",
      priority: "فوري",
      active: true,
    },
    {
      id: "warn",
      channel: "لوحة التحكم / بريد",
      recipient: "الدعم الفني",
      priority: "مجمع",
      active: true,
    },
    {
      id: "info",
      channel: "لوحة التحكم فقط",
      recipient: "مدير الشركة",
      priority: "مؤجل",
      active: false,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 text-right flex-row-reverse">
            <Icons.Bell className="w-4 h-4 text-emerald-500" />
            {t.signal_routing}
          </h2>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1 text-right">
            {t.sovereignty_layer}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-right border-collapse" dir="rtl">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4 text-right">
                {t.escalation_path}
              </th>
              <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4 text-right">
                {t.channels}
              </th>
              <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4 text-right">
                {t.priority_level || "مستوى الأولوية"}
              </th>
              <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4 text-center">
                {t.protocol}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {policies.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="p-4">
                  <span className="text-sm font-bold font-black text-white uppercase">
                    {p.recipient}
                  </span>
                </td>
                <td className="p-4 text-sm font-bold text-slate-500 font-bold uppercase">
                  {p.channel}
                </td>
                <td className="p-4">
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      p.priority === "فوري"
                        ? "text-red-500 bg-red-500/10 border-red-500/10"
                        : "text-slate-400 bg-white/5 border-white/5"
                    }`}
                  >
                    {p.priority}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    aria-label={p.active ? "تعطيل القناة" : "تفعيل القناة"}
                    title={p.active ? "تعطيل القناة" : "تفعيل القناة"}
                    className={`p-1.5 rounded-lg border transition-all ${
                      p.active
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : "bg-slate-800 border-white/5 text-slate-600"
                    }`}
                  >
                    <Icons.ShieldCheck className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
