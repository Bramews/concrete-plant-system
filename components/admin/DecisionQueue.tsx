"use client";

import { DecisionItem, DecisionCategory } from "@/lib/sovereignty";
import { useState, useEffect, useCallback } from "react";
import { handleDecision } from "@/app/actions/admin-sovereignty";
import { toast } from "@/lib/toast";

interface DecisionQueueProps {
  initialItems: DecisionItem[];
}

export function DecisionQueue({ initialItems }: DecisionQueueProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const getCategoryStyle = useCallback((category: DecisionCategory) => {
    switch (category) {
      case DecisionCategory.SEC:
        return "border-red-900 text-red-500 bg-red-950/20";
      case DecisionCategory.FIN:
        return "border-green-900 text-green-500 bg-green-950/20";
      case DecisionCategory.GOV:
        return "border-blue-900 text-blue-500 bg-blue-950/20";
      case DecisionCategory.POLICY:
        return "border-purple-900 text-purple-500 bg-purple-950/20";
      default:
        return "border-[#333] text-[#666]";
    }
  }, []);

  const onAction = useCallback(
    async (id: number, status: "RESOLVED" | "IGNORED") => {
      if (!reason || reason.length < 5) {
        toast.error("إشارة مرفوضة: التبرير إلزامي لاعتماد القرار");
        return;
      }

      setLoadingId(id);
      const res = await handleDecision(id, status, reason);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setReason("");
        setSelectedIndex((prev) =>
          Math.max(0, Math.min(prev, items.length - 2)),
        );
        toast.success("تم اعتماد القرار بنجاح");
      } else {
        toast.error("خطأ في التنفيذ: " + res.error);
      }
      setLoadingId(null);
    },
    [reason, items.length],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === "INPUT") return;
      if (items.length === 0) return;

      if (e.key === "j")
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      if (e.key === "k") setSelectedIndex((prev) => Math.max(prev - 1, 0));
      if (e.key === "Enter") {
        const item = items[selectedIndex];
        if (item && !loadingId) onAction(item.id, "RESOLVED");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, loadingId, onAction]);

  return (
    <div className="bg-black border border-[#222] flex flex-col h-full font-mono select-none">
      <div className="p-3 bg-[#0a0a0a] border-b border-[#222] flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="font-black text-sm font-bold uppercase tracking-[0.2em] text-[#555]">
            تدفق الإشعارات النشطة
          </h3>
          <div className="h-[1px] w-12 bg-cyan-900 mt-1" />
        </div>
        <span className="bg-[#111] border border-[#222] text-cyan-400 text-[9px] font-black px-2 py-0.5 animate-pulse">
          {items.length} إشارة بانتظار المراجعة
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#222] font-black text-sm font-bold uppercase tracking-widest italic">
            -- لا توجد تنبيهات نشطة --
          </div>
        )}

        {items.map((item, index) => (
          <div
            key={item.id}
            className={`p-4 border-b border-[#111] transition-all relative ${
              index === selectedIndex ? "bg-[#0c0c0c]" : "bg-black opacity-60"
            }`}
          >
            {index === selectedIndex && (
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
            )}

            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-1 items-center">
                <span
                  className={`text-[8px] font-black px-1.5 py-0.5 border ${getCategoryStyle(item.category)}`}
                >
                  {item.category}
                </span>
                <span
                  className={`text-[8px] font-black px-1.5 py-0.5 border ${
                    item.severity === "CRITICAL"
                      ? "border-red-600 text-red-500 bg-red-950/10"
                      : "border-blue-900 text-blue-500"
                  }`}
                >
                  {item.type}
                </span>
              </div>
              <span className="text-[9px] text-[#444] font-black">
                T: {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <div
                  className={`font-black text-sm font-bold leading-tight transition-colors ${index === selectedIndex ? "text-white" : "text-[#888]"}`}
                >
                  {item.context}
                </div>
                <div className="text-[9px] text-[#333] mt-1 font-bold uppercase tracking-wider">
                  {item.impact}
                </div>
                <div className="h-[1px] w-full bg-[#111] mt-2 group-hover:bg-[#222] transition-colors" />
              </div>

              <div className="flex justify-between items-end">
                <div className="text-[9px]">
                  <span className="text-[#333] font-black">AGE_LIMIT:</span>
                  <span
                    className={`${item.timeToRisk ? "text-amber-600" : "text-red-900"} ml-1 font-black`}
                  >
                    {item.timeToRisk || "خطر فوري"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(item.id, "IGNORED");
                    }}
                    className="text-[9px] font-black text-[#333] hover:text-[#555] transition-colors uppercase"
                  >
                    [تجاهل الإشارة]
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(item.id, "RESOLVED");
                    }}
                    className="text-[9px] font-black text-cyan-500 hover:text-cyan-400 transition-colors uppercase"
                  >
                    [اعتماد القرار]
                  </button>
                </div>
              </div>

              {index === selectedIndex && (
                <div className="mt-2 border-t border-[#1a1a1a] pt-3 animate-in fade-in slide-in-from-top-1">
                  <div className="text-[9px] text-[#444] font-black mb-1 px-1">
                    تبرير اتخاذ القرار (إلزامي):
                  </div>
                  <input
                    type="text"
                    placeholder="ادخل سبب اتخاذ هذا الإجراء..."
                    value={reason}
                    autoFocus
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#050505] border border-[#222] p-2 text-sm font-bold text-cyan-400 outline-none focus:border-cyan-800 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-[#222] bg-[#050505] flex justify-between text-[8px] text-[#333] font-black uppercase tracking-[0.15em]">
        <span>[K]_السابق [J]_التالي</span>
        <span>[ENTER]_اعتماد_الإشارة</span>
      </div>
    </div>
  );
}
