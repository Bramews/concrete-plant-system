"use client";

import { useState } from "react";
import { toast } from "sonner";
// We need to import the server action.
// Note: In Next.js, importing server actions directly into client components is supported.
import { saveLabPreference } from "@/app/actions/lab/standards";

interface Standard {
  id: string;
  code: string;
  name: string;
  organization: string;
  description: string | null;
}

interface TestMethod {
  id: string;
  code: string;
  name: string;
  unit?: string | null;
  standard: Standard;
}

interface LabStandardsManagerProps {
  standards: Standard[];
  testMethods: TestMethod[];
  preferences: Record<string, string>; // { "COMPRESSIVE_STRENGTH": "ASTM_C39" }
}

export function LabStandardsManager({
  testMethods,
  preferences,
}: LabStandardsManagerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPrefs, setCurrentPrefs] = useState(preferences);

  // Group methods by code (e.g., all COMPRESSIVE_STRENGTH methods from different standards)
  // Actually, TestMethod table links to Standard.
  // We want to list: "Compressive Strength" -> Dropdown of [ASTM C39, BS 1881, ...]

  // 1. Identify unique Test Codes available in the system
  const uniqueTestCodes = Array.from(new Set(testMethods.map((tm) => tm.code)));

  const handlePreferenceChange = async (
    testCode: string,
    standardCode: string,
  ) => {
    setLoading(testCode);
    try {
      const result = await saveLabPreference(testCode, standardCode);
      if (result.success) {
        setCurrentPrefs((prev) => ({ ...prev, [testCode]: standardCode }));
        toast.success("تم تحديث تفضيل المواصفة");
      }
    } catch {
      toast.error("فشل تحديث التفضيل");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {uniqueTestCodes.map((testCode) => {
        // Find all standards that support this test code
        const availableMethods = testMethods.filter(
          (tm) => tm.code === testCode,
        );
        const displayName = availableMethods[0]?.name || testCode;

        const currentStandardCode = currentPrefs[testCode];

        // Find the method currently selected to show details
        const selectedMethod = availableMethods.find(
          (m) => m.standard.code === currentStandardCode,
        );

        return (
          <div
            key={testCode}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-2">{displayName}</h3>
            <p className="text-sm text-slate-400 mb-4">
              حدد المواصفة الحاكمة لاختبارات {displayName}.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-bold font-medium text-slate-500 uppercase tracking-wider">
                  المواصفة النشطة
                </label>
                <select
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full"
                  value={currentStandardCode || ""}
                  onChange={(e) =>
                    handlePreferenceChange(testCode, e.target.value)
                  }
                  disabled={!!loading}
                  aria-label="Select Standard"
                >
                  <option value="" disabled>
                    اختر مواصفة...
                  </option>
                  {availableMethods.map((method) => (
                    <option key={method.id} value={method.standard.code}>
                      {method.standard.code} - {method.standard.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMethod && (
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-300">
                        مواصفة {selectedMethod.standard.organization} نشطة
                      </p>
                      <p className="text-sm font-bold text-indigo-400/80 mt-1">
                        {selectedMethod.standard.description}
                      </p>
                      <p className="text-sm font-bold text-slate-500 mt-2">
                        الوحدة: {selectedMethod.unit || "غير متوفر"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {uniqueTestCodes.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          لم يتم تعريف طرق اختبار. قم بتشغيل سكربت الإضافة
        </div>
      )}
    </div>
  );
}
