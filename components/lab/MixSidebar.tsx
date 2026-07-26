"use client";

import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface MixSidebarProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  history: any[];
  currentVersion: number;
  onSelectVersion: (version: any) => void;
  onNewDesign: () => void;
  status: string;
}

export function MixSidebar({
  searchTerm,
  setSearchTerm,
  history,
  currentVersion,
  onSelectVersion,
  onNewDesign,
  status,
}: MixSidebarProps) {
  return (
    <aside
      className="w-[360px] bg-slate-900 border-l border-white/5 flex flex-col overflow-hidden shadow-2xl z-20"
      dir="rtl"
    >
      <div className="p-6 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Icons.Mixer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-none tracking-tight">
              تصميم الخلطات
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 western-nums">
              Mix Intelligence 4.0
            </p>
          </div>
        </div>

        <button
          onClick={onNewDesign}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 mb-8"
        >
          <Icons.Plus className="w-4 h-4" />
          تصميم خلطة جديدة
        </button>

        <div className="relative group mb-4">
          <Icons.Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="بحث في الأرشيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-24">
        {/* Version History section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 border-r-2 border-indigo-500">
            سجل التعديلات (Revisions)
          </h3>

          <div className="space-y-3">
            {history.length > 0 ? (
              history.map((rev, i) => (
                <button
                  key={i}
                  onClick={() => onSelectVersion(rev)}
                  className={`
                     w-full text-right p-4 rounded-2xl border transition-all relative overflow-hidden group
                     ${
                       rev.version === currentVersion
                         ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                         : "bg-white/5 border-white/5 hover:bg-white/[0.08] text-slate-400"
                     }
                   `}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black western-nums">
                      Version {rev.version}
                    </span>
                    <span className="text-[10px] font-bold opacity-60 western-nums">
                      {format(new Date(rev.createdAt), "yyyy.MM.dd")}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate">
                    {rev.note || "بدون ملاحظات"}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-700 opacity-20">
                <Icons.History className="w-8 h-8 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase">
                  لا يوجد سجل حالياً
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Design Status Card */}
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            حالة التصميم الحالي
          </h3>
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <p
              className={`text-lg font-black uppercase tracking-widest ${status === "APPROVED" ? "text-emerald-400" : "text-amber-400"}`}
            >
              {status === "APPROVED" ? "معتمدة" : "مسودة"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
