"use client";

import { useState } from "react";
import type { Vehicle, Material, MixDesign } from "@prisma/client";
import styles from "./manager.module.css";
import { toast } from "@/lib/toast";

interface ManagerDashboardClientProps {
  initialVehicles: Vehicle[];
  materials: Material[];
  mixes: MixDesign[];
  lang: "en" | "ar";
}

interface AnalysisResult {
  possible: boolean;
  required: {
    name: string;
    perM3: number;
    totalRequired: number;
    inStock: number;
    status: "OK" | "LOW";
  }[];
  maxPossibleVolume: number;
}

export default function ManagerDashboardClient({
  initialVehicles,
  materials,
  mixes,
  lang,
}: ManagerDashboardClientProps) {
  // Vehicle State
  const [vehicles] = useState<Vehicle[]>(initialVehicles);

  // Analysis State
  const [selectedMixId, setSelectedMixId] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

  const handleAnalyze = () => {
    if (!selectedMixId || !qty) return;

    const mix = mixes.find((m) => m.id.toString() === selectedMixId) as any;
    if (!mix) return;

    try {
      let ingredients: Record<string, number> = {};

      if (typeof mix.ingredients === "string") {
        if (mix.ingredients.trim().startsWith("{")) {
          ingredients = JSON.parse(mix.ingredients);
        } else {
          const pairs = mix.ingredients.split(",");
          pairs.forEach((pair: string) => {
            const [name, amount] = pair.split(":");
            if (name && amount) {
              ingredients[name.trim()] = parseFloat(amount.trim());
            }
          });
        }
      } else {
        ingredients = mix.ingredients;
      }

      const required: AnalysisResult["required"] = [];
      let possible = true;
      let maxPossibleVolume = Infinity;

      Object.entries(ingredients).forEach(([name, amountPerM3]) => {
        const material = materials.find(
          (m) => m.name.toLowerCase() === name.toLowerCase(),
        );
        const totalRequired = Number(amountPerM3) * Number(qty);
        const inStock = material?.stock || 0;
        const isEnough = inStock >= totalRequired;

        if (!isEnough) possible = false;
        if (Number(amountPerM3) > 0) {
          const canMake = inStock / Number(amountPerM3);
          if (canMake < maxPossibleVolume) maxPossibleVolume = canMake;
        }

        required.push({
          name: name,
          perM3: amountPerM3,
          totalRequired: totalRequired,
          inStock: inStock,
          status: isEnough ? "OK" : "LOW",
        });
      });

      setAnalysisResult({ possible, required, maxPossibleVolume });
    } catch (e) {
      console.error("Error parsing mix ingredients", e);
      toast.error("خطأ في قراءة بيانات الخلطة");
    }
  };

  const isRtl = lang === "ar";
  // Helper for grid items: 2 cols on very large screens inside the split view
  // Actually, inside a 50% split, 2 cols is good.

  return (
    <div className={styles.container} dir={isRtl ? "rtl" : "ltr"}>
      {/* TOP ROW: Quick Actions & Fleet Stats Side-by-Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* RIGHT (LTR) / LEFT (RTL): Quick Actions (Primary) */}
        <section className={styles.section} style={{ marginBottom: 0 }}>
          <h2 className={`section-title ${styles.sectionTitle}`}>
            {"إجراءات سريعة"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="/system/manager/users"
              className="group p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 hover:border-blue-400 transition-all hover:-translate-y-1 h-32 flex flex-col justify-center items-center text-center"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 group-hover:bg-blue-500 text-blue-400 group-hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {"إضافة موظف"}
              </h3>
            </a>

            <a
              href="/system/manager/projects"
              className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 hover:border-emerald-400 transition-all hover:-translate-y-1 h-32 flex flex-col justify-center items-center text-center"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {"طلب جديد"}
              </h3>
            </a>

            <a
              href="/system/manager/logs"
              className="group p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 hover:border-purple-400 transition-all hover:-translate-y-1 h-32 flex flex-col justify-center items-center text-center"
            >
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2 group-hover:bg-purple-500 text-purple-400 group-hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {"سجل النظام"}
              </h3>
            </a>

            <a
              href="#"
              className="group p-6 rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/30 hover:border-amber-400 transition-all hover:-translate-y-1 opacity-70 cursor-not-allowed h-32 flex flex-col justify-center items-center text-center"
              title="Coming Soon"
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-2 text-amber-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {"المخزون"}
              </h3>
            </a>
          </div>
        </section>

        {/* LEFT (LTR) / RIGHT (RTL): Fleet Status */}
        <section className={styles.section} style={{ marginBottom: 0 }}>
          <h2 className={`section-title ${styles.sectionTitle}`}>
            {"حالة الآليات"}
          </h2>

          <div className="grid grid-cols-2 gap-4 h-[calc(100%-3rem)]">
            <div
              className={`card glass-panel ${styles.statCard} flex flex-col justify-center h-32`}
            >
              <div className="small-title opacity-70">{"العدد الكلي"}</div>
              <div className={styles.statValue}>{vehicles.length}</div>
            </div>
            <div
              className={`card glass-panel ${styles.statCard} flex flex-col justify-center h-32`}
            >
              <div className="small-title opacity-70">{"الصالحة"}</div>
              <div className={`${styles.statValue} ${styles.statValueSuccess}`}>
                {vehicles.filter((v) => v.status === "ACTIVE").length}
              </div>
            </div>
            <div
              className={`card glass-panel ${styles.statCard} flex flex-col justify-center h-32`}
            >
              <div className="small-title opacity-70">{"غير الصالحة"}</div>
              <div className={`${styles.statValue} ${styles.statValueDanger}`}>
                {vehicles.filter((v) => v.status !== "ACTIVE").length}
              </div>
            </div>
            <div
              className={`card glass-panel ${styles.statCard} flex flex-col justify-center h-32`}
            >
              <div className="small-title opacity-70">{"داخل المعمل"}</div>
              <div className={`${styles.statValue} ${styles.statValueWarning}`}>
                {vehicles.filter((v) => v.location === "INSIDE").length}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Row 2: Material Analysis */}
      <section className={styles.section}>
        <h2 className={`section-title ${styles.sectionTitle}`}>
          {"تحليل المواد"}
        </h2>

        <div className={`glass-panel ${styles.analysisPanel}`}>
          <div className={styles.controlsContainer}>
            <div className={styles.controlGroup}>
              <label className={`small-title ${styles.label}`}>
                {"اختر الخلطة"}
              </label>
              <select
                className={`form-input ${styles.select}`}
                onChange={(e) => setSelectedMixId(e.target.value)}
                value={selectedMixId}
              >
                <option value="">---</option>
                {mixes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.controlGroup}>
              <label className={`small-title ${styles.label}`}>
                {"الكمية المطلوبة (متر مكعب)"}
              </label>
              <input
                type="number"
                className={`form-input ${styles.input}`}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>
            <button
              className={`btn btn-primary ${styles.analyzeBtn}`}
              onClick={handleAnalyze}
            >
              {"تحليل"}
            </button>
          </div>

          {analysisResult && (
            <div className={styles.resultContainer}>
              <div
                className={`card glass-panel ${analysisResult.possible ? "status-LAB_APPROVED" : "status-DISPATCHED"} ${styles.resultCard} ${analysisResult.possible ? styles.resultSuccess : styles.resultFailure}`}
              >
                <div>
                  <h3
                    className={`${styles.resultTitle} ${analysisResult.possible ? styles.resultTitleSuccess : styles.resultTitleFailure}`}
                  >
                    {analysisResult.possible
                      ? "المواد متوفرة"
                      : "المواد غير كافية"}
                  </h3>
                  {!analysisResult.possible && (
                    <div className={styles.resultDetails}>
                      Max: {analysisResult.maxPossibleVolume.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className={styles.resultIcon}>
                  {analysisResult.possible ? "✅" : "❌"}
                </div>
              </div>

              <table className="table mt-4 w-full">
                <thead>
                  <tr>
                    <th>{"المادة"}</th>
                    <th>{"المطلوب"}</th>
                    <th>{"المتوفر"}</th>
                    <th>{"الحالة"}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.required.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.totalRequired.toFixed(1)}</td>
                      <td>{row.inStock.toFixed(1)}</td>
                      <td>
                        <span
                          className={`status-badge ${row.status === "OK" ? "status-LAB_APPROVED" : "status-DISPATCHED"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Row 3: Fleet Table (Full Width) */}
      <section className={styles.section}>
        <h2 className={`section-title ${styles.sectionTitle}`}>
          {"تفاصيل الآليات"}
        </h2>
        <div className={`glass-panel ${styles.tableContainer}`}>
          <table className="table">
            <thead>
              <tr>
                <th>{"الرمز"}</th>
                <th>{"النوع"}</th>
                <th>{"الحالة"}</th>
                <th>{"الموقع"}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className={styles.tableCode}>{v.code}</td>
                  <td>{v.type}</td>
                  <td>
                    <span
                      className={`status-badge ${v.status === "ACTIVE" ? "status-LAB_APPROVED" : "status-DISPATCHED"}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${v.location === "INSIDE" ? styles.locationInside : styles.locationOutside}`}
                    >
                      {v.location}
                    </span>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.noData}>
                    {"لا توجد آليات مسجلة"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
