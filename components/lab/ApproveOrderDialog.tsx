"use client";

import { useState, useMemo, useEffect } from "react";
import { processLabDecision } from "@/app/actions/lab";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { BidiText } from "@/components/ui/BidiText";

export default function ApproveOrderDialog({ order }: { order: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Engineering State
  const [sandMoisture, setSandMoisture] = useState<string>("");
  const [gravelMoisture, setGravelMoisture] = useState<string>("");
  const [bahasMoisture, setBahasMoisture] = useState<string>("");
  const [eta, setEta] = useState<string>("");
  const [details, setDetails] = useState("");
  const [admixturePctAdjustment, setAdmixturePctAdjustment] =
    useState<string>("");

  const router = useRouter();

  // Load saved edits from localStorage or database on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`moisture_adj_${order.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sandMoisture !== undefined)
          setSandMoisture(parsed.sandMoisture);
        if (parsed.gravelMoisture !== undefined)
          setGravelMoisture(parsed.gravelMoisture);
        if (parsed.bahasMoisture !== undefined)
          setBahasMoisture(parsed.bahasMoisture);
        if (parsed.eta !== undefined) setEta(parsed.eta);
        if (parsed.details !== undefined) setDetails(parsed.details);
        if (parsed.admixturePctAdjustment !== undefined)
          setAdmixturePctAdjustment(parsed.admixturePctAdjustment);
      } else if (order.labApproval?.mixData) {
        const parsed = JSON.parse(order.labApproval.mixData);
        if (parsed.sandMoisture !== undefined)
          setSandMoisture(String(parsed.sandMoisture));
        if (parsed.gravelMoisture !== undefined)
          setGravelMoisture(String(parsed.gravelMoisture));
        if (parsed.bahasMoisture !== undefined)
          setBahasMoisture(String(parsed.bahasMoisture));
        if (parsed.eta !== undefined) setEta(parsed.eta);
        if (parsed.admixturePctAdjustment !== undefined)
          setAdmixturePctAdjustment(String(parsed.admixturePctAdjustment));
        if (order.labApproval.details) setDetails(order.labApproval.details);
      }
    } catch (e) {
      console.error(e);
    }
  }, [order.id, order.labApproval]);

  // Save edits to localStorage when they change
  useEffect(() => {
    try {
      const data = {
        sandMoisture,
        gravelMoisture,
        bahasMoisture,
        eta,
        details,
        admixturePctAdjustment,
      };
      localStorage.setItem(`moisture_adj_${order.id}`, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }, [
    order.id,
    sandMoisture,
    gravelMoisture,
    bahasMoisture,
    eta,
    details,
    admixturePctAdjustment,
  ]);

  // خريطة ترجمة المواد إلى اللغة العربية لمنع الإنجليزية بالكامل
  const MATERIAL_TRANSLATIONS: Record<string, string> = {
    cement: "الأسمنت",
    microsilica: "ميكروسيليكا",
    filler: "فيلر",
    ggbfs: "خبث الأفران (GGBFS)",
    flyash: "الرماد المتطاير",
    sand: "الرمل المغسول",
    naturalsand: "الرمل الطبيعي",
    ca10mm: "حصى 10 ملم (CA10)",
    ca20mm: "حصى 20 ملم (CA20)",
    water: "الماء",
    admixture: "المضاف الكيميائي",
  };

  const translateMaterial = (name: string) => {
    const normalized = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return MATERIAL_TRANSLATIONS[normalized] || name;
  };

  // Helper to normalize Arabic text for robust matching
  const normalizeArabic = (text: string): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "") // remove diacritics
      .replace(/[أإآا]/g, "ا") // normalize alef
      .replace(/ة/g, "ه") // normalize teh marbuta
      .replace(/ى/g, "ي"); // normalize alef maksura
  };

  const isSandMaterial = (rawName: string) => {
    const name = normalizeArabic(rawName);
    return name.includes("sand") || name.includes("رمل");
  };

  const isBahasMaterial = (rawName: string) => {
    const name = normalizeArabic(rawName);
    return (
      name.includes("bahas") ||
      name.includes("بحص") ||
      name.includes("fine gravel") ||
      name.includes("10") ||
      name.includes("ca10")
    );
  };

  const isGravelMaterial = (rawName: string) => {
    const name = normalizeArabic(rawName);
    const isBahas = isBahasMaterial(rawName);
    const isSand = isSandMaterial(rawName);
    return (
      (name.includes("gravel") ||
        name.includes("حصي") ||
        name.includes("aggregate") ||
        name.includes("ركام") ||
        name.includes("ca")) &&
      !isBahas &&
      !isSand
    );
  };

  const isCementitiousMaterial = (rawName: string) => {
    const name = normalizeArabic(rawName);
    return (
      name.includes("cement") ||
      name.includes("سمنت") ||
      name.includes("microsilica") ||
      name.includes("ميكروسيلكا") ||
      name.includes("سيلكا") ||
      name.includes("flyash") ||
      name.includes("رماد") ||
      name.includes("ggbfs") ||
      name.includes("خبث") ||
      name.includes("filler") ||
      name.includes("فيلر")
    );
  };

  const isWaterMaterial = (rawName: string) => {
    const name = normalizeArabic(rawName);
    return name.includes("water") || name.includes("ماء");
  };

  const isAdmixMaterial = (rawName: string) => {
    const name = normalizeArabic(rawName);
    return (
      name.includes("admix") ||
      name.includes("مضاف") ||
      name.includes("chemical") ||
      name.includes("كيميائي")
    );
  };

  // تصفية المواد التي كميتها أكبر من 0 فقط لتجنب عرض المواد غير المستخدمة
  const components = (order?.mixDesign?.MixComponent || []).filter(
    (c: any) => c.quantity > 0,
  );

  // Calculate dynamic adjusted weights for all materials
  const computedMaterials = useMemo(() => {
    const numSandMoisture = parseFloat(sandMoisture) || 0;
    const numGravelMoisture = parseFloat(gravelMoisture) || 0;
    const numBahasMoisture = parseFloat(bahasMoisture) || 0;
    const numAdmixturePctAdjustment = parseFloat(admixturePctAdjustment) || 0;

    // Calculate total absorption contribution from aggregates
    let totalAbsorptionContribution = 0;
    components.forEach((c: any) => {
      if (
        isSandMaterial(c.materialName) ||
        isBahasMaterial(c.materialName) ||
        isGravelMaterial(c.materialName)
      ) {
        totalAbsorptionContribution += (c.quantity * (c.absorption || 0)) / 100;
      }
    });

    let bWater = 0;
    let bSand = 0;
    let bGravel = 0;
    let bBahas = 0;
    let totalWaterContribution = 0;
    let totalCementitious = 0;

    components.forEach((c: any) => {
      const isBahas = isBahasMaterial(c.materialName);
      const isSand = isSandMaterial(c.materialName);
      const isGravel = isGravelMaterial(c.materialName);
      const isCementitious = isCementitiousMaterial(c.materialName);

      if (isCementitious) totalCementitious += c.quantity;

      if (isWaterMaterial(c.materialName)) {
        bWater += c.quantity - totalAbsorptionContribution;
      } else if (isSand) {
        bSand += c.quantity;
        const freeMoisturePct = numSandMoisture - (c.absorption || 0);
        totalWaterContribution += (c.quantity * freeMoisturePct) / 100;
      } else if (isBahas) {
        bBahas += c.quantity;
        const freeMoisturePct = numBahasMoisture - (c.absorption || 0);
        totalWaterContribution += (c.quantity * freeMoisturePct) / 100;
      } else if (isGravel) {
        bGravel += c.quantity;
        const freeMoisturePct = numGravelMoisture - (c.absorption || 0);
        totalWaterContribution += (c.quantity * freeMoisturePct) / 100;
      }
    });

    return components.map((c: any) => {
      const isBahas = isBahasMaterial(c.materialName);
      const isSand = isSandMaterial(c.materialName);
      const isGravel = isGravelMaterial(c.materialName);
      const isWater = isWaterMaterial(c.materialName);
      const isAdmix = isAdmixMaterial(c.materialName);

      let baseQty = c.quantity;
      if (isWater) {
        baseQty = c.quantity - totalAbsorptionContribution;
      }
      let adjusted = baseQty;
      let change = 0;
      let admixWeight = 0;
      let admixAdjustedWeight = 0;
      let admixChangeWeight = 0;
      let admixLiters = 0;
      let admixChangeLiters = 0;
      let admixAdjustedLiters = 0;

      if (isWater) {
        change = -totalWaterContribution;
        adjusted = baseQty + change;
      } else if (isSand) {
        const freeMoisturePct = numSandMoisture - (c.absorption || 0);
        change = c.quantity * (freeMoisturePct / 100);
        adjusted = baseQty + change;
      } else if (isBahas) {
        const freeMoisturePct = numBahasMoisture - (c.absorption || 0);
        change = c.quantity * (freeMoisturePct / 100);
        adjusted = baseQty + change;
      } else if (isGravel) {
        const freeMoisturePct = numGravelMoisture - (c.absorption || 0);
        change = c.quantity * (freeMoisturePct / 100);
        adjusted = baseQty + change;
      } else if (isAdmix) {
        admixWeight = totalCementitious * (baseQty / 100);
        admixLiters = admixWeight / (c.specificGravity || 1);
        change = numAdmixturePctAdjustment;
        adjusted = baseQty + change;
        admixAdjustedWeight = totalCementitious * (adjusted / 100);
        admixAdjustedLiters = admixAdjustedWeight / (c.specificGravity || 1);
        admixChangeWeight = admixAdjustedWeight - admixWeight;
        admixChangeLiters = admixAdjustedLiters - admixLiters;
      }

      const nameSuffix = c.absorption ? ` (امتصاص: ${c.absorption}%)` : "";

      return {
        ...c,
        materialNameArabic: translateMaterial(c.materialName) + nameSuffix,
        baseQty,
        adjustedQuantity: adjusted,
        change,
        admixWeight,
        admixAdjustedWeight,
        admixChangeWeight,
        admixLiters,
        admixChangeLiters,
        admixAdjustedLiters,
        isWater,
        isSand,
        isGravel: isGravel || isBahas, // display as aggregate category
        isAdmix,
      };
    });
  }, [
    components,
    sandMoisture,
    gravelMoisture,
    bahasMoisture,
    admixturePctAdjustment,
  ]);

  async function handleApprove() {
    const numSandMoisture = parseFloat(sandMoisture) || 0;
    const numGravelMoisture = parseFloat(gravelMoisture) || 0;
    const numBahasMoisture = parseFloat(bahasMoisture) || 0;
    const numAdmixturePctAdjustment = parseFloat(admixturePctAdjustment) || 0;

    if (numSandMoisture < 0 || numGravelMoisture < 0 || numBahasMoisture < 0) {
      toast.error("لا يمكن أن تكون نسبة الرطوبة سالبة");
      return;
    }

    setIsSubmitting(true);
    try {
      const mixData = JSON.stringify({
        sandMoisture: numSandMoisture,
        gravelMoisture: numGravelMoisture,
        bahasMoisture: numBahasMoisture,
        eta,
        admixturePctAdjustment: numAdmixturePctAdjustment,
        materials: computedMaterials.map((c: any) => ({
          id: c.id,
          name: c.materialName,
          base: c.baseQty,
          adjusted: c.adjustedQuantity,
          change: c.change,
        })),
        proportions: computedMaterials.reduce((acc: any, c: any) => {
          acc[c.materialName] = c.isAdmix
            ? c.admixAdjustedLiters
            : c.adjustedQuantity;
          return acc;
        }, {}),
      });

      await processLabDecision(order.id, "APPROVE", details, mixData);
      try {
        localStorage.removeItem(`moisture_adj_${order.id}`);
      } catch (e) {
        console.error("[المختبر] تعذر مسح بيانات تعديل الرطوبة المحفوظة محلياً:", e);
      }
      setIsOpen(false);
      router.refresh();
      toast.success("تم اعتماد الخلطة وإرسالها للمعمل بنجاح");
    } catch (e: unknown) {
      const error = e as Error;
      toast.error("فشل في الاعتماد: " + (error.message || "حدث خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!details.trim()) {
      toast.error("يرجى كتابة سبب الرفض أولاً");
      return;
    }
    setIsSubmitting(true);
    try {
      await processLabDecision(order.id, "REJECT", details);
      try {
        localStorage.removeItem(`moisture_adj_${order.id}`);
      } catch (e) {
        console.error("[المختبر] تعذر مسح بيانات تعديل الرطوبة المحفوظة محلياً عند الرفض:", e);
      }
      setIsOpen(false);
      router.refresh();
      toast.success("تم رفض الطلب بنجاح");
    } catch (e: unknown) {
      const error = e as Error;
      toast.error("فشل في الرفض: " + (error.message || "حدث خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary px-2.5 py-1 text-sm font-bold shadow-sm transition-all hover:bg-indigo-500/20 hover:text-indigo-300"
        title="مراجعة واعتماد الخلطة"
      >
        الضبط الهندسي
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl max-w-5xl w-full my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  ></path>
                </svg>
              </span>
              الضبط الهندسي للخلطة
            </h3>
            <span className="text-xs text-slate-400 mt-0.5 block">
              طلب رقم: {order.orderNumber}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
          {/* Info Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50 shadow-sm col-span-1 md:col-span-1">
              <span className="block text-[10px] text-slate-400">
                المشروع / موقع الصب
              </span>
              <span className="font-bold text-xs text-white block">
                {(() => {
                  const loc = order.project?.location || "";
                  const idx = loc.search(/\((GPS|FILE):|GPS:|FILE:/);
                  const clean =
                    idx !== -1 ? loc.substring(0, idx).trim() : loc.trim();
                  return clean || order.project?.name || "غير محدد";
                })()}
              </span>
              {(() => {
                const loc = order.project?.location || "";
                let gpsCoords = "";
                const gpsIdx = loc.indexOf("GPS:");
                if (gpsIdx !== -1) {
                  let gpsPart = loc.substring(gpsIdx + 4).trim();
                  const fileIdx = gpsPart.search(/\(?FILE:/);
                  if (fileIdx !== -1) {
                    gpsPart = gpsPart.substring(0, fileIdx).trim();
                  }
                  gpsCoords = gpsPart.replace(/[)]+$/, "").trim();
                }

                let fileUrl = "";
                const fileIdx = loc.indexOf("FILE:");
                if (fileIdx !== -1) {
                  let filePart = loc.substring(fileIdx + 5).trim();
                  const nextFileIdx = filePart.search(/\(?FILE:/);
                  if (nextFileIdx !== -1) {
                    filePart = filePart.substring(0, nextFileIdx).trim();
                  }
                  fileUrl = filePart.replace(/[)]+$/, "").trim();
                }

                return (
                  <div className="mt-1.5 space-y-1">
                    {gpsCoords && (
                      <span className="text-xs text-indigo-400 font-mono block">
                        إحداثيات: <BidiText>{gpsCoords}</BidiText>
                      </span>
                    )}
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 font-bold hover:underline block mt-1 flex items-center gap-1"
                      >
                        <svg
                          className="w-3.5 h-3.5 inline-block"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>تحميل خريطة الموقع</span>
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50 shadow-sm">
              <span className="block text-[10px] text-slate-400">
                الكمية المطلوبة
              </span>
              <span className="font-bold text-xs text-indigo-300">
                {order.originalQuantity} m³
              </span>
            </div>
            <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50 shadow-sm">
              <span className="block text-[10px] text-slate-400">
                كود الخلطة
              </span>
              <span className="font-bold text-xs text-white">
                {order.mixDesign?.code || "N/A"}
              </span>
            </div>
            <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50 shadow-sm">
              <span className="block text-[10px] text-slate-400">المقاومة</span>
              <span className="font-bold text-xs text-white">
                {order.mixDesign?.strength || "N/A"} MPa
              </span>
            </div>
          </div>

          {!isRejectMode ? (
            <>
              {/* Engineering Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                {/* Moisture Settings & Admixture Controls */}
                <div className="col-span-2 bg-slate-800/30 border border-indigo-500/20 rounded-lg p-2 shadow-sm">
                  <h4 className="text-indigo-400 font-bold mb-1 text-[11px] flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                      ></path>
                    </svg>
                    إعدادات الرطوبة وتعديل المضاف
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold">
                        رطوبة الرمل
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sandMoisture}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                              setSandMoisture(val);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 pl-6 text-white text-[11px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          placeholder="0.0"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold">
                        رطوبة الحصى
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gravelMoisture}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                              setGravelMoisture(val);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 pl-6 text-white text-[11px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          placeholder="0.0"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold">
                        رطوبة البحص
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={bahasMoisture}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                              setBahasMoisture(val);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 pl-6 text-white text-[11px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          placeholder="0.0"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-purple-400 font-bold">
                        تعديل المضاف
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={admixturePctAdjustment}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              val === "-" ||
                              /^-?[0-9]*\.?[0-9]*$/.test(val)
                            ) {
                              setAdmixturePctAdjustment(val);
                            }
                          }}
                          className="w-full bg-slate-900 border border-purple-500/50 rounded py-1 px-2 pl-6 text-white text-[11px] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                          placeholder="0.0"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          ±%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="col-span-2 bg-slate-800/30 border border-emerald-500/20 rounded-lg p-2 shadow-sm">
                  <h4 className="text-emerald-400 font-bold mb-1 text-[11px] flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    التشغيل واللوجستيات
                  </h4>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">
                      وقت وصول الخلاطة (ETA)
                    </label>
                    <input
                      type="time"
                      value={eta}
                      onChange={(e) => setEta(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 text-white text-[11px] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Materials Table */}
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden shadow-inner">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="py-1 px-2 text-[10px] font-bold text-slate-300 w-1/3">
                        المادة
                      </th>
                      <th className="py-1 px-2 text-[10px] font-bold text-slate-300">
                        الوزن التصميمي
                      </th>
                      <th className="py-1 px-2 text-[10px] font-bold text-indigo-300">
                        الوزن المعتمد (بعد التعديل)
                      </th>
                      <th className="py-1 px-2 text-[10px] font-bold text-slate-300">
                        التغيير
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {computedMaterials.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-4 text-center text-slate-500 text-xs"
                        >
                          لا توجد مواد مسجلة في تفاصيل الخلطة.
                        </td>
                      </tr>
                    ) : (
                      computedMaterials.map((c: any) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-1 px-2 flex items-center gap-1.5 text-[11px]">
                            {c.isWater ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            ) : c.isSand ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            ) : c.isGravel ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            ) : c.isAdmix ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            )}
                            <span className="font-medium text-slate-200">
                              {c.materialNameArabic}
                            </span>
                          </td>
                          <td className="py-1 px-1.5 text-center text-slate-400 font-mono text-[11px]">
                            {c.isAdmix ? (
                              <>
                                {c.baseQty.toFixed(2)} %
                                <span className="text-[10px] text-slate-500 block">
                                  ({(c.admixWeight || 0).toFixed(2)} kg /{" "}
                                  {(c.admixLiters || 0).toFixed(2)} L)
                                </span>
                              </>
                            ) : (
                              <>
                                {c.baseQty.toFixed(1)} {c.unit}
                              </>
                            )}
                          </td>
                          <td
                            className={`py-1 px-1.5 text-center font-bold font-mono text-[11px] ${c.isWater ? "text-cyan-400" : c.isSand ? "text-amber-400" : c.isGravel ? "text-slate-200" : c.isAdmix ? "text-purple-400" : "text-emerald-400"}`}
                          >
                            {c.isAdmix ? (
                              <>
                                {c.adjustedQuantity.toFixed(2)} %
                                <span className="text-[10px] block opacity-50">
                                  ({(c.admixAdjustedWeight || 0).toFixed(2)} kg
                                  / {(c.admixAdjustedLiters || 0).toFixed(2)} L)
                                </span>
                              </>
                            ) : (
                              <>
                                {c.adjustedQuantity.toFixed(1)} {c.unit}
                              </>
                            )}
                          </td>
                          <td
                            className="py-1 px-1.5 text-center font-mono text-[11px]"
                            dir="ltr"
                          >
                            {c.isAdmix ? (
                              c.change === 0 ? (
                                <span className="text-slate-600">-</span>
                              ) : c.change > 0 ? (
                                <span className="text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded text-xs flex flex-col items-center">
                                  +{c.change.toFixed(2)}%
                                  <span className="opacity-70">
                                    (+{(c.admixChangeWeight || 0).toFixed(2)} kg
                                    / +{(c.admixChangeLiters || 0).toFixed(2)}{" "}
                                    L)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded text-xs flex flex-col items-center">
                                  {c.change.toFixed(2)}%
                                  <span className="opacity-70">
                                    ({(c.admixChangeWeight || 0).toFixed(2)} kg
                                    / {(c.admixChangeLiters || 0).toFixed(2)} L)
                                  </span>
                                </span>
                              )
                            ) : c.change === 0 ? (
                              <span className="text-slate-600">-</span>
                            ) : c.change > 0 ? (
                              <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                                +{c.change.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">
                                {c.change.toFixed(1)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-8 text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-rose-400 mb-3">
                تأكيد رفض الطلبية
              </h4>
              <p className="text-slate-300 max-w-md mx-auto">
                أنت على وشك رفض هذه الطلبية بشكل نهائي وإعادتها لقسم المبيعات
                للتعديل أو الإلغاء. يرجى توضيح السبب بدقة في حقل الملاحظات.
              </p>
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
              {isRejectMode
                ? "سبب الرفض (إجباري للمبيعات)"
                : "توصيات وملاحظات لمشغل المحطة (اختياري)"}
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[40px] custom-scrollbar"
              placeholder={
                isRejectMode
                  ? "اكتب سبب الرفض بوضوح ليتمكن المبيعات من فهم المشكلة..."
                  : "مثال: يرجى إضافة الثلج لارتفاع درجة الحرارة، أو الالتزام بتوصيل سريع..."
              }
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t border-slate-800 flex flex-wrap gap-2 justify-end shrink-0 bg-slate-900/50 rounded-b-xl">
          {!isRejectMode ? (
            <>
              <button
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex-1 sm:flex-none font-bold"
              >
                إلغاء الأمر
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => setIsRejectMode(true)}
                className="btn bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all flex-1 sm:flex-none font-bold"
              >
                رفض وإرجاع
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleApprove}
                className="btn btn-primary flex-1 sm:flex-none min-w-[200px] font-bold shadow-lg shadow-indigo-500/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري الاعتماد...
                  </span>
                ) : (
                  "اعتماد الأوزان وإرسال"
                )}
              </button>
            </>
          ) : (
            <>
              <button
                disabled={isSubmitting}
                onClick={() => setIsRejectMode(false)}
                className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex-1 sm:flex-none font-bold"
              >
                تراجع
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleReject}
                className="btn bg-rose-600 text-white hover:bg-rose-700 transition-all flex-1 sm:flex-none min-w-[200px] font-bold shadow-lg shadow-rose-600/20"
              >
                {isSubmitting ? "جاري الرفض..." : "تأكيد الرفض النهائي"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
