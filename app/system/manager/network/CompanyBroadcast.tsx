"use client";

import { useState, useTransition } from "react";
import { Icons } from "@/components/ui/Icons";
import { toast } from "sonner";
import { broadcastCompanyMessage } from "@/app/actions/manager";

export function CompanyBroadcast() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleBroadcast = () => {
    if (!message || message.trim().length < 3) {
      toast.error("يرجى كتابة نص الرسالة (3 أحرف على الأقل)");
      return;
    }
    startTransition(async () => {
      const res = await broadcastCompanyMessage(message);
      if (res.success) {
        toast.success("تم بث الرسالة بنجاح لجميع موظفي الشركة المتصلين!");
        setMessage("");
      } else {
        toast.error(res.error || "فشل بث الرسالة");
      }
    });
  };

  return (
    <div
      className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl mt-8"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Icons.Radio className="w-5 h-5 text-amber-400 animate-pulse" />
          بث رسالة نصية عاجلة للموظفين
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-300 leading-relaxed">
          اكتب رسالة مهمة وسيتم عرضها فوراً وتلقائياً على شكل نافذة منبثقة في
          شاشات لوحة تحكم جميع الموظفين المتصلين حالياً بشركتك.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <textarea
            className="flex-1 p-4 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500/50 resize-none min-h-[80px]"
            rows={2}
            placeholder="اكتب رسالة البث للشركة هنا..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleBroadcast}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50 h-[80px] sm:h-auto"
          >
            {isPending ? (
              <Icons.Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Icons.Radio className="w-5 h-5" />
            )}
            بث الرسالة الآن
          </button>
        </div>
      </div>
    </div>
  );
}
