"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";
import { updateLabSetting } from "@/app/actions/lab-settings";

interface CubeSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: Record<string, string>;
  standards: { id: number; code: string; name: string }[];
  onRefresh: () => void;
}

export default function CubeSettingsPanel({
  isOpen,
  onClose,
  initialSettings,
  standards,
  onRefresh,
}: CubeSettingsPanelProps) {
  const [selectedStandard, setSelectedStandard] = useState(
    initialSettings["standard.cubes"] || "",
  );
  const [testingAges, setTestingAges] = useState(
    initialSettings["testing.ages"] || "3, 7, 28",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Clean testing ages input (trim spaces)
    const cleanedAges = testingAges
      .split(",")
      .map((a) => a.trim())
      .filter((a) => !isNaN(Number(a)) && a.length > 0)
      .join(", ");

    const [resStandard, resAges] = await Promise.all([
      updateLabSetting("standard.cubes", selectedStandard),
      updateLabSetting("testing.ages", cleanedAges || "3, 7, 28"),
    ]);

    if (resStandard.success && resAges.success) {
      toast.success("تم تحديث إعدادات المختبر بنجاح");
      onRefresh();
    } else {
      toast.error("فشل تحديث الإعدادات");
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#0b0f1a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 text-white rtl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Icons.Activity className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  إعدادات نتائج النماذج
                </h2>
                <p className="text-sm font-bold text-slate-500 font-black uppercase tracking-[0.2em]">
                  تحديد المواصفات المعتمدة لفحص المكعبات
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-10 space-y-8 bg-slate-900/10">
            <section className="bg-black/30 border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Icons.Scale className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">
                  المواصفة المعتمدة
                </h3>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 block pr-2">
                  اختر المواصفة المرجعية لتقارير كسر المكعبات:
                </label>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="w-full bg-slate-800 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none ring-2 ring-white/5 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- غير محدد --</option>
                  {standards.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-sm font-bold text-indigo-300 font-bold leading-relaxed">
                ملاحظة: سيتم طباعة هذه المواصفة في ترويسة تقارير المختبر الخاصة
                بالنتائج الخرسانية لضمان الامتثال للمتطلبات الهندسية.
              </div>
            </section>

            <section className="bg-black/30 border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Icons.Scale className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">
                  أعمار كسر المكعبات المعتمدة
                </h3>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 block pr-2">
                  أدخل الأعمار المطلوبة للفحص (مفصولة بفاصلة):
                </label>
                <input
                  type="text"
                  value={testingAges}
                  onChange={(e) => setTestingAges(e.target.value)}
                  placeholder="مثال: 3, 7, 28"
                  className="w-full bg-slate-800 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none ring-2 ring-white/5 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-sm font-bold text-indigo-300 font-bold leading-relaxed">
                ملاحظة: سيتم استخدام هذه الأعمار كاقتراحات وقيم افتراضية عند
                تسجيل نتائج كسر النماذج الخرسانية الجديدة.
              </div>
            </section>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-white/5 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Icons.Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Icons.Save className="w-5 h-5" />
                )}
                حفظ المواصفة
              </button>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 text-center bg-slate-900/40 text-slate-700">
            <p className="text-[9px] font-black uppercase tracking-widest leading-loose">
              Cube Testing Sovereign Protocol v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
