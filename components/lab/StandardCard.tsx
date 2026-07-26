"use client";

import { useState } from "react";
import {
  AppCard,
  StatusBadge,
  ActionButton,
} from "@/components/ui/IndustrialComponents";
import {
  toggleStandardStatus,
  updateTestMethodLimits,
} from "@/app/actions/lab-standards";
import { toast } from "sonner";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { BidiText } from "@/components/ui/BidiText";

interface TestMethod {
  id: string;
  name: string;
  code: string;
  unit: string | null;
  warningMin: number | null;
  warningMax: number | null;
  rejectMin: number | null;
  rejectMax: number | null;
}

interface LabStandard {
  id: string;
  code: string;
  name: string;
  organization: string;
  description: string | null;
  isActive: boolean;
  testMethods: TestMethod[];
}

interface StandardCardProps {
  standard: LabStandard;
}

export function StandardCard({ standard }: StandardCardProps) {
  const [isActive, setIsActive] = useState(standard.isActive);
  const [isToggling, setIsToggling] = useState(false);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [limits, setLimits] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    const newStatus = !isActive;
    try {
      const result = await toggleStandardStatus(standard.id, newStatus);
      if (result.success) {
        setIsActive(newStatus);
        toast.success(
          newStatus
            ? "تم تفعيل المواصفة بنجاح"
            : "تم إلغاء تفعيل المواصفة بنجاح",
        );
      } else {
        toast.error("فشل تحديث الحالة");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsToggling(false);
    }
  };

  const startEditing = (method: TestMethod) => {
    setEditingMethod(method.id);
    setLimits({
      warningMin: method.warningMin,
      warningMax: method.warningMax,
      rejectMin: method.rejectMin,
      rejectMax: method.rejectMax,
    });
  };

  const saveLimits = async (methodId: string) => {
    setIsSaving(true);
    try {
      // Convert empty strings to null
      const cleanLimits = Object.fromEntries(
        Object.entries(limits).map(([k, v]) => [
          k,
          v === "" ? null : Number(v),
        ]),
      );

      const result = await updateTestMethodLimits(methodId, cleanLimits);
      if (result.success) {
        toast.success("تم تحديث الحدود بنجاح");
        setEditingMethod(null);
        window.location.reload(); // Simple reload for now to get fresh data
      } else {
        toast.error("فشل حفظ الحدود");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppCard
      title={`${standard.code} - ${standard.organization}`}
      subtitle={standard.name}
      headerAction={
        <div className="flex items-center gap-3">
          <StatusBadge
            status={isActive ? "active" : "read-only"}
            label={isActive ? "نشط" : "غير نشط"}
          />
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
              ${isActive ? "bg-emerald-500" : "bg-slate-200"}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isActive ? "translate-x-6" : "translate-x-1"}
              `}
            />
          </button>
        </div>
      }
      className={isActive ? "border-l-4 border-l-emerald-500" : "opacity-75"}
    >
      <div className="space-y-6 text-right">
        {standard.description && (
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
            {standard.description}
          </p>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider">
            طرق الفحص والحدود القياسية
          </h4>

          <div className="grid gap-4">
            {standard.testMethods.map((method) => (
              <div
                key={method.id}
                className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between mb-4 flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span className="font-bold text-slate-800">
                      {method.name}
                    </span>
                    <span className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                      {method.code}
                    </span>
                  </div>
                  {editingMethod === method.id ? (
                    <div className="flex gap-2">
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMethod(null)}
                        disabled={isSaving}
                      >
                        إلغاء
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        onClick={() => saveLimits(method.id)}
                        isLoading={isSaving}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        حفظ
                      </ActionButton>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(method)}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      تعديل الحدود
                    </button>
                  )}
                </div>

                {editingMethod === method.id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">
                        الحد الأدنى للتحذير
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        step="0.1"
                        className="w-full text-sm border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 text-center font-mono"
                        value={limits.warningMin ?? ""}
                        onChange={(e) =>
                          setLimits({ ...limits, warningMin: e.target.value })
                        }
                        placeholder="لا يوجد"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">
                        الحد الأقصى للتحذير
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        step="0.1"
                        className="w-full text-sm border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 text-center font-mono"
                        value={limits.warningMax ?? ""}
                        onChange={(e) =>
                          setLimits({ ...limits, warningMax: e.target.value })
                        }
                        placeholder="لا يوجد"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-rose-600">
                        الحد الأدنى للرفض
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        step="0.1"
                        className="w-full text-sm border-rose-200 rounded focus:ring-rose-500 focus:border-rose-500 bg-rose-50/50 text-center font-mono"
                        value={limits.rejectMin ?? ""}
                        onChange={(e) =>
                          setLimits({ ...limits, rejectMin: e.target.value })
                        }
                        placeholder="لا يوجد"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-rose-600">
                        الحد الأقصى للرفض
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        step="0.1"
                        className="w-full text-sm border-rose-200 rounded focus:ring-rose-500 focus:border-rose-500 bg-rose-50/50 text-center font-mono"
                        value={limits.rejectMax ?? ""}
                        onChange={(e) =>
                          setLimits({ ...limits, rejectMax: e.target.value })
                        }
                        placeholder="لا يوجد"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-right">
                    <LimitDisplay
                      label="الحد الأدنى للتحذير"
                      value={method.warningMin}
                      unit={method.unit}
                    />
                    <LimitDisplay
                      label="الحد الأقصى للتحذير"
                      value={method.warningMax}
                      unit={method.unit}
                    />
                    <LimitDisplay
                      label="الحد الأدنى للرفض"
                      value={method.rejectMin}
                      unit={method.unit}
                      color="text-rose-600"
                    />
                    <LimitDisplay
                      label="الحد الأقصى للرفض"
                      value={method.rejectMax}
                      unit={method.unit}
                      color="text-rose-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppCard>
  );
}

function LimitDisplay({
  label,
  value,
  unit,
  color = "text-slate-600",
}: {
  label: string;
  value: number | null;
  unit: string | null;
  color?: string;
}) {
  return (
    <div className="space-y-0.5">
      <span className="block text-xs font-bold uppercase text-slate-400">
        {label}
      </span>
      <span
        className={`font-mono font-bold ${value === null ? "text-slate-300 italic" : color}`}
      >
        {value === null ? (
          "لا يوجد"
        ) : (
          <>
            <BidiText>{value}</BidiText> {unit || ""}
          </>
        )}
      </span>
    </div>
  );
}
