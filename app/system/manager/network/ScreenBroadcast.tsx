"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";

export function ScreenBroadcast() {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startBroadcast = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setStream(displayStream);
      setIsBroadcasting(true);
      toast.success("تم بدء البث. سيظهر للمستخدمين في شاشاتهم الحية.");

      displayStream.getVideoTracks()[0].onended = () => {
        stopBroadcast();
      };
    } catch (err) {
      console.error(err);
      toast.error("تم إلغاء البث أو حدث خطأ في الوصول للشاشة.");
    }
  };

  const stopBroadcast = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsBroadcasting(false);
    toast.info("تم إيقاف البث.");
  };

  return (
    <div
      className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl mt-8"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Icons.Monitor className="w-5 h-5 text-indigo-400" />
          البث الحي لجميع الشاشات
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <p className="text-sm font-medium text-slate-300 leading-relaxed">
            تتيح لك هذه الميزة بث شاشتك الحالية لجميع الشاشات (TVs) والأجهزة
            المتصلة داخل المحطة بشكل مباشر. مفيد جداً أثناء الاجتماعات الصباحية
            لعرض تقارير أداء الخلطات، أو في حالات الطوارئ لإيقاف المحطة وعرض
            تحذير مهم لجميع الكادر.
          </p>

          <div className="flex gap-4">
            {!isBroadcasting ? (
              <button
                onClick={startBroadcast}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Icons.Play className="w-4 h-4" />
                بدء البث الحي للجميع
              </button>
            ) : (
              <button
                onClick={stopBroadcast}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 animate-pulse"
              >
                <Icons.Pause className="w-4 h-4" />
                إيقاف البث فوراً
              </button>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/3 aspect-video bg-slate-950 border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
          {isBroadcasting ? (
            <div className="absolute inset-0 bg-indigo-500/10 flex flex-col items-center justify-center">
              <Icons.Activity className="w-12 h-12 text-indigo-500 animate-ping mb-4" />
              <div className="text-indigo-400 font-bold animate-pulse text-sm">
                البث قيد العمل ...
              </div>
            </div>
          ) : (
            <div className="text-slate-500 font-bold flex flex-col items-center">
              <Icons.Monitor className="w-10 h-10 mb-2 opacity-30" />
              <span className="text-xs">لا يوجد بث حالي</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
