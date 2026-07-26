"use client";

import { format } from "date-fns";
import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

interface Revision {
  id: number;
  version: number;
  isCurrent: boolean;
  status: string;
  changeNote: string | null;
  updatedAt: string | Date;
  approvedAt: string | Date | null;
  approvedBy?: { name: string } | null;
}

export function MixDesignHistory({ revisions }: { revisions: Revision[] }) {
  if (!revisions || revisions.length <= 1) return null;

  return (
    <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <Icons.History className="w-5 h-5 text-indigo-400" />
        <h3 className="font-black text-sm uppercase tracking-widest text-white">
          سجل التحديثات (Revision History)
        </h3>
      </div>

      <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-8">
        {revisions.map((rev) => (
          <div key={rev.id} className="relative">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 border-background ${
                rev.isCurrent ? "bg-indigo-500" : "bg-slate-600"
              }`}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg text-white">
                    v{rev.version}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      rev.isCurrent
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {rev.isCurrent ? "الحالية" : "مؤرشفة"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      rev.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {rev.status === "APPROVED" ? "معتمدة" : "مسودة"}
                  </span>
                </div>

                {!rev.isCurrent && (
                  <Link
                    href={`/system/lab/mix-designs/${rev.id}/view`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Icons.Eye className="w-3.5 h-3.5" />
                    عرض التفاصيل
                  </Link>
                )}
              </div>

              <div className="text-sm text-slate-400 flex items-center gap-2">
                <Icons.Calendar className="w-3 h-3" />
                {format(new Date(rev.updatedAt), "yyyy-MM-dd HH:mm")}
              </div>

              {rev.changeNote && (
                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5 text-sm text-slate-300">
                  <span className="font-bold text-slate-500 text-xs uppercase block mb-1">
                    سبب التعديل:
                  </span>
                  {rev.changeNote}
                </div>
              )}

              {rev.status === "APPROVED" && rev.approvedBy && (
                <div className="text-xs text-emerald-500/80 mt-2 font-bold flex items-center gap-1">
                  <Icons.CheckCircle className="w-3 h-3" />
                  تم الاعتماد بواسطة: {rev.approvedBy.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
