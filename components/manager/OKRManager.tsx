"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import { Target, Trophy, TrendingUp, Sparkles, Award } from "lucide-react";

interface OKRItem {
  id: number;
  objective: string;
  keyResult: string;
  target: number;
  current: number;
  unit: string;
  type: "higher" | "lower"; // higher is better (like volume) or lower is better (like failure rate)
}

export function OKRManager() {
  const [okrs, setOkrs] = useState<OKRItem[]>([
    {
      id: 1,
      objective: "تحسين حجم مبيعات وتوريد الخرسانة",
      keyResult: "الإنتاج الخرساني الشهري الإجمالي للمحطة",
      target: 10000,
      current: 8450,
      unit: "م³",
      type: "higher",
    },
    {
      id: 2,
      objective: "التحكم الصارم بجودة وتماسك الخلطات",
      keyResult: "نسبة فشل مكعبات الضغط المخبرية",
      target: 2,
      current: 1.2,
      unit: "%",
      type: "lower",
    },
    {
      id: 3,
      objective: "رفع كفاءة تلبية مواعيد التوريد واللوجستيات",
      keyResult: "نسبة تسليم تذاكر الإنتاج في الوقت المحدد للزبون",
      target: 95,
      current: 91,
      unit: "%",
      type: "higher",
    },
    {
      id: 4,
      objective: "التقليل من هدر وهدر مواد التصنيع",
      keyResult: "الفرق بين وزن المواد الفعلي في الخلاطة والتصميم",
      target: 1.5,
      current: 1.9,
      unit: "%",
      type: "lower",
    },
  ]);

  return (
    <div className="space-y-6 text-right">
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          نظام الأهداف والنتائج الرئيسية (OKR System)
        </h3>
        <p className="text-xs text-slate-400">
          تتبع وقياس الأداء والمستهدفات الشهرية للمحطة تلقائياً مقارنة بالإنتاج
          الفعلي
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {okrs.map((okr) => {
          // Calculate progress percentage
          let progress = 0;
          if (okr.type === "higher") {
            progress = Math.min(100, (okr.current / okr.target) * 100);
          } else {
            // Lower is better: if current is less than or equal to target, progress is 100%
            // if current is double target or more, progress is 0%
            const range = okr.target * 2;
            progress = Math.max(
              0,
              Math.min(100, ((range - okr.current) / range) * 100),
            );
          }

          const progressPercent = Math.round(progress);
          const isSuccessful =
            okr.type === "higher"
              ? okr.current >= okr.target
              : okr.current <= okr.target;

          return (
            <div
              key={okr.id}
              className="p-5 rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-sm space-y-4 hover:scale-[1.01] transition-all"
            >
              <div className="flex justify-between items-start">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black border ${
                    isSuccessful
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {isSuccessful ? "مستهدف متحقق ✓" : "قيد التقدم"}
                </span>
                <Trophy
                  className={`w-5 h-5 ${isSuccessful ? "text-emerald-400" : "text-slate-600"}`}
                />
              </div>

              <div>
                <h4 className="font-black text-white text-base leading-relaxed">
                  {okr.objective}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  النتيجة الرئيسية: {okr.keyResult}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 font-bold">
                  <span>نسبة الإنجاز</span>
                  <span className="font-mono text-white">
                    <BidiText>{progressPercent}</BidiText>%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSuccessful
                        ? "bg-gradient-to-l from-emerald-500 to-teal-400"
                        : "bg-gradient-to-l from-indigo-500 to-indigo-600"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs font-bold">
                <div className="text-slate-400">
                  المستهدف:{" "}
                  <span className="text-white">
                    <BidiText>{okr.target}</BidiText> {okr.unit}
                  </span>
                </div>
                <div className="text-slate-400">
                  الحالي:{" "}
                  <span className="text-white">
                    <BidiText>{okr.current}</BidiText> {okr.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-2xl flex items-center justify-between text-indigo-400">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">
            تهنئة أداء: حققت المحطة تقدم الكفاءة الكلي بنسبة{" "}
            <BidiText>{87}</BidiText>% من مستهدفات الـ OKRs للشهر الحالي! استمر
            في القيادة الإيجابية.
          </span>
        </div>
      </div>
    </div>
  );
}
