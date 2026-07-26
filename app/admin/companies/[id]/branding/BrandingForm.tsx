"use client";

import { useState } from "react";
import { updateCompanyBranding } from "@/app/actions/branding";
import type { Company, CompanyBranding } from "@prisma/client";

interface BrandingFormProps {
  company: Company;
  branding: CompanyBranding | null;
}

export default function BrandingForm({ company, branding }: BrandingFormProps) {
  const [formData, setFormData] = useState({
    logoUrl: branding?.logoUrl || "",
    logoText: branding?.logoText || "N",
    systemName: branding?.systemName || "Neon-Lab",
    subtitle: branding?.subtitle || "Concrete Core System",
    loginButton: branding?.loginButton || "تسجيل الدخول",
    primaryColor: branding?.primaryColor || "#6366f1",
    secondaryColor: branding?.secondaryColor || "#a855f7",
    accentColor: branding?.accentColor || "#22d3ee",
    homeButtonShow: branding?.homeButtonShow ?? true,
    homeButtonTextAr: branding?.homeButtonTextAr || "الرئيسية",
    homeButtonTextEn: branding?.homeButtonTextEn || "HOME",
    homeButtonSize: branding?.homeButtonSize || "15px",
    homeButtonWeight: branding?.homeButtonWeight || "font-extrabold",
    homeButtonTracking: branding?.homeButtonTracking || "tracking-[0.3em]",
    homeButtonColor: branding?.homeButtonColor || "",
    homeButtonAnimation: branding?.homeButtonAnimation || "breath",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    branding?.logoUrl || null,
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(branding?.logoUrl || null); // Reset to original if no file selected
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const formPayload = new FormData(e.currentTarget);
      // Append current logo url in case no new file is selected or to provide context
      formPayload.append("currentLogoUrl", branding?.logoUrl || "");
      // Append other form data fields manually if they are not part of a file input or named input
      formPayload.append("logoText", formData.logoText);
      formPayload.append("systemName", formData.systemName);
      formPayload.append("subtitle", formData.subtitle);
      formPayload.append("loginButton", formData.loginButton);
      formPayload.append("primaryColor", formData.primaryColor);
      formPayload.append("secondaryColor", formData.secondaryColor);
      formPayload.append("accentColor", formData.accentColor);
      formPayload.append("homeButtonShow", String(formData.homeButtonShow));
      formPayload.append("homeButtonTextAr", formData.homeButtonTextAr);
      formPayload.append("homeButtonTextEn", formData.homeButtonTextEn);
      formPayload.append("homeButtonSize", formData.homeButtonSize);
      formPayload.append("homeButtonWeight", formData.homeButtonWeight);
      formPayload.append("homeButtonTracking", formData.homeButtonTracking);
      formPayload.append("homeButtonColor", formData.homeButtonColor);
      formPayload.append("homeButtonAnimation", formData.homeButtonAnimation);

      await updateCompanyBranding(company.id, formPayload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving branding:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* الشعار */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            🎨
          </span>
          الشعار
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-950/30 border border-slate-700/50">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-600">
                  {formData.logoText}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium text-slate-400">
                رفع شعار جديد
              </label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="branding-logo-upload"
              />
              <label
                htmlFor="branding-logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 cursor-pointer transition-all"
              >
                اختيار صورة
              </label>
            </div>
          </div>
          <div>
            <label
              htmlFor="logoText"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              حرف الشعار البديل
            </label>
            <input
              id="logoText"
              name="logoText"
              type="text"
              maxLength={2}
              value={formData.logoText}
              onChange={(e) => handleChange("logoText", e.target.value)}
              placeholder="N"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* النصوص */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            📝
          </span>
          النصوص
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="systemName"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              اسم النظام
            </label>
            <input
              id="systemName"
              type="text"
              value={formData.systemName}
              onChange={(e) => handleChange("systemName", e.target.value)}
              placeholder="Neon-Lab"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="subtitle"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              العنوان الفرعي
            </label>
            <input
              id="subtitle"
              type="text"
              value={formData.subtitle}
              onChange={(e) => handleChange("subtitle", e.target.value)}
              placeholder="Concrete Core System"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="loginButton"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              نص زر الدخول
            </label>
            <input
              id="loginButton"
              type="text"
              value={formData.loginButton}
              onChange={(e) => handleChange("loginButton", e.target.value)}
              placeholder="تسجيل الدخول"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* الألوان */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            🎨
          </span>
          الألوان
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="primaryColor"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              اللون الأساسي
            </label>
            <div className="flex gap-2">
              <input
                id="primaryColorPicker"
                type="color"
                title="اختر اللون الأساسي"
                value={formData.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                className="w-12 h-10 rounded border border-slate-700 cursor-pointer"
              />
              <input
                id="primaryColor"
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                placeholder="#6366f1"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="secondaryColor"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              اللون الثانوي
            </label>
            <div className="flex gap-2">
              <input
                id="secondaryColorPicker"
                type="color"
                title="اختر اللون الثانوي"
                value={formData.secondaryColor}
                onChange={(e) => handleChange("secondaryColor", e.target.value)}
                className="w-12 h-10 rounded border border-slate-700 cursor-pointer"
              />
              <input
                id="secondaryColor"
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => handleChange("secondaryColor", e.target.value)}
                placeholder="#a855f7"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="accentColor"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              لون التمييز
            </label>
            <div className="flex gap-2">
              <input
                id="accentColorPicker"
                type="color"
                title="اختر لون التمييز"
                value={formData.accentColor}
                onChange={(e) => handleChange("accentColor", e.target.value)}
                className="w-12 h-10 rounded border border-slate-700 cursor-pointer"
              />
              <input
                id="accentColor"
                type="text"
                value={formData.accentColor}
                onChange={(e) => handleChange("accentColor", e.target.value)}
                placeholder="#22d3ee"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* إعدادات زر الرئيسية */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
            🏠
          </span>
          إعدادات زر الرئيسية (Login Page)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/30 border border-slate-700/50">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-200">
                إظهار الزر
              </label>
              <p className="text-sm font-bold text-slate-400">
                تفعيل أو إخفاء زر العودة للرئيسية
              </p>
            </div>
            <button
              type="button"
              title={
                formData.homeButtonShow
                  ? "إيقاف إظهار الزر"
                  : "تفعيل إظهار الزر"
              }
              onClick={() =>
                handleChange("homeButtonShow", !formData.homeButtonShow)
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.homeButtonShow ? "bg-indigo-600" : "bg-slate-700"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.homeButtonShow ? "left-7" : "left-1"}`}
              />
            </button>
          </div>

          <div>
            <label
              htmlFor="homeButtonTextAr"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              النص (عربي)
            </label>
            <input
              id="homeButtonTextAr"
              type="text"
              value={formData.homeButtonTextAr}
              onChange={(e) => handleChange("homeButtonTextAr", e.target.value)}
              placeholder="الرئيسية"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="homeButtonTextEn"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              النص (English)
            </label>
            <input
              id="homeButtonTextEn"
              type="text"
              value={formData.homeButtonTextEn}
              onChange={(e) => handleChange("homeButtonTextEn", e.target.value)}
              placeholder="HOME"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="homeButtonSize"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              حجم الخط (Size)
            </label>
            <select
              id="homeButtonSize"
              title="حجم الخط"
              value={formData.homeButtonSize}
              onChange={(e) => handleChange("homeButtonSize", e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="12px">12px (صغير)</option>
              <option value="14px">14px (متوسط)</option>
              <option value="15px">15px (مثالي)</option>
              <option value="16px">16px (كبير)</option>
              <option value="18px">18px (كبير جداً)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="homeButtonWeight"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              الوزن (Weight)
            </label>
            <select
              id="homeButtonWeight"
              title="وزن الخط"
              value={formData.homeButtonWeight}
              onChange={(e) => handleChange("homeButtonWeight", e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="font-normal">عادي (Normal)</option>
              <option value="font-semibold">شبه عريض (SemiBold)</option>
              <option value="font-bold">عريض (Bold)</option>
              <option value="font-extrabold">عريض جداً (ExtraBold)</option>
              <option value="font-black">أسود (Black)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="homeButtonTracking"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              تباعد الحروف (Tracking)
            </label>
            <select
              id="homeButtonTracking"
              title="تباعد الحروف"
              value={formData.homeButtonTracking}
              onChange={(e) =>
                handleChange("homeButtonTracking", e.target.value)
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="tracking-normal">عادي</option>
              <option value="tracking-wide">واسع</option>
              <option value="tracking-wider">واسع جداً</option>
              <option value="tracking-[0.2em]">0.2em</option>
              <option value="tracking-[0.3em]">0.3em (فخم)</option>
              <option value="tracking-[0.4em]">0.4em</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="homeButtonAnimation"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              نوع الحركة (Animation)
            </label>
            <select
              id="homeButtonAnimation"
              title="نوع الحركة"
              value={formData.homeButtonAnimation}
              onChange={(e) =>
                handleChange("homeButtonAnimation", e.target.value)
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="none">بدون حركة</option>
              <option value="breath">نبضي (Breath)</option>
              <option value="sweep">مسح ضوئي (Sweep)</option>
              <option value="pulse">وميض (Pulse)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="homeButtonColor"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              لون الزر (اختياري)
            </label>
            <div className="flex gap-2">
              <input
                id="homeButtonColorPicker"
                type="color"
                title="اختر لون الزر"
                value={formData.homeButtonColor || "#6366f1"}
                onChange={(e) =>
                  handleChange("homeButtonColor", e.target.value)
                }
                className="w-12 h-10 rounded border border-slate-700 cursor-pointer"
              />
              <input
                id="homeButtonColor"
                type="text"
                value={formData.homeButtonColor}
                onChange={(e) =>
                  handleChange("homeButtonColor", e.target.value)
                }
                placeholder="#6366f1"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* المعاينة */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">معاينة</h3>
        <div className="flex flex-col items-center gap-4 py-8 bg-slate-950 rounded-lg">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
            }}
          >
            {formData.logoText}
          </div>
          <div
            className="text-2xl font-bold drop-shadow-sm"
            style={{ color: formData.primaryColor }}
          >
            {formData.systemName}
          </div>
          <div className="text-sm font-bold tracking-widest text-slate-500 uppercase font-medium">
            {formData.subtitle}
          </div>
          <button
            type="button"
            className="mt-4 px-8 py-3 rounded-xl text-white font-bold transition-transform hover:scale-105"
            style={{
              background: `linear-gradient(to right, ${formData.primaryColor}, ${formData.secondaryColor})`,
            }}
          >
            {formData.loginButton}
          </button>

          {/* Home Button Preview */}
          {formData.homeButtonShow && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                معاينة زر الرئيسية
              </span>
              <div
                className={`flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900 border border-white/10 ${formData.homeButtonWeight} ${formData.homeButtonTracking} transition-all`}
                style={{
                  fontSize: formData.homeButtonSize,
                  borderColor: formData.homeButtonColor
                    ? `${formData.homeButtonColor}40`
                    : "rgba(255,255,255,0.1)",
                  color: formData.homeButtonColor || "white",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 transition-colors"
                  style={{
                    backgroundColor: formData.homeButtonColor
                      ? `${formData.homeButtonColor}20`
                      : "rgba(99,102,241,0.2)",
                    color: formData.homeButtonColor || "#818cf8",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-3 h-3"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                {formData.homeButtonTextAr} / {formData.homeButtonTextEn}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-end gap-4">
        {saved && (
          <span className="text-emerald-400 flex items-center gap-2">
            ✓ تم الحفظ بنجاح
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
}
