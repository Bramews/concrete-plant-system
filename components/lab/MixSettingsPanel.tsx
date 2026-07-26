"use client";
/* eslint-disable react/no-unknown-property */

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { NumInput } from "@/components/ui/NumInput";
import { toast } from "@/lib/toast";
import { updateLabSetting } from "@/app/actions/lab-settings";

interface MixSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: Record<string, string>;
  standards: any[];
  onRefresh: () => void;
}

export default function MixSettingsPanel({
  isOpen,
  onClose,
  initialSettings,
  standards,
  onRefresh,
}: MixSettingsPanelProps) {
  const [settings, setSettings] =
    useState<Record<string, string>>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (key: string, value: string | number) => {
    const stringValue = value.toString();
    setSettings((prev) => ({ ...prev, [key]: stringValue }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(settings).map(([key, val]) =>
        updateLabSetting(key, val),
      );
      await Promise.all(promises);
      toast.success("تم حفظ إعدادات الخلطة بنجاح");
      onRefresh();
    } catch (e) {
      toast.error("فشل في حفظ بعض الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    {
      title: "الأوزان الافتراضية (كجم)",
      icon: <Icons.Scale className="w-5 h-5 text-amber-400" />,
      fields: [
        { key: "mix.default.cement", label: "وزن السمنت", placeholder: "365" },
        { key: "mix.default.sand", label: "وزن الرمل", placeholder: "740" },
        {
          key: "mix.default.ca10mm",
          label: "وزن بحص 10مم",
          placeholder: "450",
        },
        {
          key: "mix.default.ca20mm",
          label: "وزن بحص 20مم",
          placeholder: "650",
        },
        { key: "mix.default.water", label: "الماء (لتر)", placeholder: "165" },
      ],
    },
    {
      title: "الثوابت الفيزيائية (SG)",
      icon: <Icons.Database className="w-5 h-5 text-indigo-400" />,
      fields: [
        { key: "mix.default.sand.sg", label: "SG الرمل", placeholder: "2.63" },
        {
          key: "mix.default.ca10mm.sg",
          label: "SG بحص 10مم",
          placeholder: "2.65",
        },
        {
          key: "mix.default.ca20mm.sg",
          label: "SG بحص 20مم",
          placeholder: "2.67",
        },
        {
          key: "mix.default.cement.sg",
          label: "SG السمنت",
          placeholder: "3.15",
        },
      ],
    },
    {
      title: "إعدادات التجربة والمضافات",
      icon: <Icons.FlaskConical className="w-5 h-5 text-emerald-400" />,
      fields: [
        {
          key: "mix.default.trialLiters",
          label: "حجم التجربة (لتر)",
          placeholder: "25",
        },
        {
          key: "mix.default.air",
          label: "نسبة الهواء (%)",
          placeholder: "2.0",
        },
        {
          key: "mix.default.admixture.dosage",
          label: "جرعة المضاف (%)",
          placeholder: "0.8",
        },
        {
          key: "mix.default.admixture.sg",
          label: "SG المضاف",
          placeholder: "1.05",
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-[#0b0f1a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 text-white rtl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Icons.Settings className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  إعدادات تصميم الخلطة
                </h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                  تخصيص القيم الافتراضية للعمليات المخبرية
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

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-900/10">
            <div className="grid grid-cols-1 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {sections.map((section, idx) => (
                <section key={idx} className="space-y-6">
                  <div className="flex items-center gap-3 border-r-4 border-indigo-500 pr-4">
                    {section.icon}
                    <h3 className="text-lg font-black text-white">
                      {section.title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.fields.map((field) => (
                      <div
                        key={field.key}
                        className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group"
                      >
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 group-hover:text-indigo-400 transition-colors">
                          {field.label}
                        </label>
                        <NumInput
                          value={settings[field.key] || ""}
                          placeholder={field.placeholder}
                          onChange={(v) => handleUpdate(field.key, v ?? "")}
                          className="w-full bg-transparent border-none text-xl font-bold text-white western-nums outline-none placeholder:text-slate-800"
                        />
                        <div className="h-[2px] w-0 group-focus-within:w-full bg-gradient-to-l from-indigo-500 to-transparent transition-all duration-500 mt-2" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Footer Card */}
          <div className="p-8 border-t border-white/5 flex items-center justify-between bg-slate-900/40">
            <div className="hidden md:block">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                تحديثات هذه الإعدادات تؤثر على واجهة &quot;إضافة خلطة
                جديدة&quot; تلقائياً
              </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={onClose}
                className="flex-1 md:w-32 py-3 rounded-2xl font-black text-slate-400 hover:bg-white/5 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex-1 md:w-48 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Icons.Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Icons.Save className="w-5 h-5" />
                )}
                حفظ كافة التغييرات
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .western-nums {
          font-family: "Inter", sans-serif !important;
          direction: ltr !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
