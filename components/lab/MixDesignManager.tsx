"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/Icons";
import { calculateExcelMix, MixDesignInputs } from "@/lib/lab/excel-calc";
import { toast } from "@/lib/toast";

import { NumInput } from "@/components/ui/NumInput";
import { DatePickerWheel } from "@/components/ui/DatePickerWheel";
import { getDictionary } from "@/lib/dictionary";
import { exportMixDesignToPDF } from "@/lib/lab/pdf-export";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface Material {
  id: string | number;
  name: string;
  quantity?: number;
  specificGravity?: number;
  moistureContent?: number;
  absorption?: number;
  [key: string]: any;
}

interface LabInterval {
  time: string;
  slump: number;
  temp: number;
}

interface LabResults {
  slumpInitial: number;
  ambientTemp: number;
  intervals: LabInterval[];
  freshDensity: number;
  airMeasured: number;
  slumpRange: string;
  sampleWeight?: number;
  sampleVolume?: number;
  t500?: number;
  vFunnel?: number;
}

interface StrengthResult {
  age: string;
  s1: number;
  s2: number;
}

interface MixInitialData {
  plant?: string | null;
  strengthClass?: string | null;
  site?: string | null;
  code?: string | null;
  name?: string;
  labResults?: LabResults;
  strengthMetadata?: {
    requiredStrength?: number;
    curingConditions?: string;
  };
  strengthResults?: StrengthResult[];
  trialInfo?: any;
  components?: any[];
}

interface Props {
  initialData?: MixInitialData & {
    id?: number;
    status?: string;
    version?: number;
  };
  materials?: Material[]; // Database materials list
  settings?: Record<string, string>; // Company defaults
  onSave: (data: any) => Promise<any>;
  onCreateRevision?: (
    note: string,
    newName?: string,
    newCode?: string,
  ) => Promise<any>; // Handler for creating new versions
  onApprove?: () => Promise<any>; // Handler for approving the current mix
  isReadOnly?: boolean;
  history?: any[];
  lang?: "ar" | "en";
  onDuplicate?: (data: any) => Promise<any>;
}

export default function MixDesignManager({
  initialData,
  materials: dbMaterials,
  settings = {},
  onSave,
  onCreateRevision,
  onApprove,
  isReadOnly,
  lang = "ar",
  history = [],
  onDuplicate,
}: Props) {
  const d = getDictionary(lang);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const isApproved = initialData?.status === "APPROVED";
  const effectivelyReadOnly = isReadOnly || isApproved;

  const sections = [
    {
      id: "identity",
      label: d.lab.mix_designs.v2_sections.identity,
      icon: Icons.Target,
    },
    {
      id: "constants",
      label: d.lab.mix_designs.v2_sections.constants,
      icon: Icons.Database,
    },
    {
      id: "weights",
      label: d.lab.mix_designs.v2_sections.weights,
      icon: Icons.Scale,
    },
    {
      id: "trial",
      label: d.lab.mix_designs.v2_sections.trial,
      icon: Icons.Droplet,
    },
    {
      id: "strength",
      label: d.lab.mix_designs.v2_sections.strength,
      icon: Icons.ShieldCheck,
    },
  ];

  // Helper to find material properties from dbMaterials
  const getDbMaterialProperty = (
    name: string,
    prop: string,
    defaultValue: number | null,
  ) => {
    const searchName1 = name.toLowerCase();
    const searchName2 = name
      .toLowerCase()
      .replace("flyash", "fly ash")
      .replace("naturalsand", "natural sand");
    const material = dbMaterials?.find(
      (m: Material) =>
        m.name?.toLowerCase() === searchName1 ||
        m.name?.toLowerCase() === searchName2,
    );
    return material
      ? ((material[prop as keyof Material] as number) ?? defaultValue)
      : defaultValue;
  };

  // Helper to find saved material properties from previous mix components (Edit Mode)
  const getSavedMaterialProperty = (
    name: string,
    prop: string,
    defaultValue: number | null,
  ) => {
    // 1. Try to find the exact saved component in initialData
    const savedComponent = initialData?.components?.find(
      (c) => c.materialName?.toLowerCase() === name.toLowerCase(),
    );

    if (
      savedComponent &&
      savedComponent[prop as keyof typeof savedComponent] !== undefined
    ) {
      return Number(savedComponent[prop as keyof typeof savedComponent]);
    }

    // 2. If not saved (or new Mix Design), fallback to DB default
    return getDbMaterialProperty(name, prop, defaultValue);
  };

  // Parse trialInfo safely
  const parsedTrialInfo = useMemo(() => {
    if (!initialData?.trialInfo) return null;
    try {
      return typeof initialData.trialInfo === "string"
        ? JSON.parse(initialData.trialInfo)
        : initialData.trialInfo;
    } catch {
      return null;
    }
  }, [initialData?.trialInfo]);

  // --- Confirmation Dialog State ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: "danger" | "warning" | "info";
    confirmText?: string;
    secondaryText?: string;
    onSecondary?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {},
    variant: "info",
  });

  // --- State Matching Excel Structure ---
  const [mixInfo, setMixInfo] = useState<{
    plant: string;
    strength: string;
    site: string;
    mixRef: string;
    mixName: string;
    date: string;
    time: string;
    customer: string;
    cementBrand: string;
    trialLiters: number;
    cubeCount: number;
    sampleType: "cube" | "cylinder";
    admixtureType: string;
    admixtureName: string;
  }>({
    plant: parsedTrialInfo?.plant || initialData?.plant || "",
    strength: parsedTrialInfo?.strength || initialData?.strengthClass || "",
    site: parsedTrialInfo?.site || initialData?.site || "",
    mixRef: parsedTrialInfo?.mixRef || initialData?.code || "",
    mixName: parsedTrialInfo?.mixName || initialData?.name || "",
    date: parsedTrialInfo?.date || new Date().toISOString().split("T")[0],
    time: parsedTrialInfo?.time || "",
    customer: parsedTrialInfo?.customer || "",
    cementBrand: parsedTrialInfo?.cementBrand || "",
    trialLiters:
      parsedTrialInfo?.trialLiters ||
      Number(settings["mix.default.trialLiters"]) ||
      null, // Trial Mix Size (litre)
    cubeCount: parsedTrialInfo?.cubeCount || 6,
    sampleType: parsedTrialInfo?.sampleType || "cube",
    admixtureType: parsedTrialInfo?.admixtureType || "",
    admixtureName: parsedTrialInfo?.admixtureName || "",
  });

  const [materials, setMaterials] = useState({
    cement: {
      weight: getSavedMaterialProperty(
        "cement",
        "quantity",
        Number(settings["mix.default.cement"]) || null,
      ),
      sg: getSavedMaterialProperty("cement", "specificGravity", null),
    },
    microsilica: {
      weight: getSavedMaterialProperty("microsilica", "quantity", null),
      sg: getSavedMaterialProperty("microsilica", "specificGravity", null),
    },
    filler: {
      weight: getSavedMaterialProperty("filler", "quantity", null),
      sg: getSavedMaterialProperty("filler", "specificGravity", null),
    },
    ggbfs: {
      weight: getSavedMaterialProperty("ggbfs", "quantity", null),
      sg: getSavedMaterialProperty("ggbfs", "specificGravity", null),
    },
    flyAsh: {
      weight: getSavedMaterialProperty("flyAsh", "quantity", null),
      sg: getSavedMaterialProperty("flyAsh", "specificGravity", null),
    },
    sand: {
      weight: getSavedMaterialProperty(
        "sand",
        "quantity",
        Number(settings["mix.default.sand"]) || null,
      ),
      sg: getSavedMaterialProperty(
        "sand",
        "specificGravity",
        Number(settings["mix.default.sand.sg"]) || null,
      ),
      moisture: getSavedMaterialProperty("sand", "moistureContent", null),
      absorption: getSavedMaterialProperty("sand", "absorption", null),
    },
    naturalSand: {
      weight: getSavedMaterialProperty("naturalSand", "quantity", null),
      sg: getSavedMaterialProperty("naturalSand", "specificGravity", null),
      moisture: getSavedMaterialProperty(
        "naturalSand",
        "moistureContent",
        null,
      ),
      absorption: getSavedMaterialProperty("naturalSand", "absorption", null),
    },
    ca10mm: {
      weight: getSavedMaterialProperty("ca10mm", "quantity", null),
      sg: getSavedMaterialProperty(
        "ca10mm",
        "specificGravity",
        Number(settings["mix.default.ca10mm.sg"]) || null,
      ),
      moisture: getSavedMaterialProperty("ca10mm", "moistureContent", null),
      absorption: getSavedMaterialProperty("ca10mm", "absorption", null),
    },
    ca20mm: {
      weight: getSavedMaterialProperty(
        "ca20mm",
        "quantity",
        Number(settings["mix.default.ca20mm"]) || null,
      ),
      sg: getSavedMaterialProperty(
        "ca20mm",
        "specificGravity",
        Number(settings["mix.default.ca20mm.sg"]) || null,
      ),
      moisture: getSavedMaterialProperty("ca20mm", "moistureContent", null),
      absorption: getSavedMaterialProperty("ca20mm", "absorption", null),
    },
    water: {
      weight: getSavedMaterialProperty(
        "water",
        "quantity",
        Number(settings["mix.default.water"]) || null,
      ),
      sg: 1,
    },
    admixture: {
      dosage: getSavedMaterialProperty(
        "admixture",
        "quantity",
        Number(settings["mix.default.admixture.dosage"]) || null,
      ),
      sg: getSavedMaterialProperty(
        "admixture",
        "specificGravity",
        Number(settings["mix.default.admixture.sg"]) || null,
      ),
    },
    airContent:
      parsedTrialInfo?.airContent ??
      (settings["mix.default.air"]
        ? Number(settings["mix.default.air"]) * 10
        : null),
  } as any);

  const [labResults, setLabResults] = useState({
    slumpInitial: initialData?.labResults?.slumpInitial || 0,
    ambientTemp: initialData?.labResults?.ambientTemp || 0,
    intervals: initialData?.labResults?.intervals || [
      { time: "5", slump: 0, temp: 0 },
      { time: "30", slump: 0, temp: 0 },
      { time: "45", slump: 0, temp: 0 },
      { time: "60", slump: 0, temp: 0 },
      { time: "90", slump: 0, temp: 0 },
    ],
    freshDensity: initialData?.labResults?.freshDensity || 0,
    sampleWeight: initialData?.labResults?.sampleWeight || 0, // الوزن (كجم)
    sampleVolume: initialData?.labResults?.sampleVolume || 0, // الحجم (لتر)
    t500: initialData?.labResults?.t500 || 0,
    vFunnel: initialData?.labResults?.vFunnel || 0,
    airMeasured: initialData?.labResults?.airMeasured || 0,
    slumpRange: initialData?.labResults?.slumpRange || "",
  });

  const [strengthMetadata, setStrengthMetadata] = useState({
    requiredStrength: initialData?.strengthMetadata?.requiredStrength || 0,
    curingConditions:
      initialData?.strengthMetadata?.curingConditions || "standard",
  });

  const [strengthResults, setStrengthResults] = useState<any[]>(
    (Array.isArray(initialData?.strengthResults)
      ? initialData.strengthResults
      : [
          { age: "1d", s1: 0, s2: 0 },
          { age: "3d", s1: 0, s2: 0 },
          { age: "7d", s1: 0, s2: 0 },
          { age: "28d", s1: 0, s2: 0 },
        ]
    ).filter((r: any) => String(r.age).toLowerCase() !== "56d"),
  );

  // --- Calculations ---
  // Auto-calculate Fresh Density: (Weight / Volume) * 1000
  useEffect(() => {
    if (labResults.sampleWeight > 0 && labResults.sampleVolume > 0) {
      const density =
        (labResults.sampleWeight / labResults.sampleVolume) * 1000;
      if (Math.abs(density - labResults.freshDensity) > 0.1) {
        setLabResults((prev) => ({
          ...prev,
          freshDensity: Number(density.toFixed(0)),
        }));
      }
    }
  }, [
    labResults.sampleWeight,
    labResults.sampleVolume,
    labResults.freshDensity,
  ]);

  // --- Auto-generate Mix Code ---
  const generatedMixCode = useMemo(() => {
    // 1. Mix Name (First 3 letters, fallback to MIX)
    const prj =
      mixInfo.mixName
        ?.trim()
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9\u0600-\u06FF]/gi, "") || "MIX";

    // 2. Strength Class
    const str = mixInfo.strength?.split("/")[0]?.toUpperCase() || "CXX";

    // 3. Date (YYMMDD)
    const dateObj = new Date(mixInfo.date || new Date());
    const year = String(dateObj.getFullYear()).slice(-2);
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    // 4. Version
    const ver = initialData?.version ? `V${initialData.version}` : "V1";

    // 5. Additives (G for GGBFS, B for MicroSilica/FlyAsh/Filler)
    let additives = "";
    if (materials.ggbfs?.weight > 0) additives += "G";
    if (
      materials.microsilica?.weight > 0 ||
      materials.flyAsh?.weight > 0 ||
      materials.filler?.weight > 0
    ) {
      additives += "B";
    }

    // Assemble the code
    const parts = [prj, str, dateStr];
    if (additives) parts.push(additives);
    parts.push(ver);

    return parts.join("-");
  }, [
    mixInfo.mixName,
    mixInfo.strength,
    mixInfo.date,
    initialData?.version,
    materials.ggbfs?.weight,
    materials.microsilica?.weight,
    materials.flyAsh?.weight,
    materials.filler?.weight,
  ]);

  // Sync generated code into mixInfo whenever it changes
  useEffect(() => {
    if (mixInfo.mixRef !== generatedMixCode && !effectivelyReadOnly) {
      setMixInfo((prev) => ({ ...prev, mixRef: generatedMixCode }));
    }
  }, [generatedMixCode, effectivelyReadOnly, mixInfo.mixRef]);

  const results = useMemo(() => {
    return calculateExcelMix({
      trialLiters: mixInfo.trialLiters,
      ...materials,
      water: materials.water?.weight || 0,
    } as MixDesignInputs);
  }, [mixInfo.trialLiters, materials]);

  const getSnapshot = useCallback(() => {
    const { mixRef, ...restMixInfo } = mixInfo;
    const { freshDensity, ...restLabResults } = labResults;
    return JSON.stringify({
      mixInfo: restMixInfo,
      materials,
      labResults: restLabResults,
      strengthResults,
      strengthMetadata,
    });
  }, [mixInfo, materials, labResults, strengthResults, strengthMetadata]);

  const initialSnapshot = useMemo(() => {
    const { mixRef, ...restMixInfo } = mixInfo;
    const { freshDensity, ...restLabResults } = labResults;
    return JSON.stringify({
      mixInfo: restMixInfo,
      materials,
      labResults: restLabResults,
      strengthResults,
      strengthMetadata,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSnapshot = getSnapshot();
  const hasUnsavedChanges =
    initialSnapshot !== currentSnapshot && !effectivelyReadOnly;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDuplicate = async () => {
    if (!onDuplicate) return;
    setSaving(true);
    const payload = {
      name: mixInfo.mixName ? mixInfo.mixName + " (نسخة)" : "خلطة مستنسخة",
      code: mixInfo.mixRef + "-COPY",
      strengthClass: mixInfo.strength,
      method: "Excel/TM9",
      trialInfo: {
        ...mixInfo,
        airContent: materials.airContent,
      },
      labResults: labResults,
      strengthResults: strengthResults,
      strengthMetadata: strengthMetadata,
      calculations: results,
      components: Object.entries(materials)
        .filter(([key]) => key !== "airContent")
        .map(([key, mat]: [string, any]) => ({
          materialName: key,
          quantity: Number(
            (mat as { weight?: number; dosage?: number }).weight ??
              (mat as { weight?: number; dosage?: number }).dosage ??
              0,
          ),
          unit: key === "water" || key === "admixture" ? "liter" : "kg",
          specificGravity: Number(
            (mat as { sg?: number }).sg ?? (key === "water" ? 1 : 0),
          ),
          moistureContent: Number((mat as { moisture?: number }).moisture ?? 0),
          absorption: Number((mat as { absorption?: number }).absorption ?? 0),
        })),
    };

    const duplicatePromise = onDuplicate(payload);

    toast.promise(duplicatePromise, {
      loading: "جاري استنساخ الخلطة...",
      success: "تم الاستنساخ بنجاح",
      error: (err: any) => err?.message || "خطأ في الاستنساخ",
    });

    try {
      await duplicatePromise;
    } catch (e) {
      // Error handled by toast.promise
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Map internal state to Server Action expected structure
    const payload = {
      name: mixInfo.mixName || "خلطة تجريبية جديدة",
      code: mixInfo.mixRef,
      strengthClass: mixInfo.strength,
      method: "Excel/TM9",
      trialInfo: {
        ...mixInfo,
        airContent: materials.airContent,
      },
      labResults: labResults,
      strengthResults: strengthResults,
      strengthMetadata: strengthMetadata,
      calculations: results,
      // Map components for the database
      components: Object.entries(materials)
        .filter(([key]) => key !== "airContent")
        .map(([key, mat]: [string, any]) => ({
          materialName: key,
          quantity: Number(
            (mat as { weight?: number; dosage?: number }).weight ??
              (mat as { weight?: number; dosage?: number }).dosage ??
              0,
          ),
          unit: key === "water" || key === "admixture" ? "liter" : "kg",
          specificGravity: Number(
            (mat as { sg?: number }).sg ?? (key === "water" ? 1 : 0),
          ),
          moistureContent: Number((mat as { moisture?: number }).moisture ?? 0),
          absorption: Number((mat as { absorption?: number }).absorption ?? 0),
        })),
    };

    const savePromise = onSave(payload);

    toast.promise(savePromise, {
      loading: "جاري الحفظ...",
      success: "تم حفظ تقرير الخلطة بنجاح",
      error: (err: any) => err?.message || "خطأ في الاتصال بالخادم",
    });

    try {
      await savePromise;
      // Navigate on success client-side to prevent NEXT_REDIRECT throwing
      router.push("/system/lab/mix-designs");
    } catch (e) {
      // Error handled by toast.promise
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const payload = {
        name: mixInfo.customer || "خلطة تجريبية",
        code: mixInfo.mixRef || "DRAFT",
        strengthClass: mixInfo.strength,
        version: initialData?.version || 1,
        trialInfo: {
          ...mixInfo,
          site: mixInfo.site,
        },
        labResults,
        components: Object.entries(materials)
          .filter(([key]) => key !== "airContent")
          .map(([key, mat]: [string, any]) => ({
            materialName:
              d.lab.mix_designs.results[
                key as keyof typeof d.lab.mix_designs.results
              ] || key,
            quantity: Number(
              (mat as { weight?: number; dosage?: number }).weight ??
                (mat as { weight?: number; dosage?: number }).dosage ??
                0,
            ),
            specificGravity: Number((mat as { sg?: number }).sg ?? 0),
            moistureContent: Number(
              (mat as { moisture?: number }).moisture ?? 0,
            ),
            absorption: Number(
              (mat as { absorption?: number }).absorption ?? 0,
            ),
          })),
      };

      await exportMixDesignToPDF({
        mixData: payload,
        companyName: mixInfo.plant,
        lang,
      });
      toast.success("تم تصدير التقرير بنجاح");
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء تصدير التقرير");
    } finally {
      setIsExporting(false);
    }
  };

  const cardCls =
    "relative group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
  const glowCls =
    "absolute -inset-px bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm";
  const inputCls =
    "w-full bg-white/[0.03] border-b border-white/5 focus:border-primary outline-none py-1.5 px-3 text-sm text-white font-black transition-all placeholder:text-slate-700 font-mono text-center rounded-lg focus:bg-white/[0.05]";
  const primaryText =
    "bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent font-black";

  return (
    <div
      lang={lang}
      dir={"rtl"}
      className="flex flex-col h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden selection:bg-primary/30"
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* Top Header / Actions */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-8 py-5 bg-slate-950/50 backdrop-blur-md border-b border-white/5 shrink-0 z-50"
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                setConfirmConfig({
                  isOpen: true,
                  title: "تغييرات غير محفوظة",
                  description:
                    "لقد قمت بإجراء تعديلات ولم تقم بحفظها. هل أنت متأكد من رغبتك في الخروج؟",
                  variant: "warning",
                  action: () => router.back(),
                  confirmText: "تجاهل",
                  secondaryText: "حفظ",
                  onSecondary: async () => {
                    await handleSave();
                  },
                });
              } else {
                router.back();
              }
            }}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all group active:scale-90"
            title={d.lab.mix_designs.trial_metrics.labels.back_to_list}
          >
            <Icons.ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
          <div className="space-y-0.5">
            <h1 className={`${primaryText} text-xl flex items-center gap-3`}>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icons.FlaskConical className="w-5 h-5 text-primary" />
              </div>
              {d.lab.mix_designs.trial_metrics.labels.trial_mix_design}
            </h1>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono tracking-widest uppercase">
              <span>
                {d.lab.mix_designs.trial_metrics.labels.trial_mix_design}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
              <span>TM9 Standard</span>
              {mixInfo.mixRef && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                  <span className="text-primary/70">{mixInfo.mixRef}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end px-4 border-r border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">
              الإصدار الحالي
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
              v{initialData?.version || 1}
            </span>
          </div>
          <div className="hidden lg:flex flex-col items-end px-4 border-r border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">
              {d.common.status}
            </span>
            <span
              className={`flex items-center gap-1.5 text-[10px] font-bold ${isApproved ? "text-emerald-500" : "text-amber-500"}`}
            >
              {!isApproved && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {isApproved
                ? "معتمد"
                : d.lab.mix_designs.trial_metrics.labels.draft}
            </span>
          </div>

          {!effectivelyReadOnly ? (
            <div className="flex items-center gap-3">
              {onApprove && !isApproved && (
                <button
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: "اعتماد الخلطة",
                      description:
                        "هل أنت متأكد من اعتماد هذه الخلطة؟ لا يمكن تعديلها بعد الاعتماد.",
                      variant: "warning",
                      action: async () => {
                        setSaving(true);
                        try {
                          await onApprove();
                        } catch (e: unknown) {
                          toast.error(
                            (e as Error).message || "Approval failed",
                          );
                        } finally {
                          setSaving(false);
                        }
                      },
                    });
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Icons.CheckCircle className="w-4 h-4" />
                  اعتماد الخلطة
                </button>
              )}

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-6 py-3 bg-white/5 text-slate-300 border border-white/10 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-white/10 hover:text-white active:scale-95 transition-all flex items-center gap-2"
              >
                {isExporting ? (
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.FileText className="w-4 h-4" />
                )}
                تصدير PDF
              </button>

              {onDuplicate && (
                <button
                  onClick={handleDuplicate}
                  disabled={saving}
                  className="px-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Icons.Copy className="w-4 h-4" />
                  استنساخ كخلطة جديدة
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="relative group px-8 py-3 bg-primary text-slate-950 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="flex items-center gap-2">
                  {saving ? (
                    <Icons.Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icons.Save className="w-4 h-4" />
                  )}
                  {saving
                    ? d.lab.mix_designs.trial_metrics.labels.saving
                    : d.lab.mix_designs.trial_metrics.labels.save_report}
                </div>
              </button>
            </div>
          ) : (
            onCreateRevision && (
              <button
                onClick={() => setShowRevisionModal(true)}
                className="relative group px-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-amber-500/20 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Icons.GitBranch className="w-4 h-4" />
                  نسخة وتعديل أوزان جديدة
                </div>
              </button>
            )
          )}

          {effectivelyReadOnly && (
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="relative group px-6 py-3 bg-white/5 text-slate-300 border border-white/10 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-white/10 hover:text-white active:scale-95 transition-all flex items-center gap-2"
            >
              {isExporting ? (
                <Icons.Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Icons.FileText className="w-4 h-4" />
              )}
              تصدير PDF
            </button>
          )}

          {effectivelyReadOnly && onDuplicate && (
            <button
              onClick={handleDuplicate}
              disabled={saving}
              className="relative group px-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Icons.Copy className="w-4 h-4" />
              استنساخ كخلطة جديدة
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Report Body */}
      <div className="flex-1 overflow-y-auto pt-5 px-8 pb-2 space-y-5 max-w-7xl mx-auto w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-primary/50 relative z-10 transition-all">
        {/* Premium Navigation Tabs */}
        <div className="grid grid-cols-5 gap-4 px-1">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 group ${
                activeTab === sec.id
                  ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
                  : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              {activeTab === sec.id && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 bg-primary/10 blur-xl rounded-2xl"
                />
              )}
              <sec.icon
                className={`w-5 h-5 mb-2 transition-colors ${
                  activeTab === sec.id
                    ? "text-primary"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span
                className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                  activeTab === sec.id
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-400"
                }`}
              >
                {sec.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "identity" && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {[
                {
                  label: d.lab.mix_designs.client.plant,
                  val: mixInfo.plant,
                  key: "plant",
                  icon: Icons.Activity,
                  placeholder: "Plant name",
                },
                {
                  label: d.lab.mix_designs.client.strength_class,
                  val: mixInfo.strength,
                  key: "strength",
                  icon: Icons.ShieldCheck,
                  placeholder: "e.g., C30/37",
                },
                {
                  label:
                    d.lab.mix_designs.trial_metrics.labels.site_location ||
                    d.lab.mix_designs.client.site,
                  val: mixInfo.site,
                  key: "site",
                  icon: Icons.Target,
                  placeholder: "Site",
                },
                {
                  label: d.lab.mix_designs.v2_sections.identity,
                  val: mixInfo.mixName,
                  key: "mixName",
                  icon: Icons.FlaskConical,
                  placeholder: d.lab.mix_designs.v2_sections.identity,
                },
                {
                  label: d.lab.mix_designs.trial_metrics.labels.mix_reference,
                  val: generatedMixCode,
                  key: "mixRef",
                  icon: Icons.Database,
                  placeholder: "Mix Ref",
                },
                {
                  label: d.lab.mix_designs.trial_metrics.labels.customer,
                  val: mixInfo.customer,
                  key: "customer",
                  icon: Icons.Target,
                  full: true,
                  placeholder: "اسم العميل / المشروع",
                },
                {
                  label: "الحجم المستهدف (لتر)",
                  val: mixInfo.trialLiters,
                  key: "trialLiters",
                  icon: Icons.Target,
                  type: "number",
                  placeholder: "مثال: 1000",
                },
                {
                  label: d.lab.mix_designs.trial_metrics.labels.cement_type,
                  val: mixInfo.cementBrand,
                  key: "cementBrand",
                  icon: Icons.Box,
                  placeholder: "Cement brand/type",
                },
                {
                  label: "تاريخ إنشاء الخلطة",
                  val: mixInfo.date,
                  key: "date",
                  icon: Icons.Calendar,
                  type: "date_custom",
                },
                {
                  label: "نوع المضاف",
                  val: mixInfo.admixtureType,
                  key: "admixtureType",
                  icon: Icons.FlaskConical,
                  placeholder: "مثال: Type G",
                },
                {
                  label: "اسم المضاف",
                  val: mixInfo.admixtureName,
                  key: "admixtureName",
                  icon: Icons.Tag,
                  placeholder: "مثال: MasterGlenium",
                },
              ].map((field, idx) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`${field.key === "date" ? cardCls.replace("overflow-hidden", "") : cardCls} py-2.5 px-4 ${field.full ? "md:col-span-2" : ""}`}
                >
                  <div className={glowCls} />
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">
                          {field.label}
                        </span>
                        {field.key === "mixRef" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400">
                            <Icons.Cpu className="w-2.5 h-2.5 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">
                              {"تلقائي"}
                            </span>
                          </div>
                        )}
                      </div>
                      <field.icon className="w-4 h-4 text-slate-500" />
                    </div>
                    {field.key === "mixRef" ? (
                      <div className="relative group/code">
                        <input
                          type="text"
                          lang="en"
                          dir="ltr"
                          value={field.val}
                          readOnly
                          className="w-full bg-transparent border-b border-indigo-500/50 py-0.5 outline-none text-indigo-400 font-black text-sm md:text-xs lg:text-sm font-mono cursor-not-allowed opacity-80"
                          title={field.val as string}
                        />
                      </div>
                    ) : field.type === "number" ? (
                      <NumInput
                        value={field.val}
                        onChange={(v) =>
                          setMixInfo({ ...mixInfo, [field.key]: v })
                        }
                        className="w-full bg-transparent border-b border-white/5 py-0.5 focus:border-primary outline-none text-white font-black text-base font-mono"
                        placeholder={field.placeholder}
                        title={field.label}
                      />
                    ) : field.type === "date_custom" ? (
                      <DatePickerWheel
                        value={field.val as string}
                        onChange={(v) =>
                          setMixInfo({ ...mixInfo, [field.key]: v })
                        }
                        label={field.label}
                      />
                    ) : (
                      <input
                        type={field.type || "text"}
                        lang="en"
                        dir="ltr"
                        value={field.val as string}
                        onChange={(e) =>
                          setMixInfo({
                            ...mixInfo,
                            [field.key]: e.target.value,
                          })
                        }
                        className="w-full bg-transparent border-b border-white/5 py-0.5 focus:border-primary outline-none text-white font-black text-base font-mono"
                        placeholder={field.placeholder}
                        title={field.label}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "constants" && (
            <motion.div
              key="constants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cardCls}
            >
              <div className={glowCls} />
              <div className="relative z-10">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <Icons.Database className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {d.lab.mix_designs.materials.physical_props}
                    </h3>
                  </div>
                </div>
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/[0.01]">
                      <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase border-b border-white/5">
                        {d.lab.mix_designs.v2_sections.constants_table.material}
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase border-b border-white/5 text-center">
                        {d.lab.mix_designs.materials.specific_gravity}
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase border-b border-white/10 text-center">
                        {d.lab.mix_designs.materials.moisture}
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase border-b border-white/5 text-center">
                        {d.lab.mix_designs.materials.absorption}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {[
                      {
                        id: "cement",
                        label: d.lab.mix_designs.results.cement,
                        p: false,
                      },
                      {
                        id: "microsilica",
                        label: d.lab.mix_designs.results.micro_silica,
                        p: false,
                      },
                      {
                        id: "ggbfs",
                        label: d.lab.mix_designs.results.ggbfs,
                        p: false,
                      },
                      {
                        id: "flyAsh",
                        label: d.lab.mix_designs.results.fly_ash,
                        p: false,
                      },
                      {
                        id: "filler",
                        label: d.lab.mix_designs.trial_metrics.materials.filler,
                        p: false,
                      },
                      {
                        id: "sand",
                        label: d.lab.mix_designs.results.fine_agg,
                        p: true,
                      },
                      {
                        id: "naturalSand",
                        label:
                          d.lab.mix_designs.trial_metrics.materials
                            .natural_sand,
                        p: true,
                      },
                      {
                        id: "ca10mm",
                        label:
                          d.lab.mix_designs.trial_metrics.materials.ca_10mm,
                        p: true,
                      },
                      {
                        id: "ca20mm",
                        label: d.lab.mix_designs.results.coarse_agg,
                        p: true,
                      },
                    ].map((m) => {
                      const mat = (materials as any)[m.id];
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 px-6 text-xs font-bold text-white">
                            {m.label}
                          </td>
                          <td className="p-1">
                            <NumInput
                              value={mat.sg ?? ""}
                              onChange={(v) =>
                                setMaterials({
                                  ...materials,
                                  [m.id]: { ...mat, sg: v },
                                })
                              }
                              className={inputCls}
                              title={`${m.label} S.G.`}
                            />
                          </td>
                          <td className="p-1">
                            {m.p ? (
                              <NumInput
                                value={mat.moisture ?? ""}
                                onChange={(v) =>
                                  setMaterials({
                                    ...materials,
                                    [m.id]: { ...mat, moisture: v },
                                  })
                                }
                                className={inputCls}
                                title={`${m.label} M.C. %`}
                              />
                            ) : (
                              <div className="text-center text-slate-600">
                                ---
                              </div>
                            )}
                          </td>
                          <td className="p-1">
                            {m.p ? (
                              <NumInput
                                value={mat.absorption ?? ""}
                                onChange={(v) =>
                                  setMaterials({
                                    ...materials,
                                    [m.id]: { ...mat, absorption: v },
                                  })
                                }
                                className={inputCls}
                                title={`${m.label} Abs %`}
                              />
                            ) : (
                              <div className="text-center text-slate-600">
                                ---
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Admixture Direct Row */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="py-3 px-6 text-xs font-bold text-white">
                        {
                          d.lab.mix_designs.v2_sections.constants_table
                            .admixture
                        }
                      </td>
                      <td className="p-1">
                        <NumInput
                          value={materials.admixture?.sg ?? ""}
                          onChange={(v) =>
                            setMaterials({
                              ...materials,
                              admixture: { ...materials.admixture, sg: v },
                            })
                          }
                          className={inputCls}
                          title="Admixture S.G."
                        />
                      </td>
                      <td className="p-1">
                        <div className="text-center text-slate-600">---</div>
                      </td>
                      <td className="p-1">
                        <div className="text-center text-slate-600">---</div>
                      </td>
                    </tr>
                    {/* Target Water (E31) */}
                    <tr className="bg-cyan-500/5 border-t border-white/10">
                      <td className="py-3 px-6 text-xs font-black text-cyan-400 uppercase">
                        {d.lab.mix_designs.results.water}
                      </td>
                      <td className="p-1">
                        <NumInput
                          value={materials.water?.weight ?? ""}
                          onChange={(v) =>
                            setMaterials({
                              ...materials,
                              water: { ...materials.water, weight: v },
                            })
                          }
                          className={inputCls}
                          title="Target Water (L)"
                        />
                      </td>
                      <td
                        colSpan={2}
                        className="py-3 px-4 text-center text-[10px] text-slate-500 italic"
                      >
                        {d.lab.mix_designs.footer.target_wc} (L)
                      </td>
                    </tr>
                    {/* General Constants */}
                    <tr className="bg-primary/5 border-t border-white/10">
                      <td className="py-3 px-6 text-xs font-black text-primary uppercase">
                        {
                          d.lab.mix_designs.v2_sections.constants_table
                            .air_content
                        }
                      </td>
                      <td className="p-1">
                        <NumInput
                          value={
                            materials.airContent !== null
                              ? materials.airContent / 10
                              : ""
                          }
                          onChange={(v) =>
                            setMaterials({
                              ...materials,
                              airContent:
                                v !== ("" as any) ? (v as number) * 10 : null,
                            })
                          }
                          className={inputCls}
                          title="Air Content %"
                        />
                      </td>
                      <td
                        colSpan={2}
                        className="py-3 px-4 text-center text-[10px] text-slate-500 italic"
                      >
                        {
                          d.lab.mix_designs.v2_sections.constants_table
                            .added_volume_note
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "weights" && (
            <motion.div
              key="weights"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative"
            >
              {/* Left Column: Detailed Weights Table (8/12) */}
              <div className="xl:col-span-8">
                <div className={`${cardCls} overflow-hidden`}>
                  <div className={glowCls} />
                  <div className="relative z-10">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                          <Icons.Scale className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">
                          {d.lab.mix_designs.v2_sections.weights_table.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-500 uppercase block">
                            W/C Ratio:
                          </span>
                          <span className="text-sm font-black text-cyan-400 font-mono">
                            {(results.summary?.wcRatio || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/5" />
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-500 uppercase">
                            {d.lab.mix_designs.trial_metrics.total_volume}
                          </p>
                          <p className="text-sm font-black text-white font-mono">
                            {(results.summary?.totalVolume || 0).toFixed(2)}{" "}
                            <span className="text-[10px] text-slate-500">
                              L
                            </span>
                          </p>
                        </div>
                        <div className="w-[1px] h-8 bg-white/5" />
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-500 uppercase block">
                            {"المستهدف"}:
                          </span>
                          <span className="text-sm font-black text-primary font-mono">
                            {mixInfo.trialLiters || 1000}{" "}
                            <span className="text-[10px] text-slate-500">
                              L
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-white/[0.01]">
                          <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase border-b border-white/5">
                            {
                              d.lab.mix_designs.v2_sections.constants_table
                                .material
                            }
                          </th>
                          <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase border-b border-white/5 text-center">
                            {
                              d.lab.mix_designs.v2_sections.weights_table
                                .theoretical
                            }
                          </th>
                          <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase border-b border-white/5 text-center">
                            {d.lab.mix_designs.v2_sections.weights_table.batch}
                          </th>
                          <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase border-b border-white/5 text-center">
                            {d.lab.mix_designs.trial_metrics.total_volume}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {[
                          {
                            id: "cement",
                            label: d.lab.mix_designs.results.cement,
                          },
                          {
                            id: "microsilica",
                            label: d.lab.mix_designs.results.micro_silica,
                          },
                          {
                            id: "ggbfs",
                            label: d.lab.mix_designs.results.ggbfs,
                          },
                          {
                            id: "flyAsh",
                            label: d.lab.mix_designs.results.fly_ash,
                          },
                          {
                            id: "filler",
                            label:
                              d.lab.mix_designs.trial_metrics.materials.filler,
                          },
                          {
                            id: "water",
                            label: d.lab.mix_designs.results.water,
                          },
                          {
                            id: "sand",
                            label: d.lab.mix_designs.results.fine_agg,
                          },
                          {
                            id: "naturalSand",
                            label:
                              d.lab.mix_designs.trial_metrics.materials
                                .natural_sand,
                          },
                          {
                            id: "ca10mm",
                            label:
                              d.lab.mix_designs.trial_metrics.materials.ca_10mm,
                          },
                          {
                            id: "ca20mm",
                            label: d.lab.mix_designs.results.coarse_agg,
                          },
                          {
                            id: "admixture",
                            label: d.lab.mix_designs.results.admixture,
                          },
                        ].map((m) => {
                          const mat = (materials as any)[m.id];
                          const res = (results as any)[m.id];
                          if (!res) return null;

                          const isWater = m.id === "water";
                          let inputValue: any = "";
                          let inputTitle = "";

                          if (isWater) {
                            inputValue = Number(res.ssdWeight?.toFixed(1) || 0);
                            inputTitle =
                              d.lab.mix_designs.v2_sections.strength_tab
                                .fresh_title;
                          } else if (m.id === "admixture") {
                            inputValue = materials.admixture?.dosage;
                            inputTitle = d.lab.mix_designs.results.admixture;
                          }

                          return (
                            <tr
                              key={m.id}
                              className={`hover:bg-white/[0.01] ${isWater ? "bg-cyan-500/[0.02]" : ""}`}
                            >
                              <td className="py-3 px-6 text-xs font-bold text-white flex items-center justify-between">
                                <span
                                  className={isWater ? "text-cyan-300" : ""}
                                >
                                  {m.label}
                                </span>
                                {m.id === "admixture" && (
                                  <span className="text-[10px] text-primary/60 font-mono pl-2">
                                    %
                                  </span>
                                )}
                              </td>
                              <td className="p-1">
                                <NumInput
                                  value={
                                    m.id === "admixture"
                                      ? materials.admixture?.dosage
                                      : m.id === "water"
                                        ? inputValue
                                        : mat.weight
                                  }
                                  onChange={(v) => {
                                    if (m.id === "admixture")
                                      setMaterials({
                                        ...materials,
                                        admixture: {
                                          ...materials.admixture,
                                          dosage: v,
                                        },
                                      });
                                    else if (m.id === "water") {
                                      // The field displays SSD Water. We must calculate Target Water.
                                      // Target Water = SSD Water + (Target Water - SSD Water)
                                      const diff =
                                        (res.baseWeight || 0) -
                                        (res.ssdWeight || 0);
                                      setMaterials({
                                        ...materials,
                                        water: {
                                          ...materials.water,
                                          weight: Number(v) + diff,
                                        },
                                      });
                                    } else
                                      setMaterials({
                                        ...materials,
                                        [m.id]: { ...mat, weight: v },
                                      });
                                  }}
                                  className={`${inputCls} ${m.id === "admixture" ? "text-primary italic" : ""} ${isWater ? "bg-cyan-500/10 border-cyan-500/30 font-black text-cyan-400" : ""}`}
                                  title={m.label}
                                />
                              </td>
                              <td className="py-3 px-4 text-center text-xs font-mono text-slate-100 font-black">
                                <span lang="en" dir="ltr">
                                  {res.trialBatchWeight?.toFixed(2) || "0.00"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-xs font-mono text-slate-500">
                                <span lang="en" dir="ltr">
                                  {res.volume?.toFixed(2) || "0.00"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Volumetric Dashboard (4/12) */}
              <div className="xl:col-span-4 space-y-6">
                {/* Volumetric Visual Panel */}
                <div className="bg-slate-950/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                  <div className="text-center relative z-10">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                      {d.lab.trial.calculated_volume} (
                      {(mixInfo.trialLiters || 1000) / 1000}m³)
                    </h4>
                    <div className="text-3xl font-black text-white font-mono leading-none">
                      {(
                        (results.summary?.totalVolume || 0) /
                        ((mixInfo.trialLiters || 1000) / 100)
                      ).toFixed(2)}{" "}
                      <span className="text-primary text-xs">%</span>
                    </div>
                  </div>

                  {/* The Visual Cylinder */}
                  <div className="relative w-28 h-56 bg-slate-900/80 rounded-3xl border-2 border-white/10 overflow-hidden shadow-inner flex flex-col justify-end p-1.5 mt-8">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${Math.min(((results.summary?.totalVolume || 0) / (mixInfo.trialLiters || 1000)) * 100, 100)}%`,
                      }}
                      transition={{ type: "spring", damping: 15 }}
                      className={`w-full bg-gradient-to-t ${Math.abs((mixInfo.trialLiters || 1000) - (results.summary?.totalVolume || 0)) > 5 ? "from-amber-600 to-amber-400" : "from-primary to-indigo-400"} rounded-2xl relative shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)]`}
                    >
                      <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 blur-md" />
                    </motion.div>
                    {/* Scales */}
                    <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between items-end pr-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      {[1, 0.75, 0.5, 0.25, 0].map((mark) => (
                        <div key={mark} className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-white font-bold">
                            {(mixInfo.trialLiters || 1000) * mark}
                          </span>
                          <div className="w-2 h-[1px] bg-white/40" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full space-y-6 mt-10 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        {"سماحية الحجم"}
                      </span>
                      <span
                        className={`text-lg font-black font-mono ${Math.abs(results.summary?.volumeTolerance || 0) > 5 ? "text-amber-500" : "text-primary"}`}
                      >
                        {results.summary?.volumeTolerance?.toFixed(2) || "0.00"}{" "}
                        <span className="text-[10px]">L</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold border-t border-white/5 pt-4">
                      <span className="text-slate-500 uppercase">
                        {d.lab.mix_designs.results.density}
                      </span>
                      <span className="text-white font-mono">
                        {results.summary?.density?.toFixed(0) || "0"} kg/m³
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        className="h-full bg-indigo-500 opacity-40 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Volume Alert Message */}
                <AnimatePresence>
                  {Math.abs(
                    (mixInfo.trialLiters || 1000) -
                      (results.summary?.totalVolume || 0),
                  ) > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center gap-5"
                    >
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Icons.Activity className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                          {"تنبيه الكفاءة"}
                        </p>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          {`انحراف الحجم بمقدار ${Math.abs(results.summary?.volumeTolerance || 0).toFixed(2)} لتر عن المستهدف ${mixInfo.trialLiters || 1000}L.`}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "trial" && (
            <motion.div
              key="trial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              {/* Central Background Glow for high-tech feel */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
                {/* COLUMN 1: Labs & Input Configuration (4/12) */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="p-1 px-4 border-l-2 border-primary/40 mb-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                      {d.lab.mix_designs.trial_metrics.labels.trial_mix_design}
                    </h4>
                  </div>

                  {/* Sample Type Toggle - Premium Styled */}
                  <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-1.5 flex border border-white/5 shadow-inner">
                    <button
                      onClick={() =>
                        setMixInfo({ ...mixInfo, sampleType: "cube" })
                      }
                      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl text-[11px] font-black transition-all duration-500 ${
                        (mixInfo.sampleType || "cube") === "cube"
                          ? "bg-primary text-slate-950 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.4)] scale-[1.02]"
                          : "text-slate-500 hover:text-white"
                      }`}
                    >
                      <Icons.Box className="w-4 h-4" />
                      {d.lab.mix_designs.trial_metrics.sample_types.cubes}{" "}
                      (150mm)
                    </button>
                    <button
                      onClick={() =>
                        setMixInfo({ ...mixInfo, sampleType: "cylinder" })
                      }
                      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl text-[11px] font-black transition-all duration-500 ${
                        mixInfo.sampleType === "cylinder"
                          ? "bg-amber-500 text-slate-950 shadow-[0_4px_20px_rgba(245,158,11,0.4)] scale-[1.02]"
                          : "text-slate-500 hover:text-white"
                      }`}
                    >
                      <Icons.Target className="w-4 h-4" />
                      {
                        d.lab.mix_designs.trial_metrics.sample_types.cylinder
                      }{" "}
                      (15x30)
                    </button>
                  </div>

                  {/* High Definition Metric Controls */}
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        id: "count",
                        label: d.lab.mix_designs.trial_metrics.sample_count,
                        icon: Icons.Grid,
                        color: "text-amber-500",
                        bg: "bg-amber-500/5",
                        val: mixInfo.cubeCount,
                        unit: d.lab.mix_designs.v2_sections.strength_tab
                          .samples,
                        onChange: (v: number | null) => {
                          setMixInfo({
                            ...mixInfo,
                            cubeCount: v ?? 0,
                          });
                        },
                      },
                    ].map((card) => (
                      <div
                        key={card.id}
                        className="group relative bg-slate-900/60 border border-white/5 rounded-3xl p-6 hover:border-primary/20 transition-all duration-500 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                            {card.label}
                          </span>
                          <div
                            className={`p-2 ${card.bg} ${card.color} rounded-xl opacity-40 group-hover:opacity-100 transition-opacity`}
                          >
                            <card.icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <NumInput
                            value={card.val}
                            onChange={card.onChange}
                            className="bg-transparent border-none p-0 text-white font-mono font-black text-4xl w-full focus:ring-0 outline-none selection:bg-primary/20"
                          />
                          <span
                            className={`${card.color} text-[9px] font-black uppercase whitespace-nowrap`}
                          >
                            {card.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMN 2: System Data - Composition (5/12) */}
                <div className="xl:col-span-5 space-y-6">
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl">
                    <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                          <Icons.Database className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-[11px] font-black text-white uppercase tracking-wider leading-none mb-1">
                            {
                              d.lab.mix_designs.trial_metrics
                                .batch_weights_title
                            }
                          </h3>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-[9px] font-black text-slate-400 font-mono">
                          {d.lab.mix_designs.trial_metrics.unit_kg}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          {
                            id: "cement",
                            label: d.lab.mix_designs.results.cement,
                            color: "bg-primary",
                          },
                          {
                            id: "microsilica",
                            label: d.lab.mix_designs.results.micro_silica,
                            color: "bg-slate-400",
                          },
                          {
                            id: "ggbfs",
                            label: d.lab.mix_designs.results.ggbfs,
                            color: "bg-slate-400",
                          },
                          {
                            id: "flyAsh",
                            label: d.lab.mix_designs.results.fly_ash,
                            color: "bg-slate-400",
                          },
                          {
                            id: "filler",
                            label:
                              d.lab.mix_designs.trial_metrics.materials.filler,
                            color: "bg-slate-600",
                          },
                          {
                            id: "sand",
                            label: d.lab.mix_designs.results.fine_agg,
                            color: "bg-amber-600/60",
                          },
                          {
                            id: "naturalSand",
                            label:
                              d.lab.mix_designs.trial_metrics.materials
                                .natural_sand,
                            color: "bg-amber-700/60",
                          },
                          {
                            id: "ca10mm",
                            label:
                              d.lab.mix_designs.trial_metrics.materials.ca_10mm,
                            color: "bg-slate-500",
                          },
                          {
                            id: "ca20mm",
                            label: d.lab.mix_designs.results.coarse_agg,
                            color: "bg-slate-700",
                          },
                          {
                            id: "water",
                            label: d.lab.mix_designs.results.water,
                            color: "bg-blue-500",
                          },
                        ].map((comp) => {
                          const res = (results as any)[comp.id];
                          if (!res || res.trialBatchWeight <= 0) return null;

                          return (
                            <div
                              key={comp.id}
                              className="group p-3 px-4 hover:bg-white/[0.03] rounded-xl transition-all border border-transparent hover:border-white/5 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-1 h-3 rounded-full ${comp.color}`}
                                />
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-white">
                                    {comp.label}
                                  </span>
                                  <div className="text-[9px] font-mono text-slate-500">
                                    {(
                                      (res.trialBatchWeight /
                                        (results.summary?.totalWeight || 1)) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block text-base font-black text-white font-mono">
                                  {res.trialBatchWeight?.toFixed(3) || "0.000"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-6 bg-black/20 border-t border-white/5 mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {d.lab.mix_designs.materials.total_vol} (Kg)
                        </span>
                        <span className="text-xl font-black text-primary font-mono">
                          {results.summary?.totalWeight?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: Performance & Visualization (3/12) */}
                <div className="xl:col-span-3 space-y-6">
                  {/* Digital Mix Cylinder Visualization */}
                  <div className="bg-slate-950/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-between h-[400px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <div className="text-center relative z-10">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                        {d.lab.trial.calculated_volume}
                      </h4>
                      <div className="text-2xl font-black text-white font-mono leading-none">
                        {(mixInfo.trialLiters / 10).toFixed(2)}{" "}
                        <span className="text-primary text-xs">%</span>
                      </div>
                    </div>

                    {/* The "Liquid" Cylinder */}
                    <div className="relative w-24 h-48 bg-slate-900/80 rounded-3xl border-2 border-white/5 overflow-hidden shadow-inner flex flex-col justify-end p-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{
                          height: `${Math.min((mixInfo.trialLiters / 40) * 100, 100)}%`,
                        }}
                        transition={{ type: "spring", damping: 15 }}
                        className="w-full bg-gradient-to-t from-primary to-indigo-400 rounded-2xl relative shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                      >
                        <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 blur-md" />
                      </motion.div>
                      {/* Scales */}
                      <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between items-end pr-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        {[100, 75, 50, 25, 0].map((mark) => (
                          <div key={mark} className="flex items-center gap-2">
                            <span className="text-[7px] font-mono text-white font-bold">
                              {mark}
                            </span>
                            <div className="w-2 h-[1px] bg-white" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full space-y-4 relative z-10">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase">
                          {d.lab.mix_designs.results.density}
                        </span>
                        <span className="text-white font-mono">
                          {results.summary?.density?.toFixed(0) || "0"} kg/m³
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[85%] opacity-40 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      </div>
                    </div>
                  </div>

                  {/* Summary Micro-Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 transition-all hover:border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                          <Icons.Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                            {d.lab.mix_designs.results.wc_ratio}
                          </p>
                          <p className="text-lg font-black text-white font-mono leading-none">
                            {(
                              materials.water.weight / materials.cement.weight
                            ).toFixed(3)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 transition-all hover:border-amber-500/20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-500">
                          <Icons.Droplet className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                            {d.lab.cube_results.details.correction}
                          </p>
                          <p className="text-lg font-black text-white font-mono leading-none">
                            {results.summary?.waterCorrection?.toFixed(1) ||
                              "0.0"}{" "}
                            <span className="text-[10px] text-slate-500">
                              L
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "strength" && (
            <motion.div
              key="strength"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Left Column: Fresh Properties (Density, Tests) */}
              <div className="space-y-4 lg:col-span-1">
                {/* Compact Density Card */}
                <div className={`${cardCls} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icons.Box className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      كثافة الخلطة
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5">
                      <span className="text-[9px] text-slate-500 block uppercase mb-1">
                        وزن العينة (kg)
                      </span>
                      <NumInput
                        value={labResults.sampleWeight}
                        onChange={(v) =>
                          setLabResults({ ...labResults, sampleWeight: v ?? 0 })
                        }
                        className="w-full bg-transparent border-b border-white/10 text-white font-mono text-center outline-none py-1"
                      />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5">
                      <span className="text-[9px] text-slate-500 block uppercase mb-1">
                        حجم القالب (L)
                      </span>
                      <NumInput
                        value={labResults.sampleVolume}
                        onChange={(v) =>
                          setLabResults({ ...labResults, sampleVolume: v ?? 0 })
                        }
                        className="w-full bg-transparent border-b border-white/10 text-white font-mono text-center outline-none py-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      الكثافة (kg/m³)
                    </span>
                    <span className="text-xl font-black text-primary font-mono">
                      {labResults.freshDensity || "0"}
                    </span>
                  </div>
                </div>

                {/* Compact Fresh Tests Card */}
                <div className={`${cardCls} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icons.Activity className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      الفحوصات الطازجة
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors">
                        Ambient Temp (°C)
                      </span>
                      <NumInput
                        value={labResults.ambientTemp}
                        onChange={(v) =>
                          setLabResults({ ...labResults, ambientTemp: v ?? 0 })
                        }
                        className="w-20 text-center bg-transparent border-b border-white/10 py-1 text-white font-mono outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors">
                        T500 (sec)
                      </span>
                      <NumInput
                        value={labResults.t500}
                        onChange={(v) =>
                          setLabResults({ ...labResults, t500: v ?? 0 })
                        }
                        className="w-20 text-center bg-transparent border-b border-white/10 py-1 text-white font-mono outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors">
                        V-Funnel (sec)
                      </span>
                      <NumInput
                        value={labResults.vFunnel}
                        onChange={(v) =>
                          setLabResults({ ...labResults, vFunnel: v ?? 0 })
                        }
                        className="w-20 text-center bg-transparent border-b border-white/10 py-1 text-white font-mono outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Compressive Strength Table */}
              <div className="lg:col-span-1">
                <div
                  className={`${cardCls} p-0 overflow-hidden h-full flex flex-col`}
                >
                  <div className="p-2 border-b border-white/5 bg-slate-950/20">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {
                        d.lab.mix_designs.v2_sections.strength_tab
                          .compressive_title
                      }
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 lg:grid-cols-2 gap-4">
                    {Array.isArray(strengthResults) &&
                      strengthResults.map((res, i) => (
                        <div
                          key={res.age}
                          className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col hover:border-primary/30 transition-all group"
                        >
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>العمر</span>
                            <span className="text-white bg-white/5 px-2 py-0.5 rounded-md">
                              {res.age}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase mb-1 text-center">
                                S1 (MPa)
                              </span>
                              <NumInput
                                value={res.s1}
                                onChange={(v) => {
                                  const n = [...strengthResults];
                                  n[i].s1 = v;
                                  setStrengthResults(n);
                                }}
                                className="w-full text-center bg-slate-950/60 border border-white/10 rounded-xl py-2 px-2 text-white font-mono text-sm focus:border-primary/50 transition-all outline-none"
                                title={`${res.age} S1`}
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase mb-1 text-center">
                                S2 (MPa)
                              </span>
                              <NumInput
                                value={res.s2}
                                onChange={(v) => {
                                  const n = [...strengthResults];
                                  n[i].s2 = v;
                                  setStrengthResults(n);
                                }}
                                className="w-full text-center bg-slate-950/60 border border-white/10 rounded-xl py-2 px-2 text-white font-mono text-sm focus:border-primary/50 transition-all outline-none"
                                title={`${res.age} S2`}
                              />
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                              المعدل
                            </span>
                            <span className="font-mono font-black text-primary text-lg bg-primary/10 px-3 py-1 rounded-lg">
                              {((res.s1 + res.s2) / 2).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Full Width Row: Slump Retention Table */}
              <div className="lg:col-span-2">
                <div className={`${cardCls} p-0 overflow-hidden`}>
                  <div className="p-3 border-b border-white/5 bg-slate-950/20 flex items-center gap-2">
                    <Icons.Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">
                      {"الاحتفاظ بالقابلية للتشغيل (Slump Retention)"}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-slate-900/40 text-[9px] text-slate-500 uppercase font-black">
                          <th className="py-2 px-4 text-left border-r border-white/5">
                            وقت الفحص
                          </th>
                          {labResults.intervals.map((int: any) => (
                            <th
                              key={`head-${int.time || int.age}`}
                              className="py-2 px-2 text-primary"
                            >
                              {int.time || int.age} mnt
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        <tr className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-2 px-4 text-[10px] font-bold text-slate-400 text-left border-r border-white/5">
                            Slump/Flow (mm)
                          </td>
                          {labResults.intervals.map((int: any, i: number) => (
                            <td key={`slump-${i}`} className="py-1 px-1">
                              <NumInput
                                value={int.slump}
                                onChange={(v) => {
                                  const n = [...labResults.intervals];
                                  n[i].slump = v ?? 0;
                                  setLabResults({
                                    ...labResults,
                                    intervals: n,
                                  });
                                }}
                                className="w-full text-center bg-transparent border-b border-white/5 rounded-md py-1.5 px-1 text-white font-mono text-sm focus:border-primary/50 transition-all outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-2 px-4 text-[10px] font-bold text-slate-400 text-left border-r border-white/5">
                            Concrete Temp (°C)
                          </td>
                          {labResults.intervals.map((int: any, i: number) => (
                            <td key={`temp-${i}`} className="py-1 px-1">
                              <NumInput
                                value={int.temp}
                                onChange={(v) => {
                                  const n = [...labResults.intervals];
                                  n[i].temp = v ?? 0;
                                  setLabResults({
                                    ...labResults,
                                    intervals: n,
                                  });
                                }}
                                className="w-full text-center bg-transparent border-b border-white/5 rounded-md py-1.5 px-1 text-white font-mono text-sm focus:border-primary/50 transition-all outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText || "تأكيد"}
        secondaryText={confirmConfig.secondaryText}
        onSecondary={
          confirmConfig.onSecondary
            ? () => {
                confirmConfig.onSecondary!();
                setConfirmConfig((p) => ({ ...p, isOpen: false }));
              }
            : undefined
        }
      />

      {/* Revision Modal */}
      <AnimatePresence>
        {showRevisionModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRevisionModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                  <Icons.GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">نسخة جديدة</h3>
                  <p className="text-xs text-slate-400">
                    سيتم تجميد النسخة الحالية وإنشاء نسخة مسودة جديدة للتعديل
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">
                    سبب التعديل
                  </label>
                  <textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="مثال: تقليل نسبة الأسمنت بناءً على طلب العميل"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-500/50 outline-none min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    if (!onCreateRevision) return;
                    setSaving(true);
                    try {
                      await onCreateRevision(
                        revisionNote,
                        mixInfo.mixName,
                        mixInfo.mixRef,
                      );
                      setShowRevisionModal(false);
                      // Form will reload naturally if wrapper handles state/refresh
                    } catch (e: unknown) {
                      toast.error(
                        (e as Error).message || "Failed to create revision",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !revisionNote.trim()}
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Icons.Loader className="w-4 h-4 animate-spin" />}
                  إنشاء وتعديل الأوزان
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
