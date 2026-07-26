"use client";

import { useState, useTransition } from "react";
import {
  LandingPageConfig,
  updateLandingPageConfig,
} from "@/app/actions/landing-page";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { toast } from "sonner";
import { Dictionary } from "@/lib/dictionary";

export function LandingPageForm({
  startConfig,
  dict,
}: {
  startConfig: LandingPageConfig;
  dict: Dictionary["landing"];
}) {
  const [config, setConfig] = useState<LandingPageConfig>(startConfig);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (field: keyof LandingPageConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...config.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setConfig((prev) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setConfig((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          icon: "Activity",
          titleAr: "عنوان جديد",
          titleEn: "New Title",
          descriptionAr: "وصف",
          descriptionEn: "Description",
        },
      ],
    }));
  };

  const removeFeature = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const save = () => {
    startTransition(async () => {
      await updateLandingPageConfig(config);
      router.refresh();
      toast.success(
        <div className="flex flex-col gap-1" dir="rtl">
          <span className="font-bold text-lg">{dict.success_message}</span>
        </div>,
      );
    });
  };

  const iconOptions = Object.keys(Icons).filter((k) => k !== "Spinner"); // Basic filter

  return (
    <div className="space-y-8 text-slate-200" dir="rtl">
      {/* Hero Section */}
      <section className="space-y-4 border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold text-indigo-400">
          {dict.hero_section}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={dict.hero_title_ar}
            value={config.heroTitleAr}
            onChange={(v) => handleChange("heroTitleAr", v)}
          />
          <Input
            label={dict.hero_title_en}
            value={config.heroTitleEn}
            onChange={(v) => handleChange("heroTitleEn", v)}
            dir="ltr"
          />
          <TextArea
            label={dict.hero_subtitle_ar}
            value={config.heroSubtitleAr}
            onChange={(v) => handleChange("heroSubtitleAr", v)}
          />
          <TextArea
            label={dict.hero_subtitle_en}
            value={config.heroSubtitleEn}
            onChange={(v) => handleChange("heroSubtitleEn", v)}
            dir="ltr"
          />
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4 border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold text-indigo-400">{dict.buttons}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={dict.cta_text_ar}
            value={config.ctaTextAr}
            onChange={(v) => handleChange("ctaTextAr", v)}
          />
          <Input
            label={dict.cta_text_en}
            value={config.ctaTextEn}
            onChange={(v) => handleChange("ctaTextEn", v)}
            dir="ltr"
          />
          <Input
            label={dict.login_text_ar}
            value={config.loginTextAr}
            onChange={(v) => handleChange("loginTextAr", v)}
          />
          <Input
            label={dict.login_text_en}
            value={config.loginTextEn}
            onChange={(v) => handleChange("loginTextEn", v)}
            dir="ltr"
          />
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-indigo-400">{dict.features}</h2>
          <button
            onClick={addFeature}
            className="px-3 py-1 bg-indigo-600 rounded text-sm hover:bg-indigo-500"
          >
            + {dict.add_feature}
          </button>
        </div>

        <div className="space-y-4">
          {config.features.map((feat, i) => (
            <div
              key={i}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-bold text-slate-400">
                  {dict.feature_n}
                  {i + 1}
                </h3>
                <button
                  onClick={() => removeFeature(i)}
                  className="text-red-400 hover:text-red-300"
                >
                  {dict.remove}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">
                    {dict.icon}
                  </label>
                  <select
                    title="Icon Selection"
                    className="w-full bg-slate-800 border-white/20 rounded p-2 text-sm"
                    value={feat.icon}
                    onChange={(e) =>
                      handleFeatureChange(i, "icon", e.target.value)
                    }
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label={dict.title_ar}
                  value={feat.titleAr}
                  onChange={(v) => handleFeatureChange(i, "titleAr", v)}
                />
                <Input
                  label={dict.title_en}
                  value={feat.titleEn}
                  onChange={(v) => handleFeatureChange(i, "titleEn", v)}
                  dir="ltr"
                />
                <Input
                  label={dict.description_ar}
                  value={feat.descriptionAr}
                  onChange={(v) => handleFeatureChange(i, "descriptionAr", v)}
                />
                <Input
                  label={dict.description_en}
                  value={feat.descriptionEn}
                  onChange={(v) => handleFeatureChange(i, "descriptionEn", v)}
                  dir="ltr"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Header Settings */}
      <section className="space-y-4 border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold text-indigo-400">
          {dict.header_settings}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={dict.logo_text_ar}
            value={config.headerLogoTextAr || ""}
            onChange={(v) => handleChange("headerLogoTextAr", v)}
          />
          <Input
            label={dict.logo_text_en}
            value={config.headerLogoTextEn || ""}
            onChange={(v) => handleChange("headerLogoTextEn", v)}
            dir="ltr"
          />
        </div>
      </section>

      {/* Design Settings */}
      <section className="space-y-4 border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold text-indigo-400">
          {dict.style_settings}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">
              {dict.background_style}
            </label>
            <select
              title="Background Style"
              className="w-full bg-slate-800 border-white/20 rounded p-2 text-sm text-slate-200"
              value={config.backgroundStyle || "blob"}
              onChange={(e) => handleChange("backgroundStyle", e.target.value)}
            >
              <option value="blob">{dict.style_blob}</option>
              <option value="mesh">{dict.style_mesh}</option>
              <option value="solid">{dict.style_solid}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">
              {dict.primary_color}
            </label>
            <select
              title="Primary Color"
              className="w-full bg-slate-800 border-white/20 rounded p-2 text-sm text-slate-200"
              value={config.primaryColor || "indigo"}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
            >
              <option value="indigo">{dict.color_indigo}</option>
              <option value="blue">{dict.color_blue}</option>
              <option value="rose">{dict.color_rose}</option>
              <option value="emerald">{dict.color_emerald}</option>
              <option value="violet">{dict.color_violet}</option>
              <option value="cyan">{dict.color_cyan}</option>
            </select>
          </div>
        </div>
      </section>

      <div className="pt-6 border-t border-white/10">
        <button
          onClick={save}
          disabled={isPending}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? dict.saving : dict.save_changes}
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        title={label}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-white/10 rounded p-2 text-sm focus:border-indigo-500 outline-none"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-500 mb-1">
        {label}
      </label>
      <textarea
        dir={dir}
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-white/10 rounded p-2 text-sm focus:border-indigo-500 outline-none min-h-[80px]"
      />
    </div>
  );
}
