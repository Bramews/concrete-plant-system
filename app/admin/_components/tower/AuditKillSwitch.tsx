"use client";

import { Icons } from "@/components/ui/Icons";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function AuditKillSwitch({ dict }: { dict: any }) {
  const t = dict?.admin?.tower ?? dict?.tower ?? {};
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [killReason, setKillReason] = useState("");

  const handleKillSwitch = () => {
    if (!killReason)
      return toast.error("يتطلب النظام سبباً تشغيلياً صحيحاً للإغلاق.");
    toast.success(
      `تم إصدار أمر إيقاف النظام: ${killReason}. يتم إنشاء سجل آمن.`,
    );
    setShowKillConfirm(false);
  };

  const auditLogs = [
    {
      id: 1,
      user: "أحمد",
      action: "تغيير السياسة",
      detail: "تفعيل توثيق الأوامر الصارم",
      time: "منذ دقيقتين",
    },
    {
      id: 2,
      user: "أحمد",
      action: "التحكم في الوصول",
      detail: "تعديل ترخيص مؤسسة B",
      time: "منذ 15 دقيقة",
    },
    {
      id: 3,
      user: "النظام",
      action: "الأمن",
      detail: "رصد ذروة تأخير في العقدة 4421",
      time: "منذ ساعة",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right"
      dir="rtl"
    >
      {/* Searchable Audit Feed */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-row-reverse">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 flex-row-reverse">
            <Icons.History className="w-4 h-4 text-primary" />
            {t.audit_stream}
          </h2>
          <button className="text-sm font-bold font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
            {t.full_inquiry}
          </button>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors flex-row-reverse"
              >
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-sm font-bold font-black text-slate-400">
                    {log.user[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold font-black text-white">
                      {log.action}
                    </p>
                    <p className="text-sm font-bold text-slate-500 font-bold">
                      {log.detail}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency & Kill Switch */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 border border-red-500/10 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-red-500 border-b border-white/5 pb-4 flex-row-reverse">
            <Icons.AlertCircle className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-widest">
              {t.emergency_zone}
            </h2>
          </div>

          <p className="text-sm font-bold text-slate-500 font-bold leading-relaxed px-1">
            سيؤدي تفعيل مفتاح الإيقاف إلى تعليق جميع عقد الشركة فوراً وإسقاط
            جميع الجلسات النشطة. هذا الإجراء غير قابل للتراجع بدون استعادة
            الجذر.
          </p>

          {!showKillConfirm ? (
            <button
              onClick={() => setShowKillConfirm(true)}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-black py-4 rounded-xl transition-all uppercase tracking-[.2em] shadow-lg shadow-red-950/20"
            >
              {t.kill_system}
            </button>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95">
              <input
                type="text"
                placeholder={t.provide_reason || "يرجى ذكر السبب التشغيلي..."}
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="w-full bg-slate-950 border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold font-black text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-red-900/30 text-center"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKillConfirm(false)}
                  className="flex-1 py-2 text-sm font-bold font-black text-slate-500 uppercase tracking-widest"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleKillSwitch}
                  className="flex-[2] bg-red-600 text-white font-black py-2 rounded-lg text-sm font-bold uppercase tracking-widest shadow-xl shadow-red-900/40"
                >
                  {t.confirm_termination}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
