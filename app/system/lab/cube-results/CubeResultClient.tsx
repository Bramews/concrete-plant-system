"use client";

import { useState, useMemo, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { adminRoles } from "@/app/lib/roles";
import {
  addMultipleCubeResults,
  approveCubeResult,
  deleteCubeResult,
} from "@/app/actions/lab";
import { updateLabSetting } from "@/app/actions/lab-settings";
import {
  calculateCompressiveStrength,
  Specimen,
  ForceUnit,
  StressUnit,
} from "@/lib/lab/calculations";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dictionary } from "@/lib/dictionary";
import { CubeTrackingDashboard } from "@/components/lab/CubeTrackingDashboard";

interface FieldSettings {
  showDimensions: boolean;
  showLoadUnit: boolean;
  showAge: boolean;
  showWeight: boolean;
  showKnColumn: boolean;
  showMpaColumn: boolean;
  autoCalcMpa: boolean;
  showDensityColumn: boolean;
  defaultSpecimen: "CUBE" | "CYLINDER";
  [key: string]: any;
}

interface Test {
  id: string | number;
  status: string;
  orderId?: number;
  order: any;
  age?: number;
  sampleDate: string | Date;
  kn?: number | null;
  mpa?: number | null;
  strength?: number | null;
  notes?: string;
  type?: string;
  user?: {
    name?: string;
  };
}

interface Order {
  id: string | number;
  orderNumber: string;
  clientName?: string;
  date?: string | Date;
  customer?: { name?: string } | null;
}

interface Standard {
  id: string;
  code: string;
  name: string;
}

interface CubeResultClientProps {
  tests: Test[];
  orders: Order[];
  userRole: string;
  preferences: Record<string, string>;
  standards: Standard[];
  initialSettings?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}

export function CubeResultClient({
  tests,
  orders,
  userRole,
  preferences,
  standards,
  initialSettings = {},
  dict,
}: CubeResultClientProps) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"table" | "dashboard">(
    "dashboard",
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const configuredAges = useMemo(() => {
    const raw = initialSettings["testing.ages"] || "3, 7, 28";
    return raw
      .split(",")
      .map((a) => a.trim())
      .filter((a) => !isNaN(Number(a)) && a.length > 0)
      .map(Number);
  }, [initialSettings]);
  const [selectedStandard, setSelectedStandard] = useState(
    initialSettings["standard.cubes"] || "",
  );
  const [testingAgesInput, setTestingAgesInput] = useState(
    initialSettings["testing.ages"] || "3, 7, 28",
  );

  useEffect(() => {
    if (initialSettings["standard.cubes"]) {
      setSelectedStandard(initialSettings["standard.cubes"]);
    }
    if (initialSettings["testing.ages"]) {
      setTestingAgesInput(initialSettings["testing.ages"]);
    }
  }, [initialSettings]);

  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cube-result-fields");
      if (saved) return JSON.parse(saved);
    }
    return {
      showDimensions: false,
      showLoadUnit: false,
      showAge: true,
      showWeight: true,
      showKnColumn: true,
      showMpaColumn: true,
      autoCalcMpa: true,
      showDensityColumn: true,
      defaultSpecimen: "CUBE" as "CUBE" | "CYLINDER",
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cube-result-fields", JSON.stringify(fieldSettings));
    }
  }, [fieldSettings]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewedTest, setViewedTest] = useState<Test | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const t = dict.cube_results; // shorthand

  // Permissions
  // Deprecated granular edit roles – now using adminRoles for settings access
  const allowedApproveRoles = [
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "DEPARTMENT_MANAGER",
    "COMPANY_ADMIN",
    "MANAGER",
    "SYSTEM_OWNER",
  ];
  const allowedStandardsRoles = [
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "DEPARTMENT_MANAGER",
    "COMPANY_ADMIN",
    "MANAGER",
    "SYSTEM_OWNER",
  ];

  const canManageSettings = allowedStandardsRoles.includes(userRole);
  const canEdit = ["LAB_TECHNICIAN", ...allowedStandardsRoles].includes(
    userRole,
  );
  const canApprove = allowedApproveRoles.includes(userRole);
  const canManageStandards = allowedStandardsRoles.includes(userRole);

  // Determine Active Standard
  const activeStandardCode = preferences["COMPRESSIVE_STRENGTH"] || "BS_1881";
  const activeStandard = standards.find((s) => s.code === activeStandardCode);
  const isCylinder =
    activeStandardCode.includes("ASTM") || activeStandardCode.includes("ACI");
  const defaultShape = isCylinder ? "CYLINDER" : "CUBE";

  const formatStandardCode = (code: string) => {
    if (code === "BS_1881") return "BS 1881 (British Standard - Cube)";
    if (code === "ASTM_C39") return "ASTM C39 (American Standard - Cylinder)";
    if (code === "EN_12390") return "EN 12390 (European Standard)";
    return code.replace(/_/g, " ");
  };

  // Merge active orders and orders from tests to ensure clicked order is always selectable
  const allAvailableOrders = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        orderNumber: string;
        clientName: string;
        date?: Date | string;
      }
    >();

    // Add active orders
    orders.forEach((o) => {
      const oid = Number(o.id);
      map.set(oid, {
        id: oid,
        orderNumber: o.orderNumber,
        clientName: o.clientName || o.customer?.name || "عميل عام",
        date: o.date,
      });
    });

    // Add orders from tests
    tests.forEach((t) => {
      if (t.order) {
        const orderId = Number(t.orderId || t.order.id);
        if (orderId && !map.has(orderId)) {
          map.set(orderId, {
            id: orderId,
            orderNumber: t.order.orderNumber,
            clientName:
              t.order.clientName || t.order.customer?.name || "عميل عام",
            date: t.sampleDate,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [orders, tests]);

  const [formData, setFormData] = useState(() => {
    const specType =
      (typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("cube-result-fields") || "{}")
            ?.defaultSpecimen
        : undefined) || defaultShape;
    return {
      orderId: "",
      sampleDate: "",
      testDate: format(new Date(), "yyyy-MM-dd"),
      loadUnit: "kN" as ForceUnit,
      sharedAge: "",
      width: "150",
      height: specType === "CYLINDER" ? "300" : "150",
      diameter: "150",
      shape: (specType || defaultShape) as "CUBE" | "CYLINDER",
      tests: [
        { id: crypto.randomUUID(), loadValue: "", weight: "", mpaValue: "" },
      ],
    };
  });

  const addDaysToString = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return format(d, "yyyy-MM-dd");
  };

  const handleOpenCreateForOrder = (
    orderId: number,
    sampleDate: string,
    age: number,
  ) => {
    const specType =
      (typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("cube-result-fields") || "{}")
            ?.defaultSpecimen
        : undefined) || defaultShape;

    const formattedSampleDate = format(new Date(sampleDate), "yyyy-MM-dd");
    const formattedTestDate = addDaysToString(formattedSampleDate, age);

    setFormData({
      orderId: String(orderId),
      sampleDate: formattedSampleDate,
      testDate: formattedTestDate,
      loadUnit: "kN" as ForceUnit,
      sharedAge: String(age),
      width: "150",
      height: specType === "CYLINDER" ? "300" : "150",
      diameter: "150",
      shape: (specType || defaultShape) as "CUBE" | "CYLINDER",
      tests: [
        { id: crypto.randomUUID(), loadValue: "", weight: "", mpaValue: "" },
      ],
    });
    setIsCreateOpen(true);
  };

  // Auto-calculate sampleDate when Order is selected
  useEffect(() => {
    if (formData.orderId && allAvailableOrders) {
      const selectedOrder = allAvailableOrders.find(
        (o) => String(o.id) === String(formData.orderId),
      );
      if (selectedOrder && selectedOrder.date && !formData.sampleDate) {
        setFormData((prev) => ({
          ...prev,
          sampleDate: format(new Date(selectedOrder.date!), "yyyy-MM-dd"),
        }));
      }
    }
  }, [formData.orderId, allAvailableOrders]);

  // Auto-calculate shared age when sampleDate or testDate changes
  useEffect(() => {
    if (formData.sampleDate && formData.testDate) {
      const sample = new Date(formData.sampleDate);
      const test = new Date(formData.testDate);
      const diffDays = Math.ceil(
        Math.abs(test.getTime() - sample.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (!isNaN(diffDays)) {
        setFormData((prev) => ({ ...prev, sharedAge: String(diffDays) }));
      }
    }
  }, [formData.sampleDate, formData.testDate]);

  const [resultUnit] = useState<StressUnit>("MPa");

  // Real-time calculation for all tests
  const calculationResults = useMemo(() => {
    return formData.tests.map((test) => {
      let calc = null;
      let density = 0;

      if (test.loadValue) {
        const force = parseFloat(test.loadValue);
        if (!isNaN(force)) {
          const specimen: Specimen = {
            shape: formData.shape,
            dimensions: {
              width: parseFloat(formData.width),
              height: parseFloat(formData.height),
              diameter: parseFloat(formData.diameter),
            },
          };

          calc = calculateCompressiveStrength(
            force,
            formData.loadUnit,
            specimen,
            activeStandardCode,
            resultUnit,
          );
        }
      }

      // Calculate Density
      if (test.weight) {
        const weightKg = parseFloat(test.weight) / 1000; // grams to kg
        let volumeM3 = 0;
        if (formData.shape === "CUBE") {
          volumeM3 =
            (parseFloat(formData.width) / 1000) *
            (parseFloat(formData.width) / 1000) *
            (parseFloat(formData.height) / 1000);
        } else if (formData.shape === "CYLINDER") {
          volumeM3 =
            Math.PI *
            Math.pow(parseFloat(formData.diameter) / 2000, 2) *
            (parseFloat(formData.height) / 1000);
        }
        if (!isNaN(weightKg) && volumeM3 > 0) {
          density = weightKg / volumeM3;
        }
      }

      return { id: test.id, calc, density };
    });
  }, [
    formData.tests,
    formData.loadUnit,
    formData.shape,
    formData.width,
    formData.height,
    formData.diameter,
    activeStandardCode,
    resultUnit,
  ]);

  const addTestRow = () => {
    setFormData((prev) => ({
      ...prev,
      tests: [
        ...prev.tests,
        { id: crypto.randomUUID(), loadValue: "", weight: "", mpaValue: "" },
      ],
    }));
  };

  const removeTestRow = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.filter((t) => t.id !== id),
    }));
  };

  const handleOpenCreate = () => {
    const specType =
      (typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("cube-result-fields") || "{}")
            ?.defaultSpecimen
        : undefined) || defaultShape;
    setFormData({
      orderId: "",
      sampleDate: "",
      testDate: format(new Date(), "yyyy-MM-dd"),
      loadUnit: "kN" as ForceUnit,
      sharedAge: "",
      width: "150",
      height: specType === "CYLINDER" ? "300" : "150",
      diameter: "150",
      shape: (specType || defaultShape) as "CUBE" | "CYLINDER",
      tests: [
        { id: crypto.randomUUID(), loadValue: "", weight: "", mpaValue: "" },
      ],
    });
    setIsCreateOpen(true);
  };

  const updateTestField = (
    id: string,
    field: "loadValue" | "weight" | "mpaValue",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) =>
        t.id === id ? { ...t, [field]: value } : t,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only submit if we have valid tests
    const validTests = formData.tests.filter(
      (t) => t.loadValue && parseFloat(t.loadValue) > 0,
    );
    if (validTests.length === 0 || !formData.sharedAge) {
      toast.error("يرجى إدخال العمر وقيمة التحمل لكل نموذج.");
      return;
    }

    setLoading(true);
    try {
      await addMultipleCubeResults({
        orderId: Number(formData.orderId),
        sampleDate: new Date(formData.sampleDate || new Date()),
        tests: validTests.map((t) => ({
          age: parseInt(formData.sharedAge),
          kn: parseFloat(t.loadValue),
        })),
        standardSnapshot: JSON.stringify({
          code: activeStandardCode,
          shape: formData.shape,
          dimensions: {
            width: parseFloat(formData.width),
            height: parseFloat(formData.height),
            diameter: parseFloat(formData.diameter),
          },
        }),
      });
      toast.success(dict.common.save + " " + dict.common.status);
      setIsCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add test results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {(canManageStandards || canManageSettings) && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all border border-white/8 shadow-md hover:scale-105 active:scale-95 shrink-0"
              title="إعدادات النماذج الخرسانية"
            >
              <Icons.Settings className="w-5 h-5 text-indigo-400 hover:text-indigo-300" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
            >
              <Icons.Plus className="w-5 h-5" />
              {t.create_btn}
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveMode("dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === "dashboard"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            تتبع المكعبات والإحصائيات
          </button>
          <button
            onClick={() => setActiveMode("table")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === "table"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            جدول النتائج التفصيلي
          </button>
        </div>
      </div>

      {activeMode === "dashboard" ? (
        <CubeTrackingDashboard
          tests={tests}
          onSelectOrderAge={handleOpenCreateForOrder}
        />
      ) : (
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden backdrop-blur-sm">
          {tests.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-indigo-500/30 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <Icons.Activity className="w-10 h-10 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {t.no_results}
              </h3>
              <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                لا توجد أي نتائج مسجلة حتى الآن. استخدم زر الإضافة للبدء في
                توثيق النتائج لتحليلها ومطابقتها مع المواصفات القياسية.
              </p>
              {canEdit && (
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 active:scale-95 group"
                >
                  <Icons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  {t.create_btn}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-950/50 text-slate-400 text-sm font-bold uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-center">#</th>
                    <th className="px-6 py-4">{t.table.date}</th>
                    <th className="px-6 py-4">{t.table.standard}</th>
                    <th className="px-6 py-4">{t.table.age}</th>
                    {fieldSettings.showMpaColumn && (
                      <th className="px-6 py-4">{t.table.strength}</th>
                    )}
                    {fieldSettings.showKnColumn && (
                      <th className="px-6 py-4">kN</th>
                    )}
                    <th className="px-6 py-4">{t.table.status}</th>
                    <th className="px-6 py-4">{t.table.technician}</th>
                    <th className="px-6 py-4 text-center">
                      {dict.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tests.map((test, index) => (
                    <tr
                      key={test.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-slate-500 font-mono text-sm font-bold text-center">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300">
                        {format(new Date(test.sampleDate), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm font-bold">
                        {test.notes?.split("|")[0]?.split(":")[1]?.trim() ||
                          "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold border border-white/5">
                          {test.age} {t.age.split(" ")[0]}
                        </span>
                      </td>
                      {fieldSettings.showMpaColumn && (
                        <td className="px-6 py-4 text-emerald-400 font-bold font-mono">
                          {(test.strength || 0).toFixed(2)} MPa
                        </td>
                      )}
                      {fieldSettings.showKnColumn && (
                        <td className="px-6 py-4 text-indigo-400 font-bold font-mono">
                          {test.kn ? test.kn.toFixed(1) : "-"} kN
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {test.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-bold border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {dict.tests?.status?.pending || "Pending"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold border border-emerald-500/20">
                            <Icons.Check className="w-3 h-3" />
                            {dict.tests?.status?.completed || "Completed"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm font-bold">
                        {test.user?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewedTest(test)}
                            title={dict.common.view || "عرض"}
                            className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <Icons.Eye className="w-4 h-4" />
                          </button>
                          <button
                            title={dict.common.print || "تحميل"}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.print();
                            }}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Icons.Download className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              title={dict.common.edit || "تعديل"}
                              onClick={() => {
                                toast.info("جاري تجهيز شاشة التعديل...");
                              }}
                              className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              <Icons.Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              title={dict.common.delete || "حذف"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTestId(Number(test.id));
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Icons.Trash className="w-4 h-4" />
                            </button>
                          )}
                          {canApprove && test.status === "PENDING" && (
                            <button
                              title={dict.common.approve || "اعتماد"}
                              onClick={() => {
                                // verify implementation
                                toast.promise(
                                  approveCubeResult(Number(test.id)),
                                  {
                                    loading: dict.common.save + "...",
                                    success: dict.common.save + "!",
                                    error: dict.errors.general,
                                  },
                                );
                                router.refresh();
                              }}
                              aria-label={dict.common.approve || "Approve"}
                              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                            >
                              <Icons.Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-transparent p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-[#0d1117] rounded-t-3xl sm:rounded-2xl border border-white/8 shadow-2xl flex flex-col max-h-[95vh]"
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <Icons.Plus className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white leading-none">
                      {t.form.title}
                    </h2>
                    <p className="text-sm font-bold text-slate-500 mt-0.5">
                      نتائج النماذج الخرسانية
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  aria-label="Close"
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="px-5 pb-5 space-y-4 overflow-y-auto flex-1">
                  {/* Order selector */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="order-select"
                      className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1"
                    >
                      {t.form.order || "الطلب"}
                    </label>
                    <div className="relative">
                      <select
                        required
                        id="order-select"
                        title="Order"
                        className="w-full appearance-none bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all pr-8"
                        value={formData.orderId}
                        onChange={(e) =>
                          setFormData({ ...formData, orderId: e.target.value })
                        }
                      >
                        <option value="" className="bg-slate-900">
                          {t.form.select_order}
                        </option>
                        {allAvailableOrders.map((o) => (
                          <option
                            key={o.id}
                            value={o.id}
                            className="bg-slate-900"
                          >
                            {o.orderNumber} — {o.clientName}
                          </option>
                        ))}
                      </select>
                      <Icons.ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  {/* Dates + Age — 3 pill columns */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="sample-date"
                        className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1"
                      >
                        عينة
                      </label>
                      <input
                        type="text"
                        id="sample-date"
                        required
                        inputMode="numeric"
                        dir="ltr"
                        lang="en"
                        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                        placeholder="YYYY-MM-DD"
                        title="تاريخ العينة"
                        autoComplete="off"
                        className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-indigo-500/60 transition-all placeholder:text-slate-600"
                        value={formData.sampleDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sampleDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="test-date"
                        className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1"
                      >
                        فحص
                      </label>
                      <input
                        type="text"
                        id="test-date"
                        required
                        inputMode="numeric"
                        dir="ltr"
                        lang="en"
                        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                        placeholder="YYYY-MM-DD"
                        title="تاريخ الفحص"
                        autoComplete="off"
                        className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-indigo-500/60 transition-all placeholder:text-slate-600"
                        value={formData.testDate}
                        onChange={(e) =>
                          setFormData({ ...formData, testDate: e.target.value })
                        }
                      />
                    </div>
                    {fieldSettings.showAge && (
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="shared-age"
                          className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1"
                        >
                          عمر/يوم
                        </label>
                        <input
                          id="shared-age"
                          type="number"
                          list="age-opts"
                          dir="ltr"
                          lang="en"
                          title="عمر النموذج باليوم"
                          autoComplete="off"
                          className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-indigo-500/60 transition-all placeholder:text-slate-600"
                          value={formData.sharedAge}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sharedAge: e.target.value,
                            })
                          }
                        />
                        <datalist id="age-opts">
                          {configuredAges.map((age) => (
                            <option key={age} value={age} />
                          ))}
                        </datalist>
                      </div>
                    )}
                  </div>

                  {/* Dimensions (optional) */}
                  {fieldSettings.showDimensions && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">
                          عرض (mm)
                        </span>
                        <input
                          type="number"
                          aria-label="Width"
                          dir="ltr"
                          lang="en"
                          autoComplete="off"
                          className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/60 transition-all"
                          value={formData.width}
                          onChange={(e) =>
                            setFormData({ ...formData, width: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">
                          ارتفاع (mm)
                        </span>
                        <input
                          type="number"
                          aria-label="Height"
                          dir="ltr"
                          lang="en"
                          autoComplete="off"
                          className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/60 transition-all"
                          value={formData.height}
                          onChange={(e) =>
                            setFormData({ ...formData, height: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* ── SPECIMENS ── */}
                  <div className="space-y-1.5">
                    {/* Column headers */}
                    <div
                      className="grid items-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1"
                      style={{
                        gridTemplateColumns: `20px${fieldSettings.showWeight ? " 1fr" : ""} 1fr${fieldSettings.showMpaColumn ? " 1fr" : ""}${fieldSettings.showDensityColumn ? " 52px" : ""} 20px`,
                      }}
                    >
                      <span className="text-center">#</span>
                      {fieldSettings.showWeight && (
                        <span className="text-center">
                          وزن
                          <br />
                          <sub className="font-normal normal-case text-slate-700">
                            g
                          </sub>
                        </span>
                      )}
                      <span className="text-center">
                        المقاومة
                        <br />
                        <sub className="font-normal normal-case text-slate-700">
                          kN
                        </sub>
                      </span>
                      {fieldSettings.showMpaColumn && (
                        <span className="text-center text-emerald-700">
                          مقاومة
                          <br />
                          <sub className="font-normal normal-case">MPa</sub>
                        </span>
                      )}
                      {fieldSettings.showDensityColumn && (
                        <span className="text-center text-indigo-600">
                          كثافة
                        </span>
                      )}
                      <span />
                    </div>

                    {formData.tests.map((test, i) => {
                      const result = calculationResults.find(
                        (r) => r.id === test.id,
                      );
                      const autoMpa = result?.calc
                        ? result.calc.strength.toFixed(1)
                        : "";
                      return (
                        <motion.div
                          key={test.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="group grid items-center gap-2 bg-white/3 hover:bg-white/5 border border-white/6 rounded-xl px-3 py-2 transition-colors"
                          style={{
                            gridTemplateColumns: `20px${fieldSettings.showWeight ? " 1fr" : ""} 1fr${fieldSettings.showMpaColumn ? " 1fr" : ""}${fieldSettings.showDensityColumn ? " 52px" : ""} 20px`,
                          }}
                        >
                          {/* # */}
                          <span className="text-sm font-bold text-slate-600 font-mono text-center">
                            {i + 1}
                          </span>

                          {/* Weight */}
                          {fieldSettings.showWeight && (
                            <input
                              type="number"
                              step="0.001"
                              dir="ltr"
                              lang="en"
                              placeholder="0.000"
                              title="Weight (g)"
                              autoComplete="off"
                              className="w-full bg-transparent border-0 border-b border-white/10 focus:border-white/30 px-1 py-0.5 text-sm text-white font-mono outline-none text-center transition-colors placeholder:text-slate-700"
                              value={test.weight}
                              onChange={(e) =>
                                updateTestField(
                                  test.id,
                                  "weight",
                                  e.target.value,
                                )
                              }
                            />
                          )}

                          {/* kN */}
                          <input
                            type="number"
                            step="0.01"
                            dir="ltr"
                            lang="en"
                            placeholder="0.00"
                            required
                            title="Load (kN)"
                            autoComplete="off"
                            className="w-full bg-transparent border-0 border-b border-white/10 focus:border-indigo-500/50 px-1 py-0.5 text-sm text-white font-mono outline-none text-center transition-colors placeholder:text-slate-700"
                            value={test.loadValue}
                            onChange={(e) =>
                              updateTestField(
                                test.id,
                                "loadValue",
                                e.target.value,
                              )
                            }
                          />

                          {/* MPa — always editable, auto-filled */}
                          {fieldSettings.showMpaColumn && (
                            <input
                              type="number"
                              step="0.01"
                              dir="ltr"
                              lang="en"
                              title="Strength (MPa)"
                              autoComplete="off"
                              className="w-full bg-transparent border-0 border-b border-emerald-500/20 focus:border-emerald-400/50 px-1 py-0.5 text-sm text-emerald-400 font-mono outline-none text-center transition-colors placeholder:text-emerald-900"
                              value={test.mpaValue ?? autoMpa}
                              placeholder={autoMpa || "0.00"}
                              onChange={(e) =>
                                updateTestField(
                                  test.id,
                                  "mpaValue",
                                  e.target.value,
                                )
                              }
                            />
                          )}

                          {/* Density — auto badge */}
                          {fieldSettings.showDensityColumn && (
                            <span
                              className={`text-sm font-bold font-mono text-center rounded-md px-1.5 py-0.5 ${result && result.density > 0 ? "text-indigo-400 bg-indigo-500/8" : "text-slate-700"}`}
                            >
                              {result && result.density > 0
                                ? String(Math.round(result.density)).slice(0, 4)
                                : "—"}
                            </span>
                          )}

                          {/* Delete */}
                          <div className="w-6 h-6 flex items-center justify-center">
                            {formData.tests.length > 1 && (
                              <button
                                type="button"
                                title="حذف"
                                onClick={() => removeTestRow(test.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-90 transition-all shadow-sm shadow-rose-500/10"
                              >
                                <Icons.X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Add specimen button */}
                    <button
                      type="button"
                      title="إضافة نموذج"
                      onClick={addTestRow}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-400 border border-dashed border-white/8 hover:border-indigo-500/30 rounded-xl transition-all hover:bg-indigo-500/5"
                    >
                      <Icons.Plus className="w-3 h-3" />
                      إضافة نموذج
                    </button>
                  </div>

                  {/* Area/CF info strip */}
                  {calculationResults.some((r) => r.calc) &&
                    calculationResults[0]?.calc && (
                      <div className="flex gap-3 text-[9px] font-mono text-slate-700 px-1">
                        <span>
                          A={Math.round(calculationResults[0].calc.area)}mm²
                        </span>
                        <span>
                          CF={calculationResults[0].calc.correctionFactor}
                        </span>
                      </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/5 flex justify-between items-center flex-shrink-0 bg-[#0d1117]/80">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-sm text-slate-500 hover:text-white transition-colors px-3 py-2"
                  >
                    {dict.common.cancel || "إلغاء"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white text-sm rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Icons.Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Icons.Save className="w-3.5 h-3.5" />
                    )}
                    {dict.common.save || "حفظ"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-[#0b0f19]/95 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col text-white rtl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Icons.Settings className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      إعدادات النماذج الخرسانية
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      إعدادات النظام الفنية وتفضيلات واجهة المختبر
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: System & Standard Settings */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-indigo-400 border-b border-white/5 pb-2 flex items-center gap-2">
                      <Icons.Scale className="w-4 h-4" />
                      إعدادات النظام الفنية (قاعدة البيانات)
                    </h3>

                    {/* Reference Standard */}
                    <div className="space-y-2 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <label className="text-xs font-bold text-slate-300 block">
                        المواصفة المعتمدة:
                      </label>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
                        اختر المواصفة المرجعية لتقارير كسر المكعبات لضمان
                        الامتثال للمتطلبات الهندسية.
                      </p>
                      <select
                        value={selectedStandard}
                        onChange={(e) => setSelectedStandard(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">
                          -- غير محدد --
                        </option>
                        {standards.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-slate-900"
                          >
                            {s.code} — {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Testing Ages */}
                    <div className="space-y-2 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <label className="text-xs font-bold text-slate-300 block">
                        أعمار الفحص المعتمدة (مفصولة بفاصلة):
                      </label>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
                        أدخل الأعمار المستخدمة في عملية الكسر ليتم اقتراحها
                        وتطبيقها تلقائياً.
                      </p>
                      <input
                        type="text"
                        value={testingAgesInput}
                        onChange={(e) => setTestingAgesInput(e.target.value)}
                        placeholder="مثال: 3, 7, 28"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Right Column: UI Preferences & Columns */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-indigo-400 border-b border-white/5 pb-2 flex items-center gap-2">
                      <Icons.Activity className="w-4 h-4" />
                      تفضيلات العرض والواجهة (محلية)
                    </h3>

                    {/* Default Shape */}
                    <div className="space-y-2 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <label className="text-xs font-bold text-slate-300 block">
                        شكل النموذج الافتراضي:
                      </label>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
                        الشكل القياسي الذي سيتم استخدامه للعينات الجديدة
                        المضافة.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFieldSettings((s) => ({
                              ...s,
                              defaultSpecimen: "CUBE",
                            }))
                          }
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                            (fieldSettings.defaultSpecimen || "CUBE") === "CUBE"
                              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-md"
                              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          🧱 مكعب (CUBE)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFieldSettings((s) => ({
                              ...s,
                              defaultSpecimen: "CYLINDER",
                            }))
                          }
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                            fieldSettings.defaultSpecimen === "CYLINDER"
                              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-md"
                              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          🔩 اسطوانة (CYLINDER)
                        </button>
                      </div>
                    </div>

                    {/* Fields Visibility Toggles */}
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3.5">
                      <label className="text-xs font-bold text-slate-300 block border-b border-white/5 pb-1.5">
                        حقول الإدخال والجدول:
                      </label>

                      {[
                        {
                          key: "showAge",
                          label: "عمر النموذج (Age)",
                          desc: "إظهار حقل عمر النموذج باليوم",
                        },
                        {
                          key: "showDimensions",
                          label: "أبعاد العينة (Dimensions)",
                          desc: "إظهار الطول/العرض/الارتفاع للنموذج",
                        },
                        {
                          key: "showLoadUnit",
                          label: "وحدات الحمل (Load Units)",
                          desc: "تمكين اختيار وحدة قياس الحمل",
                        },
                        {
                          key: "showWeight",
                          label: "الوزن (Weight)",
                          desc: "إظهار حقل الوزن بالجرام",
                        },
                        {
                          key: "showKnColumn",
                          label: "إظهار عمود الحمل (kN)",
                          desc: "عرض قيمة الحمل بالجدول",
                        },
                        {
                          key: "showMpaColumn",
                          label: "إظهار عمود المقاومة (MPa)",
                          desc: "عرض قيمة الكسر النهائية بالجدول",
                        },
                        {
                          key: "autoCalcMpa",
                          label: "حساب المقاومة تلقائياً (MPa)",
                          desc: "حساب MPa تلقائياً من kN والأبعاد",
                        },
                        {
                          key: "showDensityColumn",
                          label: "حساب الكثافة تلقائياً",
                          desc: "حساب الكثافة تلقائياً من الوزن والأبعاد",
                        },
                      ].map((pref) => {
                        const val = fieldSettings[pref.key] !== false;
                        return (
                          <div
                            key={pref.key}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <h5 className="text-xs font-bold text-white">
                                {pref.label}
                              </h5>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {pref.desc}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFieldSettings((s) => ({
                                  ...s,
                                  [pref.key]: !val,
                                }))
                              }
                              className={`w-10 h-5 rounded-full flex items-center transition-colors p-0.5 ${val ? "bg-indigo-500" : "bg-slate-700"}`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${val ? "-translate-x-5" : "translate-x-0"}`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-slate-900/40 flex justify-end gap-3 rounded-b-[2.5rem]">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white font-bold transition-all text-xs border border-white/5"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    // Clean testing ages input (trim spaces)
                    const cleanedAges = testingAgesInput
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => !isNaN(Number(a)) && a.length > 0)
                      .join(", ");

                    try {
                      const [resStandard, resAges] = await Promise.all([
                        updateLabSetting("standard.cubes", selectedStandard),
                        updateLabSetting(
                          "testing.ages",
                          cleanedAges || "3, 7, 28",
                        ),
                      ]);

                      if (resStandard.success && resAges.success) {
                        toast.success("تم تحديث الإعدادات بنجاح");
                        setIsSettingsOpen(false);
                        router.refresh();
                      } else {
                        toast.error("فشل تحديث بعض الإعدادات");
                      }
                    } catch {
                      toast.error("حدث خطأ أثناء حفظ الإعدادات");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Icons.Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icons.Save className="w-4 h-4" />
                  )}
                  حفظ الإعدادات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Result Modal */}
      <AnimatePresence>
        {viewedTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewedTest(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0d1117] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900">
                <h3 className="text-lg font-bold text-white">تفاصيل النتيجة</h3>
                <button
                  onClick={() => setViewedTest(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-bold">التاريخ</span>
                  <span className="font-mono">
                    {format(new Date(viewedTest.sampleDate), "yyyy-MM-dd")}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-bold">العمر</span>
                  <span>{viewedTest.age} يوم</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-bold">الحمل (kN)</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {viewedTest.kn?.toFixed(1) || "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-bold">
                    المقاومة (MPa)
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {viewedTest.strength?.toFixed(2) || "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-bold">الحالة</span>
                  <span>
                    {viewedTest.status === "PENDING" ? "قيد الانتظار" : "مكتمل"}
                  </span>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/5 bg-slate-900 flex justify-end gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icons.FileText className="w-4 h-4" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => setViewedTest(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTestId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
              <p className="text-slate-400 mb-6">
                هل أنت متأكد من رغبتك في حذف هذه النتيجة؟ هذا الإجراء لا يمكن
                التراجع عنه.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTestId(null)}
                  className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    const id = deleteTestId;
                    setDeleteTestId(null);
                    const loadingId = toast.loading("جاري الحذف...");
                    try {
                      const res = await deleteCubeResult(id);
                      if (res.success) {
                        toast.success("تم الحذف بنجاح", { id: loadingId });
                        router.refresh();
                      } else {
                        toast.error(res.error || "خطأ في الحذف", {
                          id: loadingId,
                        });
                      }
                    } catch (e) {
                      toast.error("حدث خطأ غير متوقع", { id: loadingId });
                    }
                  }}
                  className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
