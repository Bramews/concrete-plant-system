"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface GeneralTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function GeneralTab({ dict, settings, onUpdate }: GeneralTabProps) {
  // Helper for safe number limit
  const handleNumberChange = (
    key: string,
    value: string,
    min: number,
    max: number,
  ) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num < min) onUpdate(key, min.toString());
      else if (num > max) onUpdate(key, max.toString());
      else onUpdate(key, value);
    } else {
      onUpdate(key, value);
    }
  };

  const logoSize = settings.logo_size?.value || "64";
  const logoRadius = settings.logo_radius?.value || "16";
  const logoFontSize = settings.logo_font_size?.value || "30";
  const brandPaddingY = settings.brand_padding_y?.value || "24";
  const logoType = settings.logo_type?.value || "text";
  const logoUrl = settings.logo_url?.value || "";

  return (
    <div className="space-y-8" dir="rtl">
      {/* System Identity Section */}
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            هوية النظام وتخصيص العلامة التجارية
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            قم بتخصيص مظهر النظام بالكامل، بما في ذلك التحكم الدقيق في الشعار
            والألوان.
          </p>
        </div>

        {/* Brand Identity & Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column: Basic Info & Layout */}
          <div className="space-y-6">
            {/* System Name Card */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                الاسم والعنوان (أساسي)
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="system-name"
                    className="block text-sm font-bold font-semibold text-slate-400 mb-1.5"
                  >
                    اسم النظام
                  </label>
                  <input
                    id="system-name"
                    type="text"
                    value={settings.system_name?.value || ""}
                    onChange={(e) => onUpdate("system_name", e.target.value)}
                    disabled={settings.system_name?.locked}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:border-indigo-500 transition-colors placeholder:text-slate-700 text-sm"
                    placeholder="مثال: شركة النيل للخرسانة الجاهزة"
                  />
                </div>
                <div>
                  <label
                    htmlFor="system-tagline"
                    className="block text-sm font-bold font-semibold text-slate-400 mb-1.5"
                  >
                    الوصف المختصر
                  </label>
                  <input
                    id="system-tagline"
                    type="text"
                    value={settings.system_tagline?.value || ""}
                    onChange={(e) => onUpdate("system_tagline", e.target.value)}
                    disabled={settings.system_tagline?.locked}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:border-indigo-500 transition-colors placeholder:text-slate-700 text-sm"
                    placeholder="مثال: نظام إدارة الإنتاج والجودة"
                  />
                </div>
              </div>
            </div>

            {/* Spacing & Layout Card */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="w-1 h-4 bg-teal-500 rounded-full" />
                أبعاد القائمة (Layout Space)
              </h3>
              <div className="space-y-4">
                {/* Padding Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="brand-padding-y"
                      className="text-sm font-bold font-semibold text-slate-300"
                    >
                      ارتفاع الهيدر (المساحة الحمراء)
                    </label>
                    <span className="text-sm font-bold bg-slate-800 text-teal-400 px-2 py-0.5 rounded font-mono">
                      {brandPaddingY}px
                    </span>
                  </div>
                  <input
                    id="brand-padding-y"
                    type="range"
                    min="10"
                    max="80"
                    step="2"
                    value={brandPaddingY}
                    onChange={(e) =>
                      handleNumberChange(
                        "brand_padding_y",
                        e.target.value,
                        10,
                        80,
                      )
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400"
                  />
                  <p className="text-sm font-bold text-slate-500">
                    يتحكم في الفراغ العلوي والسفلي لمنطقة الشعار في القائمة
                    الجانبية.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Logo Customization */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <span className="w-1 h-6 bg-purple-500 rounded-full" />
              تخصيص الشعار (Logo)
            </h3>

            {/* Live Preview Pane */}
            <div
              className="flex flex-col items-center justify-center p-8 bg-slate-950/50 border border-white/5 rounded-2xl min-w-[280px]"
              style={{ padding: `${parseInt(brandPaddingY) / 2}px 0` }}
            >
              <div className="relative mb-6 group cursor-default">
                {/* Shadow/Glow reflection */}
                <div
                  className={`absolute inset-0 blur-2xl opacity-40 transition-all duration-500 ${
                    logoType === "text"
                      ? settings.logo_bg?.value || "bg-indigo-500"
                      : "bg-transparent"
                  }`}
                />

                {/* The Actual Logo */}
                {logoType === "text" ? (
                  <div
                    className={`flex items-center justify-center text-white font-black shadow-2xl transition-all duration-300 relative z-10 ${
                      settings.logo_bg?.value ||
                      "bg-gradient-to-br from-indigo-500 to-violet-500"
                    }`}
                    style={{
                      width: `${logoSize}px`,
                      height: `${logoSize}px`,
                      borderRadius: `${logoRadius}px`,
                      fontSize: `${logoFontSize}px`,
                    }}
                  >
                    {settings.system_name?.value
                      ? settings.system_name.value.charAt(0).toUpperCase()
                      : "N"}
                  </div>
                ) : logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt="System Logo"
                    className="object-contain relative z-10"
                    style={{
                      width: `${logoSize}px`,
                      height: `${logoSize}px`,
                      borderRadius: `${logoRadius}px`, // Apply radius to image too
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl relative z-10"
                    style={{
                      width: `${logoSize}px`,
                      height: `${logoSize}px`,
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500 font-bold mb-1">
                معاينة حية
              </span>
              <p className="text-sm font-bold text-slate-600 text-center max-w-[200px]">
                هكذا سيظهر الشعار في القائمة الجانبية تماماً
              </p>
            </div>

            {/* Logo Type View Toggle */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-white/5">
              <button
                onClick={() => onUpdate("logo_type", "text")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  logoType === "text"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                حرف + خلفية
              </button>
              <button
                onClick={() => onUpdate("logo_type", "image")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  logoType === "image"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                رفع صورة
              </button>
            </div>

            {/* Conditional Content based on Logo Type */}
            {logoType === "text" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Color Presets */}
                <div className="space-y-3">
                  <label className="text-sm font-bold font-semibold text-slate-300">
                    لون الخلفية
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "bg-indigo-600",
                      "bg-blue-600",
                      "bg-emerald-600",
                      "bg-rose-600",
                      "bg-amber-600",
                      "bg-slate-800",
                      "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                      "bg-gradient-to-tr from-blue-600 to-cyan-500",
                      "bg-gradient-to-r from-orange-500 to-amber-500",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => onUpdate("logo_bg", preset)}
                        className={`w-8 h-8 rounded-lg shadow-lg ring-2 transition-all hover:scale-110 ${preset} ${
                          settings.logo_bg?.value === preset
                            ? "ring-white scale-110"
                            : "ring-transparent opacity-60 hover:opacity-100"
                        }`}
                        title="تطبيق هذا اللون"
                      />
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="logo-size"
                      className="text-sm font-bold text-slate-400 uppercase"
                    >
                      Size
                    </label>
                    <input
                      id="logo-size"
                      type="range"
                      min="40"
                      max="120"
                      step="4"
                      aria-label="Logo Size"
                      value={logoSize}
                      onChange={(e) =>
                        handleNumberChange("logo_size", e.target.value, 40, 120)
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="logo-radius"
                      className="text-sm font-bold text-slate-400 uppercase"
                    >
                      Radius
                    </label>
                    <input
                      id="logo-radius"
                      type="range"
                      min="0"
                      max="50"
                      step="2"
                      aria-label="Logo Radius"
                      value={logoRadius}
                      onChange={(e) =>
                        handleNumberChange("logo_radius", e.target.value, 0, 50)
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label
                      htmlFor="logo-font-size"
                      className="text-sm font-bold text-slate-400 uppercase"
                    >
                      Font Size
                    </label>
                    <input
                      id="logo-font-size"
                      type="range"
                      min="12"
                      max="60"
                      step="2"
                      aria-label="Logo Font Size"
                      value={logoFontSize}
                      onChange={(e) =>
                        handleNumberChange(
                          "logo_font_size",
                          e.target.value,
                          12,
                          60,
                        )
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-4 border border-dashed border-white/10 rounded-xl bg-slate-950/30 flex flex-col items-center justify-center text-center space-y-3">
                  {/* File Upload Input */}
                  <div className="space-y-2 w-full text-center">
                    <label className="block text-sm font-bold font-semibold text-slate-300 cursor-pointer hover:text-indigo-400 transition-colors">
                      <span className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-bold text-sm inline-block shadow-lg hover:bg-indigo-500 transition-all">
                        اختر صورة من جهازك
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Unlimited size (handled by server config)
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              onUpdate("logo_url", reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <p className="text-sm font-bold text-slate-500">
                      يفضل استخدام صورة مربعة ذات خلفية شفافة (PNG) بحجم غير
                      محدود.
                    </p>
                  </div>

                  {/* Logo Size Control for Image */}
                  <div className="space-y-2 w-full pt-4 border-t border-white/5 mt-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-bold text-slate-400 uppercase">
                        حجم الصورة
                      </label>
                      <span className="text-sm font-bold text-indigo-400">
                        {logoSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="150"
                      step="4"
                      value={logoSize}
                      onChange={(e) =>
                        handleNumberChange("logo_size", e.target.value, 40, 150)
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Sections (Collapsed/Simplified for now to focus on request) */}
      {/* Localization Section */}
      <div className="space-y-4 pt-4 border-t border-white/5 opacity-80 hover:opacity-100 transition-opacity">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.general.localization}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Default Language */}
          <div>
            <label
              htmlFor="default-language"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.general.default_language}
            </label>
            <select
              id="default-language"
              aria-label={dict.settings.system.general.default_language}
              value={settings.default_language?.value || "en"}
              onChange={(e) => onUpdate("default_language", e.target.value)}
              disabled={settings.default_language?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Default Timezone */}
          <div>
            <label
              htmlFor="default-timezone"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.general.default_timezone}
            </label>
            <select
              id="default-timezone"
              aria-label={dict.settings.system.general.default_timezone}
              value={settings.default_timezone?.value || "UTC"}
              onChange={(e) => onUpdate("default_timezone", e.target.value)}
              disabled={settings.default_timezone?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Riyadh">Asia/Riyadh</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label
              htmlFor="time-format"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.general.time_format}
            </label>
            <select
              id="time-format"
              aria-label={dict.settings.system.general.time_format}
              value={settings.time_format?.value || "24h"}
              onChange={(e) => onUpdate("time_format", e.target.value)}
              disabled={settings.time_format?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="12h">12 Hour</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4 pt-4 border-t border-white/5 opacity-80 hover:opacity-100 transition-opacity">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.general.contact}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support Email */}
          <div>
            <label
              htmlFor="support-email"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.general.support_email}
            </label>
            <input
              id="support-email"
              type="email"
              value={settings.support_email?.value || ""}
              onChange={(e) => onUpdate("support_email", e.target.value)}
              disabled={settings.support_email?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Maintenance Mode Allowed IPs */}
          <div>
            <label
              htmlFor="maintenance-ips"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              allowed_ips
            </label>
            <input
              id="maintenance-ips"
              type="text"
              value={settings.maintenance_mode_allowed_ips?.value || ""}
              placeholder="e.g. 192.168.1.1"
              onChange={(e) =>
                onUpdate("maintenance_mode_allowed_ips", e.target.value)
              }
              disabled={settings.maintenance_mode_allowed_ips?.locked}
              dir="ltr"
              lang="en"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-left"
            />
          </div>

          {/* Support Phone */}
          <div>
            <label
              htmlFor="support-phone"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.general.support_phone}
            </label>
            <input
              id="support-phone"
              type="tel"
              value={settings.support_phone?.value || ""}
              onChange={(e) => onUpdate("support_phone", e.target.value)}
              disabled={settings.support_phone?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
