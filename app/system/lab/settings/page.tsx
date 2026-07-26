"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { NumInput } from "@/components/ui/NumInput";
import {
  getCompanyLabStandards,
  getLabSettings,
  updateLabSetting,
} from "@/app/actions/lab-settings";
import { toast } from "@/lib/toast";

export default function LabSettingsPage() {
  const [standards, setStandards] = useState<
    { id: string; code: string; name: string }[]
  >([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [stdRes, setRes] = await Promise.all([
        getCompanyLabStandards(),
        getLabSettings(),
      ]);

      if (stdRes.success) setStandards(stdRes.data || []);
      if (setRes.success) setSettings(setRes.data || {});
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpdateSetting = async (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    const res = await updateLabSetting(key, value);
    if (res.success) {
      toast.success("تم تحديث الإعدادات بنجاح");
    } else {
      toast.error("فشل تحديث الإعدادات");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        جاري تحميل الإعدادات...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
          <Icons.Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">إعدادات المختبر</h1>
          <p className="text-slate-400 font-medium">
            تخصيص المواصفات المعتمدة وإدارة بروتوكولات الاختبار
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adopted Standards */}
        <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Icons.Scale className="w-5 h-5 text-indigo-400" />
            المواصفات المعتمدة لكل اختبار
          </h2>

          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
              <label className="block text-sm font-bold text-slate-400 mb-3">
                مواصفة فحص المكعبات
              </label>
              <select
                value={settings["standard.cubes"] || ""}
                onChange={(e) =>
                  handleUpdateSetting("standard.cubes", e.target.value)
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="اختيار مواصفة المكعبات"
              >
                <option value="">-- اختر المواصفة --</option>
                {standards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
              <label className="block text-sm font-bold text-slate-400 mb-3">
                مواصفة تحليل المناخل
              </label>
              <select
                value={settings["standard.sieve"] || ""}
                onChange={(e) =>
                  handleUpdateSetting("standard.sieve", e.target.value)
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="اختيار مواصفة المناخل"
              >
                <option value="">-- اختر المواصفة --</option>
                {standards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Mix Design Defaults */}
        <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Icons.Database className="w-5 h-5 text-amber-400" />
            القيم الافتراضية لتصميم الخلطة
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                key: "mix.default.cement",
                label: "وزن السمنت (كجم)",
                placeholder: "364",
              },
              {
                key: "mix.default.sand",
                label: "وزن الرمل (كجم)",
                placeholder: "740",
              },
              {
                key: "mix.default.ca20mm",
                label: "وزن الحصى 20مم",
                placeholder: "1040",
              },
              {
                key: "mix.default.water",
                label: "الماء (لتر)",
                placeholder: "170",
              },
              {
                key: "mix.default.air",
                label: "نسبة الهواء (%)",
                placeholder: "2.0",
              },
              {
                key: "mix.default.trialLiters",
                label: "حجم التجربة (لتر)",
                placeholder: "25",
              },
              {
                key: "mix.default.admixture.dosage",
                label: "جرعة المضاف (%)",
                placeholder: "0.8",
              },
              {
                key: "mix.default.admixture.sg",
                label: "الوزن النوعي للمضاف",
                placeholder: "1.05",
              },
              {
                key: "mix.default.sand.sg",
                label: "SG الرمل",
                placeholder: "2.60",
              },
              {
                key: "mix.default.ca10mm.sg",
                label: "SG حصى 10مم",
                placeholder: "2.639",
              },
              {
                key: "mix.default.ca20mm.sg",
                label: "SG حصى 20مم",
                placeholder: "2.63",
              },
            ].map((field) => (
              <div
                key={field.key}
                className="p-4 rounded-2xl bg-black/20 border border-white/5"
              >
                <label className="block text-sm font-bold font-black text-slate-500 uppercase mb-2">
                  {field.label}
                </label>
                <NumInput
                  value={settings[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={(v) =>
                    handleUpdateSetting(
                      field.key,
                      v !== null ? v.toString() : "",
                    )
                  }
                  className="w-full bg-transparent border-b border-white/10 py-1 focus:border-amber-500 outline-none text-white font-mono font-bold"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Lab Materials Management (Moved to Sieve Analysis) */}
      </div>
    </div>
  );
}
