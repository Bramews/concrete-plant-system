"use client";

import React, { useState } from "react";
import { useSystemDesign } from "@/ui/design-system/engine";
import { styles } from "@/ui/design-system/styles";
import { themes } from "@/ui/design-system/themes";
import { updateSystemSettings } from "@/app/actions/system-settings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, Factory, Building2 } from "lucide-react";

export default function AppearanceSettingsPage() {
  const { style, theme, setStyle, setTheme } = useSystemDesign();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSystemSettings({ style, theme });
      toast.success("تم تحديث مظهر النظام بنجاح");
    } catch (error) {
      toast.error("فشل في تحديث مظهر النظام");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            مظهر النظام
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            التحكم في الهوية البصرية الشاملة لجميع واجهات النظام
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-8 h-11 text-lg"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
          ) : (
            <Check className="w-5 h-5 ml-2" />
          )}
          حفظ التغييرات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Style Selection */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
            <Factory className="w-5 h-5" />
            فلسفة التصميم (Global Style)
          </h2>
          <div className="grid gap-4">
            {Object.keys(styles).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s as any)}
                className={`text-right p-4 rounded-[var(--radius-md)] border-2 transition-all ${
                  style === s
                    ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5"
                    : "border-[var(--color-border-main)] hover:border-[var(--color-border-subtle)] bg-[var(--color-bg-paper)]"
                }`}
              >
                <div className="font-bold text-lg text-[var(--color-text-primary)] capitalize">
                  {s.replace(/-/g, " ")}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {s === "dark-futuristic-neon" &&
                    "تصميم عصري متطور، ألوان النيون، حواف منحنية، وحركة ديناميكية."}
                  {s === "dark-industrial-utility" &&
                    "تصميم صناعي عملي، حواف حادة، تركيز على الكفاءة والوضوح."}
                  {s === "clean-enterprise" &&
                    "تصميم مؤسسي نظيف، مسافات واسعة، تباين متوازن، طابع احترافي هادئ."}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Theme Selection */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
            <Sparkles className="w-5 h-5" />
            سمات الألوان (Global Theme)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(themes).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t as any)}
                className={`p-4 rounded-[var(--radius-lg)] border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === t
                    ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5 shadow-[var(--elevation-sm)]"
                    : "border-[var(--color-border-main)] hover:border-[var(--color-border-subtle)] bg-[var(--color-bg-paper)]"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full shadow-inner"
                  style={{
                    background: `linear-gradient(45deg, ${themes[t as keyof typeof themes].primary[5]}, ${themes[t as keyof typeof themes].primary[7]})`,
                  }}
                />
                <div className="font-medium text-[var(--color-text-primary)] capitalize">
                  {t.replace(/-/g, " ")}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Preview Card */}
      <Card className="mt-8 border-[var(--color-border-main)] bg-[var(--color-bg-paper)] overflow-hidden shadow-[var(--elevation-md)]">
        <CardHeader className="border-b border-[var(--color-border-subtle)]">
          <CardTitle className="text-[var(--color-text-primary)]">
            معاينة مباشرة للواجهة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border-main)]">
              <div className="text-[var(--color-primary-500)] font-bold text-2xl">
                45.2 t
              </div>
              <div className="text-[var(--color-text-secondary)] text-sm">
                الإنتاج اليومي
              </div>
            </div>
            <div className="p-4 bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border-main)]">
              <div className="text-[var(--color-success-main)] font-bold text-2xl">
                98%
              </div>
              <div className="text-[var(--color-text-secondary)] text-sm">
                دقة الخلط
              </div>
            </div>
            <div className="p-4 bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border-main)]">
              <div className="text-[var(--color-error-main)] font-bold text-2xl">
                2
              </div>
              <div className="text-[var(--color-text-secondary)] text-sm">
                طلبات متوقفة
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="bg-[var(--color-primary-500)] text-white rounded-[var(--radius-sm)]">
              زر أساسي
            </Button>
            <Button
              variant="outline"
              className="border-[var(--color-border-main)] text-[var(--color-text-primary)] rounded-[var(--radius-sm)]"
            >
              زر فرعي
            </Button>
            <Button className="bg-[var(--color-success-main)] text-white rounded-[var(--radius-full)]">
              زر دائري
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
