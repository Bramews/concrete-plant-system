"use client";

import { useEffect, useState } from "react";
import {
  getRegisterPageConfig,
  updateRegisterPageConfig,
  type RegisterPageConfig,
} from "@/app/actions/register-page";
import { useRouter } from "next/navigation";

export default function RegisterControlPage() {
  const [config, setConfig] = useState<RegisterPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getRegisterPageConfig().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    await updateRegisterPageConfig(config);
    setSaving(false);
    router.refresh();
  };

  const handleChange = (key: keyof RegisterPageConfig, value: string) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (loading || !config) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          إعدادات صفحة التسجيل (Register Page)
        </h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Style Settings */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">
              المظهر العام
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  لون الخلفية الأساسي
                </label>
                <select
                  value={config.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                >
                  <option value="indigo">Indigo</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="rose">Rose</option>
                  <option value="emerald">Emerald</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  نمط الخلفية
                </label>
                <select
                  value={config.backgroundStyle}
                  onChange={(e) =>
                    handleChange("backgroundStyle", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                >
                  <option value="blob">Blob (بقع ضبابية)</option>
                  <option value="mesh">Mesh (شبكة متدرجة)</option>
                  <option value="grid">Grid (خطوط شبكة)</option>
                  <option value="particles">Particles (جزيئات)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">
              نصوص العلامة التجارية
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                  الاسم (عربي)
                </label>
                <input
                  type="text"
                  value={config.brandingNameAr}
                  onChange={(e) =>
                    handleChange("brandingNameAr", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={config.brandingNameEn}
                  onChange={(e) =>
                    handleChange("brandingNameEn", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">
              العناوين الرئيسية
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                    العنوان (عربي)
                  </label>
                  <input
                    type="text"
                    value={config.titleAr}
                    onChange={(e) => handleChange("titleAr", e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={config.titleEn}
                    onChange={(e) => handleChange("titleEn", e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-left"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                    الوصف (عربي)
                  </label>
                  <input
                    type="text"
                    value={config.subtitleAr}
                    onChange={(e) => handleChange("subtitleAr", e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                    Subtitle (English)
                  </label>
                  <input
                    type="text"
                    value={config.subtitleEn}
                    onChange={(e) => handleChange("subtitleEn", e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Labels */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">
              تسميات الحقول (Form Labels)
            </h2>
            <div className="space-y-3">
              {[
                { key: "companyName", label: "اسم الشركة" },
                { key: "subdomain", label: "النطاق الفرعي" },
                { key: "name", label: "الاسم الكامل" },
                { key: "email", label: "البريد الإلكتروني" },
                { key: "phone", label: "رقم الهاتف" },
                { key: "password", label: "كلمة المرور" },
                { key: "submitText", label: "زر الإنشاء" },
              ].map((field) => (
                <div
                  key={field.key}
                  className="grid grid-cols-2 gap-4 pb-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                      {field.label} (عربي)
                    </label>
                    <input
                      type="text"
                      value={
                        (config as unknown as Record<string, string>)[
                          `${field.key}Ar`
                        ]
                      }
                      onChange={(e) =>
                        handleChange(
                          `${field.key}Ar` as keyof RegisterPageConfig,
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                      {field.key} (English)
                    </label>
                    <input
                      type="text"
                      value={
                        (config as unknown as Record<string, string>)[
                          `${field.key}En`
                        ]
                      }
                      onChange={(e) =>
                        handleChange(
                          `${field.key}En` as keyof RegisterPageConfig,
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">
              روابط إضافية
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase text-slate-500 mb-1">
                  رابط الدخول (عربي)
                </label>
                <input
                  type="text"
                  value={config.loginLinkTextAr}
                  onChange={(e) =>
                    handleChange("loginLinkTextAr", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="loginLinkTextEn"
                  className="block text-sm font-bold uppercase text-slate-500 mb-1"
                >
                  Login Link (English)
                </label>
                <input
                  id="loginLinkTextEn"
                  type="text"
                  value={config.loginLinkTextEn}
                  onChange={(e) =>
                    handleChange("loginLinkTextEn", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
