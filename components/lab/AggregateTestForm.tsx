"use client";

import { useState, useEffect } from "react";
import { ActionButton } from "@/components/ui/IndustrialComponents";
import { submitAggregateTest } from "@/app/actions/lab-aggregates";
import { toast } from "sonner";
import { Save, Calculator, AlertTriangle, CheckCircle } from "lucide-react";
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

interface Material {
  id: number;
  name: string;
  code: string | null;
}

interface AggregateTestFormProps {
  material: Material;
  method: TestMethod;
  onSuccess: () => void;
}

export function AggregateTestForm({
  material,
  method,
  onSuccess,
}: AggregateTestFormProps) {
  const [loading, setLoading] = useState(false);

  // State for Moisture Content Inputs
  const [containerWeight, setContainerWeight] = useState<string>("");
  const [wetWeight, setWetWeight] = useState<string>("");
  const [dryWeight, setDryWeight] = useState<string>("");

  // State for Pycnometer & Absorption (ASTM C127/C128)
  const [pycDrySample, setPycDrySample] = useState<string>(""); // A
  const [pycSsdSample, setPycSsdSample] = useState<string>(""); // S
  const [pycWater, setPycWater] = useState<string>(""); // B
  const [pycSampleWater, setPycSampleWater] = useState<string>(""); // C

  // State for Generic Input
  const [genericValue, setGenericValue] = useState<string>("");

  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [calculatedAbsorption, setCalculatedAbsorption] = useState<
    number | null
  >(null);
  const [absorptionWarning, setAbsorptionWarning] = useState<string | null>(
    null,
  );

  // State for Bulk Density & Voids (ASTM C29)
  const [bulkContainerVolume, setBulkContainerVolume] = useState<string>("");
  const [bulkContainerWeight, setBulkContainerWeight] = useState<string>("");
  const [bulkWeightLoose, setBulkWeightLoose] = useState<string>("");
  const [bulkWeightCompact, setBulkWeightCompact] = useState<string>("");
  const [bulkSpecificGravity, setBulkSpecificGravity] =
    useState<string>("2.65");
  const [calculatedBulkStats, setCalculatedBulkStats] = useState<any>(null);

  const isGravel =
    material.name.includes("حصى") ||
    material.name.toLowerCase().includes("gravel") ||
    material.name.includes("خشن");

  // Effect to calculate moisture or specific gravity automatically
  useEffect(() => {
    if (method.code === "MOISTURE" || method.code.includes("C566")) {
      const Wc = Number(containerWeight);
      const Ww = Number(wetWeight);
      const Wd = Number(dryWeight);

      if (Wc > 0 && Ww > Wd && Wd > Wc) {
        const waterMass = Ww - Wd;
        const dryMass = Wd - Wc;
        const moisture = (waterMass / dryMass) * 100;
        setCalculatedValue(Number(moisture.toFixed(2)));
      } else {
        setCalculatedValue(null);
      }
    } else if (
      method.code === "SPECIFIC_GRAVITY" ||
      method.code === "ABSORPTION" ||
      method.code.includes("C127") ||
      method.code.includes("C128")
    ) {
      const A = Number(pycDrySample);
      const S = Number(pycSsdSample);
      const B = Number(pycWater);
      const C = Number(pycSampleWater);

      if (A > 0 && S >= A && B > 0 && C > 0) {
        // Specific Gravity (SSD) = S / (B + S - C)
        const sgSsd = S / (B + S - C);
        // Absorption (%) = ((S - A) / A) * 100
        const abs = ((S - A) / A) * 100;

        setCalculatedValue(Number(sgSsd.toFixed(3)));
        setCalculatedAbsorption(Number(abs.toFixed(2)));

        // Warning limits: > 3% for gravel, > 5% for sand
        if (isGravel && abs > 3) {
          setAbsorptionWarning(
            "تحذير: نسبة الامتصاص للركام الخشن (الحصى) تجاوزت الحد المسموح به (3%) وفقاً لمواصفة ASTM C127.",
          );
        } else if (!isGravel && abs > 5) {
          setAbsorptionWarning(
            "تحذير: نسبة الامتصاص للركام الناعم (الرمل) تجاوزت الحد المسموح به (5%) وفقاً لمواصفة ASTM C128.",
          );
        } else {
          setAbsorptionWarning(null);
        }
      } else {
        setCalculatedValue(null);
        setCalculatedAbsorption(null);
        setAbsorptionWarning(null);
      }
    } else if (method.code === "BULK_DENSITY" || method.code.includes("C29")) {
      const V = Number(bulkContainerVolume); // in Liters
      const Wm = Number(bulkContainerWeight); // in kg
      const Wl = Number(bulkWeightLoose); // in kg
      const Wc = Number(bulkWeightCompact); // in kg
      const SG = Number(bulkSpecificGravity) || 2.65; // Specific Gravity SSD

      if (V > 0 && Wm > 0 && Wl > Wm) {
        const dLoose = (Wl - Wm) / V; // kg/L
        const dCompact = Wc > Wm ? (Wc - Wm) / V : null; // kg/L

        const vLoose = (1 - dLoose / SG) * 100;
        const vCompact = dCompact ? (1 - dCompact / SG) * 100 : null;

        const primaryVal = dCompact ? dCompact * 1000 : dLoose * 1000; // in kg/m³
        setCalculatedValue(Number(primaryVal.toFixed(1)));

        setCalculatedBulkStats({
          looseDensity: Number((dLoose * 1000).toFixed(1)), // kg/m³
          compactDensity: dCompact
            ? Number((dCompact * 1000).toFixed(1))
            : null, // kg/m³
          looseVoids: Number(vLoose.toFixed(2)),
          compactVoids: vCompact ? Number(vCompact.toFixed(2)) : null,
        });
      } else {
        setCalculatedValue(null);
        setCalculatedBulkStats(null);
      }
    }
  }, [
    containerWeight,
    wetWeight,
    dryWeight,
    pycDrySample,
    pycSsdSample,
    pycWater,
    pycSampleWater,
    bulkContainerVolume,
    bulkContainerWeight,
    bulkWeightLoose,
    bulkWeightCompact,
    bulkSpecificGravity,
    method.code,
    isGravel,
  ]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let finalValue = 0;
      let readings = {};
      let notes = "";

      if (method.code === "MOISTURE" || method.code.includes("C566")) {
        if (calculatedValue === null) {
          toast.error("حسابات غير صالحة");
          setLoading(false);
          return;
        }
        finalValue = calculatedValue;
        readings = {
          containerWeight: Number(containerWeight),
          wetWeight: Number(wetWeight),
          dryWeight: Number(dryWeight),
        };
        notes = `تم الحساب تلقائياً للرطوبة الطبيعية. تأثير الخلطة: قلل ماء الخلط بمقدار ${calculatedValue}% من وزن ركام ${material.name}`;
      } else if (
        method.code === "SPECIFIC_GRAVITY" ||
        method.code === "ABSORPTION" ||
        method.code.includes("C127") ||
        method.code.includes("C128")
      ) {
        if (calculatedValue === null || calculatedAbsorption === null) {
          toast.error("حسابات غير صالحة");
          setLoading(false);
          return;
        }
        finalValue =
          method.code === "SPECIFIC_GRAVITY"
            ? calculatedValue
            : calculatedAbsorption;
        readings = {
          drySampleWeight: Number(pycDrySample),
          ssdSampleWeight: Number(pycSsdSample),
          pycWaterWeight: Number(pycWater),
          pycSampleWaterWeight: Number(pycSampleWater),
          specificGravitySsd: calculatedValue,
          absorptionPercent: calculatedAbsorption,
        };
        notes = `فحص البيكنوميتر والامتصاص (ASTM C127/C128). الكثافة (SSD): ${calculatedValue}، نسبة الامتصاص: ${calculatedAbsorption}%`;
        if (absorptionWarning) {
          notes += ` | ${absorptionWarning}`;
        }
      } else if (
        method.code === "BULK_DENSITY" ||
        method.code.includes("C29")
      ) {
        if (calculatedValue === null || !calculatedBulkStats) {
          toast.error("حسابات غير صالحة");
          setLoading(false);
          return;
        }
        finalValue = calculatedValue;
        readings = {
          containerVolume: Number(bulkContainerVolume),
          containerWeight: Number(bulkContainerWeight),
          weightLoose: Number(bulkWeightLoose),
          weightCompact: Number(bulkWeightCompact),
          specificGravity: Number(bulkSpecificGravity),
          ...calculatedBulkStats,
        };
        notes = `فحص الكثافة الرص وفراغات الركام (ASTM C29). كثافة الرص: ${calculatedBulkStats.compactDensity || calculatedBulkStats.looseDensity} كغم/م³، فراغات الرص: ${calculatedBulkStats.compactVoids || calculatedBulkStats.looseVoids}%`;
      } else {
        finalValue = Number(genericValue);
        readings = { value: finalValue };
      }

      const result = await submitAggregateTest(
        material.id,
        method.id,
        finalValue,
        readings,
        notes,
      );

      if (result.success) {
        toast.success(
          `تم حفظ النتيجة بنجاح: ${result.result === "PASS" ? "مقبول ✅" : result.result === "WARNING" ? "تحذير ⚠️" : "مرفوض ❌"}`,
        );
        onSuccess();
        // Reset forms
        setContainerWeight("");
        setWetWeight("");
        setDryWeight("");
        setPycDrySample("");
        setPycSsdSample("");
        setPycWater("");
        setPycSampleWater("");
        setGenericValue("");
        setCalculatedValue(null);
        setCalculatedAbsorption(null);
        setAbsorptionWarning(null);
      } else {
        toast.error("فشل في حفظ الفحص");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  // 1. Moisture form
  if (method.code === "MOISTURE" || method.code.includes("C566")) {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-indigo-400 tracking-wider">
              حساب نسبة الرطوبة (Moisture Calculation)
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-400 font-mono mb-4">
            Formula: ((Wet - Dry) / (Dry - Container)) * 100
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                وزن الوعاء (جرام)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={containerWeight}
                onChange={(e) => setContainerWeight(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                الوعاء + العينة الرطبة
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={wetWeight}
                onChange={(e) => setWetWeight(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                الوعاء + العينة الجافة
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={dryWeight}
                onChange={(e) => setDryWeight(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-white/5">
          <span className="text-sm font-bold text-slate-300">
            نسبة الرطوبة الناتجة:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-white">
              {calculatedValue !== null ? (
                <BidiText>{calculatedValue}</BidiText>
              ) : (
                "--.-"
              )}
            </span>
            <span className="text-xs font-bold text-slate-400">%</span>
          </div>
        </div>

        {calculatedValue !== null && (
          <div className="bg-blue-950/20 border border-blue-500/10 p-3 rounded-lg text-xs font-bold text-blue-400 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              تأثير الرطوبة: يجب تقليل ماء الخلط بمقدار{" "}
              <BidiText>{calculatedValue}</BidiText>% من الوزن الكلي للركام (
              {material.name}) في تصميم الخلطة لتعويض المياه الحرة.
            </p>
          </div>
        )}

        <ActionButton
          className="w-full"
          onClick={handleSubmit}
          isLoading={loading}
          disabled={calculatedValue === null}
        >
          <Save className="w-4 h-4 ml-2" />
          حفظ نتيجة فحص الرطوبة
        </ActionButton>
      </div>
    );
  }

  // 2. Pycnometer Specific Gravity & Absorption form
  if (
    method.code === "SPECIFIC_GRAVITY" ||
    method.code === "ABSORPTION" ||
    method.code.includes("C127") ||
    method.code.includes("C128")
  ) {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-indigo-400 tracking-wider">
              فحص البيكنوميتر والامتصاص (ASTM C127/C128)
            </h4>
          </div>
          <p className="text-xs text-slate-400 font-bold mb-4">
            المواد المحددة:{" "}
            <span className="text-indigo-400 font-extrabold">
              {material.name}
            </span>{" "}
            ({isGravel ? "ركام خشن - حصى" : "ركام ناعم - رمل"})
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                وزن العينة جافة تماماً (A) (جرام)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={pycDrySample}
                onChange={(e) => setPycDrySample(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                وزن العينة مشبعة جافة السطح (S) (جرام)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={pycSsdSample}
                onChange={(e) => setPycSsdSample(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                وزن البيكنوميتر مملوء بالماء (B) (جرام)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={pycWater}
                onChange={(e) => setPycWater(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                وزن البيكنوميتر + العينة SSD + الماء (C)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={pycSampleWater}
                onChange={(e) => setPycSampleWater(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400">
              الكثافة النوعية (SG SSD):
            </span>
            <span className="text-lg font-black font-mono text-white mt-1 text-left">
              {calculatedValue !== null ? (
                <BidiText>{calculatedValue}</BidiText>
              ) : (
                "---"
              )}
            </span>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400">
              نسبة الامتصاص (Absorption):
            </span>
            <span className="text-lg font-black font-mono text-white mt-1 text-left">
              {calculatedAbsorption !== null ? (
                <BidiText>{calculatedAbsorption}%</BidiText>
              ) : (
                "---"
              )}
            </span>
          </div>
        </div>

        {absorptionWarning && (
          <div className="bg-amber-950/20 border border-amber-500/10 p-3 rounded-lg text-xs font-bold text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{absorptionWarning}</p>
          </div>
        )}

        <ActionButton
          className="w-full"
          onClick={handleSubmit}
          isLoading={loading}
          disabled={calculatedValue === null}
        >
          <Save className="w-4 h-4 ml-2" />
          حفظ نتائج البيكنوميتر والامتصاص
        </ActionButton>
      </div>
    );
  }

  // 3. Bulk Density & Voids form (ASTM C29)
  if (method.code === "BULK_DENSITY" || method.code.includes("C29")) {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-indigo-400 tracking-wider">
              فحص الكثافة الرصّ والفضفاض وفراغات الركام (ASTM C29)
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-4">
            المادة:{" "}
            <span className="text-indigo-400 font-extrabold">
              {material.name}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                حجم الوعاء القياسي (لتر)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={bulkContainerVolume}
                onChange={(e) => setBulkContainerVolume(e.target.value)}
                placeholder="10.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                وزن الوعاء فارغاً (كجم)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={bulkContainerWeight}
                onChange={(e) => setBulkContainerWeight(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                الوعاء + الركام الفضفاض (كجم)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={bulkWeightLoose}
                onChange={(e) => setBulkWeightLoose(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                الوعاء + الركام المرصوص (كجم)
              </label>
              <input
                type="number"
                dir="ltr"
                className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
                value={bulkWeightCompact}
                onChange={(e) => setBulkWeightCompact(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">
              الوزن النوعي للركام (SG SSD) لحساب الفراغات
            </label>
            <input
              type="number"
              dir="ltr"
              className="w-full text-sm p-2 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono"
              value={bulkSpecificGravity}
              onChange={(e) => setBulkSpecificGravity(e.target.value)}
              placeholder="2.65"
            />
          </div>
        </div>

        {calculatedBulkStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                الكثافة الفضفاضة (Loose)
              </span>
              <span className="text-sm font-black font-mono text-white block text-left">
                <BidiText>{calculatedBulkStats.looseDensity}</BidiText> kg/m³
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                الفراغات: <BidiText>{calculatedBulkStats.looseVoids}</BidiText>%
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                الكثافة المرصوصة (Rodded)
              </span>
              <span className="text-sm font-black font-mono text-white block text-left">
                {calculatedBulkStats.compactDensity !== null ? (
                  <>
                    <BidiText>{calculatedBulkStats.compactDensity}</BidiText>{" "}
                    kg/m³
                  </>
                ) : (
                  "---"
                )}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                الفراغات:{" "}
                {calculatedBulkStats.compactVoids !== null ? (
                  <>
                    <BidiText>{calculatedBulkStats.compactVoids}</BidiText>%
                  </>
                ) : (
                  "---"
                )}
              </span>
            </div>
          </div>
        )}

        <ActionButton
          className="w-full"
          onClick={handleSubmit}
          isLoading={loading}
          disabled={calculatedValue === null}
        >
          <Save className="w-4 h-4 ml-2" />
          حفظ نتائج الكثافة الرص والفضفاض
        </ActionButton>
      </div>
    );
  }

  // Generic Form for other tests
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-300 uppercase">
          القيمة المقاسة ({method.unit})
        </label>
        <input
          type="number"
          step="0.01"
          dir="ltr"
          className="w-full text-lg p-3 bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono font-bold"
          value={genericValue}
          onChange={(e) => setGenericValue(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <ActionButton
        className="w-full"
        onClick={handleSubmit}
        isLoading={loading}
        disabled={!genericValue}
      >
        <Save className="w-4 h-4 ml-2" />
        حفظ النتيجة
      </ActionButton>
    </div>
  );
}
