"use client";

import { useState } from "react";
import { CompanyFinancialSettings, updateCompanyFinancialSettings } from "@/app/actions/finance";
import { saveCompanyStaffDepartments } from "@/app/actions/payroll-staff";
import { toast } from "sonner";
import {
  Coins,
  Percent,
  Calendar,
  FileText,
  Check,
  Loader2,
  Building2,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";

const DEFAULT_STAFF_DEPARTMENTS = [
  "خدمات عامة ونظافة",
  "استقبال وضيافة (Reception)",
  "حراسة وأمن البوابات",
  "حركة ونقل (سائقين)",
  "صيانة وميكانيك",
  "إنتاج وتشغيل",
  "مختبر وجودة",
  "إدارة ومبيعات",
  "مالية ومحاسبة",
  "مشتريات ومخازن",
];

interface Props {
  companyId: number;
  initialSettings: CompanyFinancialSettings;
  initialDepartments?: string[];
}

const POPULAR_CURRENCIES = [
  { code: "IQD", name: "دينار عراقي (IQD)", symbol: "د.ع" },
  { code: "SAR", name: "ريال سعودي (SAR)", symbol: "ر.س" },
  { code: "USD", name: "دولار أمريكي (USD)", symbol: "$" },
  { code: "AED", name: "درهم إماراتي (AED)", symbol: "د.إ" },
  { code: "EUR", name: "يورو أوروبي (EUR)", symbol: "€" },
  { code: "JOD", name: "دينار أردني (JOD)", symbol: "د.أ" },
  { code: "KWD", name: "دينار كويتي (KWD)", symbol: "د.ك" },
  { code: "QAR", name: "ريال قطري (QAR)", symbol: "ر.ق" },
  { code: "OMR", name: "ريال عماني (OMR)", symbol: "ر.ع" },
  { code: "BHD", name: "دينار بحريني (BHD)", symbol: "د.ب" },
  { code: "EGP", name: "جنيه مصري (EGP)", symbol: "ج.م" },
];

export function FinancialSettingsClient({
  companyId,
  initialSettings,
  initialDepartments = DEFAULT_STAFF_DEPARTMENTS,
}: Props) {
  const [settings, setSettings] = useState<CompanyFinancialSettings>(initialSettings);
  const [departments, setDepartments] = useState<string[]>(initialDepartments);
  const [newDept, setNewDept] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCurrencyToggle = (code: string) => {
    if (code === settings.currency) return; // Cannot disable default
    const exists = settings.supportedCurrencies.includes(code);
    const updated = exists
      ? settings.supportedCurrencies.filter((c) => c !== code)
      : [...settings.supportedCurrencies, code];
    setSettings({ ...settings, supportedCurrencies: updated });
  };

  const handleAddDepartment = () => {
    const trimmed = newDept.trim();
    if (!trimmed) {
      toast.error("يرجى كتابة اسم القسم أولاً");
      return;
    }
    if (departments.includes(trimmed)) {
      toast.error("هذا القسم مضاف مسبقاً");
      return;
    }
    setDepartments((prev) => [...prev, trimmed]);
    setNewDept("");
    toast.success(`تمت إضافة قسم (${trimmed}) - احفظ الإعدادات لتثبيته`);
  };

  const handleDeleteDepartment = (deptToDelete: string) => {
    if (departments.length <= 1) {
      toast.error("يجب إبقاء قسم واحد على الأقل في النظام");
      return;
    }
    setDepartments((prev) => prev.filter((d) => d !== deptToDelete));
    toast.success(`تم حذف قسم (${deptToDelete}) - احفظ الإعدادات لتثبيته`);
  };

  const handleResetDepartments = () => {
    setDepartments(DEFAULT_STAFF_DEPARTMENTS);
    toast.info("تمت استعادة قائمة الأقسام الافتراضية");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      // Ensure default currency is always in supported
      const supported = Array.from(
        new Set([settings.currency, ...settings.supportedCurrencies]),
      );

      await Promise.all([
        updateCompanyFinancialSettings(companyId, {
          ...settings,
          supportedCurrencies: supported,
        }),
        saveCompanyStaffDepartments(companyId, departments),
      ]);

      toast.success("تم حفظ كافة الإعدادات والأقسام بنجاح");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-fade-in max-w-4xl">
      {/* Default Currency Selection */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">العملة الأساسية للشركة</h3>
            <p className="text-xs text-slate-400 font-bold">
              العملة الرسمية التي تُسجل بها الفواتير، المصروفات، الرواتب والتقارير المالية
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {POPULAR_CURRENCIES.map((curr) => {
            const isSelected = settings.currency === curr.code;
            return (
              <button
                type="button"
                key={curr.code}
                onClick={() => {
                  const sup = Array.from(new Set([...settings.supportedCurrencies, curr.code]));
                  setSettings({ ...settings, currency: curr.code, supportedCurrencies: sup });
                }}
                className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/10"
                    : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05] hover:border-white/10"
                }`}
              >
                <div>
                  <div className="font-black text-sm">{curr.name}</div>
                  <div className="text-xs font-mono text-slate-500">{curr.symbol}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff & Employee Departments Management */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">أقسام وتصنيفات الكادر والموظفين</h3>
              <p className="text-xs text-slate-400 font-bold">
                إدارة الأقسام المعتمدة في الشركة (إضافة، تعديل، وحذف) وتظهر في نوافذ الكادر والرواتب
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDepartments}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضيات</span>
          </button>
        </div>

        {/* Add Department Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDepartment();
              }
            }}
            placeholder="اكتب اسم قسم جديد (مثال: أمن وسلامة، صيانة مضخات، مشتريات...)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
          />
          <button
            type="button"
            onClick={handleAddDepartment}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قسم</span>
          </button>
        </div>

        {/* Departments List Chips */}
        <div className="space-y-2">
          <div className="text-xs font-black text-slate-400">
            الأقسام المعتمدة حالياً ({departments.length}):
          </div>
          <div className="flex flex-wrap gap-2.5">
            {departments.map((dept) => (
              <div
                key={dept}
                className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 group hover:border-indigo-500/40 transition-all"
              >
                <span>{dept}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteDepartment(dept)}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title={`حذف قسم ${dept}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tax, Credit Terms, and Invoicing Rules */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">قواعد الفوترة والائتمان والضرائب</h3>
            <p className="text-xs text-slate-400 font-bold">
              تحديد الشروط الافتراضية للفواتير الجديدة وفترات الاستحقاق
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5" />
              نسبة الضريبة الافتراضية (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.taxRate}
              onChange={(e) =>
                setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 ring-blue-500/20 transition-all font-mono"
            />
            <span className="text-[10px] text-slate-500">أدخل 0 إذا كانت المبيعات معفاة من الضريبة</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              فترة الائتمان والاستحقاق (أيام)
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={settings.paymentTermsDays}
              onChange={(e) =>
                setSettings({ ...settings, paymentTermsDays: parseInt(e.target.value) || 30 })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 ring-blue-500/20 transition-all font-mono"
            />
            <span className="text-[10px] text-slate-500">عدد الأيام قبل اعتبار الفاتورة متأخرة (Overdue)</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              بادئة ترقيم الفواتير
            </label>
            <input
              type="text"
              value={settings.invoicePrefix}
              onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 ring-blue-500/20 transition-all font-mono uppercase"
            />
            <span className="text-[10px] text-slate-500">مثال: INV- أو FACT- أو فاتورة-</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
              تم الحفظ بنجاح
            </>
          ) : (
            "حفظ الإعدادات المالية"
          )}
        </button>
      </div>
    </form>
  );
}
