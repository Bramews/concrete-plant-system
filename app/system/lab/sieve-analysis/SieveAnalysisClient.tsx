"use client";
/* eslint-disable react/no-unknown-property */

import { useState, useEffect, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { calculateSieveResults } from "@/lib/sieve-calculations";
import { addSieveAnalysis, getSieveTests } from "@/app/actions/lab";
import SievePrintModal from "@/components/lab/SievePrintModal";
import dynamic from "next/dynamic";
import { toast } from "@/lib/toast";
import { getDictionary } from "@/lib/dictionary";
import { WifiOff, Database } from "lucide-react";

const SieveChart = dynamic(() => import("@/components/lab/SieveChart"), {
  ssr: false,
});

const MATERIAL_CONFIGS: Record<string, any> = {
  رمل: {
    id: "sand_magshool",
    sieves: [9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15],
    limits: {
      9.5: { min: 100, max: 100 },
      4.75: { min: 95, max: 100 },
      2.36: { min: 80, max: 100 },
      1.18: { min: 50, max: 85 },
      0.6: { min: 25, max: 60 },
      0.3: { min: 5, max: 30 },
      0.15: { min: 0, max: 10 },
    },
  },
  "بحص 12-5": {
    id: "gravel_5_12",
    sieves: [12.5, 9.5, 4.75, 2.36, 1.18],
    limits: {
      12.5: { min: 100, max: 100 },
      9.5: { min: 90, max: 100 },
      4.75: { min: 0, max: 15 },
      2.36: { min: 0, max: 5 },
      1.18: { min: 0, max: 2 },
    },
  },
  "حصى 20-5": {
    id: "gravel_5_20",
    sieves: [25, 19, 12.5, 9.5, 4.75, 2.36],
    limits: {
      25: { min: 100, max: 100 },
      19: { min: 90, max: 100 },
      12.5: { min: 25, max: 60 },
      9.5: { min: 0, max: 10 },
      4.75: { min: 0, max: 5 },
      2.36: { min: 0, max: 2 },
    },
  },
};

export default function SieveAnalysisClient({
  branding,
  initialTests = [],
  lang = "ar",
}: {
  branding?: any;
  initialTests?: any[];
  lang?: "ar" | "en";
}) {
  const d = getDictionary(lang);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultCount, setResultCount] = useState(initialTests.length);
  const [pastTests, setPastTests] = useState(initialTests);

  const [selectedMaterialId, setSelectedMaterialId] = useState("رمل");
  const [totalWeight, setTotalWeight] = useState("");
  const [dryingWeight, setDryingWeight] = useState("");
  const [washingWeight, setWashingWeight] = useState("");

  const [location, setLocation] = useState("الديوانية - حي المعلمين");
  const [supplier, setSupplier] = useState("شركة بابل للمقاولات");
  const [fieldNo, setFieldNo] = useState("STOCK-01");
  const [source, setSource] = useState("كسارة النبأ المركزية");
  const [sampleDate, setSampleDate] = useState("");
  const [testDate, setTestDate] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [readings, setReadings] = useState<any[]>(
    MATERIAL_CONFIGS["رمل"].sieves.map((s: number) => ({
      size: s,
      weight: "",
    })),
  );

  const [specification, setSpecification] = useState("ASTM C136");
  const [customLimits, setCustomLimits] = useState<
    Record<number, { min: number; max: number }>
  >(MATERIAL_CONFIGS["رمل"].limits);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const syncOfflineTests = async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    const offline = JSON.parse(
      localStorage.getItem("offline_sieve_tests") || "[]",
    );
    if (offline.length === 0) return;

    toast.info(`جاري مزامنة ${offline.length} فحص غير متصل...`);
    let successCount = 0;
    const remaining: any[] = [];

    for (const test of offline) {
      try {
        const res = await addSieveAnalysis(test);
        if (res && (res as any).success !== false) {
          successCount++;
        } else {
          remaining.push(test);
        }
      } catch (err) {
        remaining.push(test);
      }
    }

    localStorage.setItem("offline_sieve_tests", JSON.stringify(remaining));
    setPendingSyncCount(remaining.length);

    if (successCount > 0) {
      toast.success(`تمت مزامنة ${successCount} فحص بنجاح ✓`);
      const updated = await getSieveTests();
      setPastTests(updated);
      setResultCount(updated.length);
    }
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const updateOnlineStatus = () => {
        const offlineStat = !navigator.onLine;
        setIsOffline(offlineStat);
        if (!offlineStat) {
          syncOfflineTests();
        }
      };
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);

      const offline = JSON.parse(
        localStorage.getItem("offline_sieve_tests") || "[]",
      );
      setPendingSyncCount(offline.length);

      if (navigator.onLine && offline.length > 0) {
        syncOfflineTests();
      }

      return () => {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
      };
    }
  }, []);

  const handleMaterialChange = (mat: string) => {
    const config = MATERIAL_CONFIGS[mat];
    setSelectedMaterialId(mat);
    setReadings(config.sieves.map((s: number) => ({ size: s, weight: "" })));
    setCustomLimits(config.limits);
  };

  const calculatedData = useMemo(() => {
    const tw = Number(totalWeight) || 0;
    const res = calculateSieveResults(
      readings.map((r) => ({
        size: r.size,
        weightRetained: Number(r.weight) || 0,
      })),
      tw,
      customLimits,
    );
    const mCont = tw > 0 ? ((tw - (Number(dryingWeight) || 0)) / tw) * 100 : 0;
    const cCont = tw > 0 ? ((tw - (Number(washingWeight) || 0)) / tw) * 100 : 0;
    return {
      ...res,
      moistureContent: mCont.toFixed(2),
      clayContent: cCont.toFixed(2),
      finenessModulus: res.finenessModulus || "0.00",
    };
  }, [readings, totalWeight, customLimits, dryingWeight, washingWeight]);

  const allPass = calculatedData.results.every((r) => r.status === "PASS");

  const handleAddAndReset = async () => {
    const testData = {
      materialId: selectedMaterialId === "رمل" ? 1 : 2,
      totalWeight: Number(totalWeight) || 0,
      dryWeight: Number(dryingWeight) || undefined,
      washWeight: Number(washingWeight) || undefined,
      readings: readings.reduce(
        (acc, r) => ({ ...acc, [r.size]: Number(r.weight) }),
        {},
      ),
      source,
      location,
      supplier,
      fieldNo,
      sampleDate,
      testDate,
      reportDate,
      labNo: `${String(resultCount + 1).padStart(3, "0")}/${new Date().getFullYear()}`,
    };

    setSaving(true);
    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        // Save offline
        const offline = JSON.parse(
          localStorage.getItem("offline_sieve_tests") || "[]",
        );
        offline.push(testData);
        localStorage.setItem("offline_sieve_tests", JSON.stringify(offline));
        setPendingSyncCount(offline.length);

        toast.warning(
          "تم الحفظ محلياً (وضع عدم الاتصال). سيتم الرفع تلقائياً عند عودة الإنترنت.",
        );
        setResultCount((p) => p + 1);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);

        const config = MATERIAL_CONFIGS[selectedMaterialId];
        setReadings(
          config.sieves.map((s: number) => ({ size: s, weight: "" })),
        );
        setTotalWeight("");
        setDryingWeight("");
        setWashingWeight("");
        return;
      }

      const res = await addSieveAnalysis(testData);

      if (res && (res as any).success === false) {
        if ((res as any).error === "NOT_AUTHENTICATED") {
          window.location.href = "/api/auth/session-cleanup";
          return;
        }
        toast.error((res as any).error || "فشل حفظ البيانات");
        return;
      }

      setResultCount((p) => p + 1);
      setShowSuccess(true);
      const updated = await getSieveTests();
      setPastTests(updated);
      setTimeout(() => setShowSuccess(false), 2000);
      const config = MATERIAL_CONFIGS[selectedMaterialId];
      // Keep metadata fields (dates, supplier, source, etc.) as is for "Update Daily" logic
      setReadings(config.sieves.map((s: number) => ({ size: s, weight: "" })));
      setTotalWeight("");
      setDryingWeight("");
      setWashingWeight("");
    } catch (e) {
      console.error(e);
      // Fallback to offline storage on network exception
      if (typeof window !== "undefined") {
        const offline = JSON.parse(
          localStorage.getItem("offline_sieve_tests") || "[]",
        );
        offline.push(testData);
        localStorage.setItem("offline_sieve_tests", JSON.stringify(offline));
        setPendingSyncCount(offline.length);
        toast.warning("حدث خطأ في الشبكة. تم حفظ الفحص محلياً.");

        setResultCount((p) => p + 1);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);

        const config = MATERIAL_CONFIGS[selectedMaterialId];
        setReadings(
          config.sieves.map((s: number) => ({ size: s, weight: "" })),
        );
        setTotalWeight("");
        setDryingWeight("");
        setWashingWeight("");
      }
    } finally {
      setSaving(false);
    }
  };

  const labNo = `${String(resultCount + 1).padStart(3, "0")}/${new Date().getFullYear()}`;

  if (loading)
    return (
      <div className="z-root" dir="rtl">
        <style jsx global>
          {zStyles}
        </style>
        <div className="z-load">
          <div className="z-spin" />
          <span className="z-load-t">جاري المزامنة...</span>
        </div>
      </div>
    );

  return (
    <div className="z-root" dir="rtl">
      <style jsx global>
        {zStyles}
      </style>

      {/* Toast */}
      {showSuccess && (
        <div className="z-toast">
          <Icons.CheckCircle className="z-toast-i" />
          <span>تمت الإضافة</span>
          <span className="z-toast-n western-nums">#{resultCount}</span>
        </div>
      )}

      {/* ═══ LAYOUT: 3-column grid ═══ */}
      <div className="z-grid">
        {/* ── COL 1: Sidebar (Sample Info) ── */}
        <aside className="z-side">
          <div className="z-side-top">
            <button
              onClick={() => window.history.back()}
              className="z-back"
              title="رجوع"
            >
              <Icons.ChevronRight className="z-back-i" />
            </button>
            <div className="z-brand">
              <div className="z-badge">
                <Icons.Lab className="z-badge-i" />
              </div>
              <div className="z-brand-t">
                <span className="z-brand-name">معلومات العينة</span>
                <span className="z-brand-sub western-nums">
                  {/* Specification text removed */}
                </span>
              </div>
            </div>
          </div>

          <div className="z-side-meta">
            {[
              {
                label: "تاريخ أخذ العينة",
                value: sampleDate,
                setter: setSampleDate,
                type: "text",
                icon: Icons.Clock,
              },
              {
                label: "تاريخ الفحص",
                value: testDate,
                setter: setTestDate,
                type: "text",
                icon: Icons.Clock,
              },
              {
                label: "المورد",
                value: supplier,
                setter: setSupplier,
                icon: Icons.Truck,
              },
              {
                label: "المصدر",
                value: source,
                setter: setSource,
                icon: Icons.Globe,
              },
              {
                label: "المخزون",
                value: fieldNo,
                setter: setFieldNo,
                icon: Icons.Hash,
              },
            ].map((f, i) => (
              <div key={i} className="z-mf">
                <div className="z-mf-h">
                  <f.icon className="z-mf-ic" />
                  <span>{f.label}</span>
                </div>
                <input
                  type={(f as any).type || "text"}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="z-mf-inp"
                />
              </div>
            ))}
            <div className="z-mf">
              <div className="z-mf-h">
                <Icons.Info className="z-mf-ic" />{" "}
                {/* Changed icon and label */}
                <span>معلومات العينة</span> {/* Changed label */}
              </div>
              <div className="z-mf-ro">
                <span className="z-mf-ro-v western-nums">{labNo}</span>
              </div>
            </div>
          </div>

          {/* Notes filling the rest of the sidebar */}
          <div className="z-notes">
            <div className="z-notes-h">
              <Icons.FileText className="z-mf-ic" />
              <span>ملاحظات التقرير</span>
            </div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="أضف أية ملاحظات حول العينة وتفاصيل إضافية..."
              className="z-notes-inp"
            />
          </div>
        </aside>

        {/* ── COL 2: Main Table ── */}
        <main className="z-main">
          {/* Offline Banner */}
          {isOffline && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-between text-sm font-bold animate-pulse">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-amber-500" />
                <span>وضع عدم الاتصال بالإنترنت - يتم حفظ الفحوصات محلياً</span>
              </div>
            </div>
          )}

          {pendingSyncCount > 0 && !isOffline && (
            <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-between text-sm font-bold">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 animate-bounce" />
                <span>
                  هناك {pendingSyncCount} فحص محفوظ محلياً بانتظار المزامنة
                </span>
              </div>
              <button
                onClick={syncOfflineTests}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                مزامنة الآن
              </button>
            </div>
          )}

          {/* Material Tabs + Weights Row */}
          <div className="z-top-row">
            <div className="z-mats">
              {Object.keys(MATERIAL_CONFIGS).map((mat) => (
                <button
                  key={mat}
                  onClick={() => handleMaterialChange(mat)}
                  className={`z-mat ${selectedMaterialId === mat ? "z-mat-on" : ""}`}
                >
                  {mat}
                </button>
              ))}
            </div>
            <div className="z-ws">
              {[
                {
                  l: "رطب",
                  v: totalWeight,
                  s: setTotalWeight,
                  c: "zw-c",
                },
                { l: "جاف", v: dryingWeight, s: setDryingWeight, c: "zw-a" },
                { l: "غسل", v: washingWeight, s: setWashingWeight, c: "zw-p" },
              ].map((w, i) => (
                <div key={i} className={`z-w ${w.c}`}>
                  <span className="z-w-l">{w.l}</span>
                  <input
                    type="text"
                    value={w.v}
                    onChange={(e) => w.s(e.target.value)}
                    placeholder="0"
                    className="z-w-inp western-nums"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Data Tracks (Meticulous Layout) */}
          <div className="z-tracks-wrap">
            <div className="z-tk-header">
              <div className="z-tk-h-sz">فتحة المنخل</div>
              <div className="z-tk-h-inp">المحجوز (جم)</div>
              <div className="z-tk-h-cl">المحجوز تراكمي (جم)</div>
              <div className="z-tk-h-cl">المحجوز تراكمي (٪)</div>
              <div className="z-tk-h-cl">نسبة المار (٪)</div>
              <div className="z-tk-h-lim">المواصفة</div>
              <div className="z-tk-h-st">التقييم</div>
            </div>
            {calculatedData.results.map((r, i) => {
              const lim = customLimits[r.size];
              const pass = r.status === "PASS";
              return (
                <div key={i} className={`z-tk ${!pass ? "z-tk-f" : ""}`}>
                  <div className="z-tk-sz">
                    <span className="z-tk-sz-v western-nums">{r.size}</span>
                  </div>
                  <div className="z-tk-inp-c">
                    <input
                      type="text"
                      value={
                        readings.find((x) => x.size === r.size)?.weight || ""
                      }
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        const nr = [...readings];
                        const idx = nr.findIndex((x) => x.size === r.size);
                        if (idx !== -1) {
                          nr[idx].weight = val;
                          setReadings(nr);
                        }
                      }}
                      className="z-tinp western-nums"
                    />
                  </div>
                  <div className="z-tk-cl western-nums">
                    {r.cumulativeWeightAbsolute.toFixed(1)}
                  </div>
                  <div className="z-tk-cl western-nums">
                    {r.cumulativeRetained.toFixed(1)}%
                  </div>
                  <div className="z-tk-cl z-text-sky western-nums">
                    {r.passing.toFixed(1)}%
                  </div>
                  <div className="z-tk-lim western-nums">
                    {lim ? `${lim.min}–${lim.max}` : "–"}
                  </div>
                  <div className="z-tk-st">
                    <span className={`z-bg ${pass ? "z-bg-ok" : "z-bg-no"}`}>
                      {pass ? "مطابق" : "خارج"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats + Save below table */}
          <div className="z-bottom">
            <div className="z-bottom-stats">
              <div className="z-bs">
                <span className="z-bs-k">
                  {d.lab.sieve_analysis.results.fm_result}
                </span>
                <span className="z-bs-v z-bs-ind western-nums">
                  {calculatedData.finenessModulus}
                </span>
              </div>
              <div className="z-bs">
                <span className="z-bs-k">
                  {d.lab.sieve_analysis.results.clay_content}
                </span>
                <span className="z-bs-v z-bs-amb western-nums">
                  {calculatedData.clayContent}%
                </span>
              </div>
              <div className="z-bs">
                <span className="z-bs-k">
                  {d.lab.sieve_analysis.results.moisture_result}
                </span>
                <span className="z-bs-v z-bs-cyn western-nums">
                  {calculatedData.moistureContent}%
                </span>
              </div>
            </div>
            <button
              onClick={handleAddAndReset}
              disabled={saving}
              className="z-save"
            >
              {saving ? (
                <div className="z-save-sp" />
              ) : (
                <Icons.Plus className="z-save-i" />
              )}
              <span>حفظ التقرير</span>
            </button>
          </div>
        </main>

        <section className="z-chart-col">
          <div className="z-chart-card">
            <h3 className="z-chart-title">
              منحنى التدرج الحبيبي ({specification || "ASTM C33"})
            </h3>
            <div className="z-chart-container">
              <SieveChart
                data={calculatedData.results}
                standards={[
                  {
                    name: specification || "ASTM C33",
                    sieves: Object.entries(customLimits).map(([sz, lim]) => ({
                      size: Number(sz),
                      min: lim.min,
                      max: lim.max,
                    })),
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </div>

      <SievePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={{
          ...calculatedData,
          source,
          location,
          supplier,
          fieldNo,
          testDate,
          material: { name: selectedMaterialId },
        }}
        branding={branding}
      />
    </div>
  );
}

const zStyles = `
  .z-root,.z-root *{box-sizing:border-box}
  footer{display:none!important}
  .z-root{min-height:100vh;background:#060b14;color:#fff;position:relative;overflow-y:auto;overflow-x:hidden}
  .western-nums{font-family:"Inter",sans-serif!important;font-variant-numeric:tabular-nums lining-nums!important;direction:ltr!important}
  input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}

  /* Ambient Removed */

  /* Loading */
  .z-load{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;position:relative;z-index:1}
  .z-spin{width:36px;height:36px;border:3px solid rgba(129,140,248,.15);border-top-color:#818cf8;border-radius:50%;animation:zs .7s linear infinite}
  .z-load-t{font-size:12px;font-weight:600;letter-spacing:2px;color:#818cf8;text-transform:uppercase}
  @keyframes zs{to{transform:rotate(360deg)}}

  /* Toast */
  .z-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;display:flex;align-items:center;gap:8px;background:rgba(16,185,129,.1);backdrop-filter:blur(24px);border:1px solid rgba(52,211,153,.25);border-radius:12px;padding:8px 18px;box-shadow:0 6px 24px rgba(16,185,129,.1);animation:zti .25s ease;font-size:12px;font-weight:600;color:#34d399}
  .z-toast-i{width:18px;height:18px;color:#34d399}
  .z-toast-n{font-size:12px;opacity:.8}
  @keyframes zti{from{opacity:0;transform:translateX(-50%) translateY(-8px)}}

  /* ═══ GRID LAYOUT ═══ */
  .z-grid{position:relative;z-index:5;width:100%;min-height:100vh;display:flex;flex-wrap:wrap;align-items:flex-start;padding:12px;gap:12px}

  /* ── SIDEBAR ── */
  .z-side{
    width:280px;flex-shrink:0;
    display:flex;flex-direction:column;
    background:linear-gradient(180deg,rgba(15,23,42,.6) 0%,rgba(10,14,26,.8) 100%);
    border:1px solid rgba(255,255,255,.08);
    border-radius:14px;
    box-shadow:0 8px 30px rgba(0,0,0,.3);
    overflow:hidden;
  }
  .z-side-top{
    display:flex;align-items:center;gap:6px;
    padding:8px 10px;
    border-bottom:1px solid rgba(255,255,255,.04);
    flex-shrink:0;
  }
  .z-back{
    width:28px;height:28px;border-radius:8px;
    background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;color:rgba(148,163,184,.5);transition:all .2s;flex-shrink:0;
  }
  .z-back:hover{background:rgba(255,255,255,.08);color:#fff}
  .z-back-i{width:14px;height:14px}

  .z-brand{display:flex;align-items:center;gap:6px}
  .z-badge{
    width:28px;height:28px;border-radius:8px;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 10px rgba(99,102,241,.25);flex-shrink:0;
  }
  .z-badge-i{width:14px;height:14px;color:#fff}
  .z-brand-t{display:flex;flex-direction:column}
  .z-brand-name{font-size:14px;font-weight:700;line-height:1.1}
  .z-brand-sub{font-size:12px;font-weight:600;color:rgba(148,163,184,.75)}

  /* Sidebar meta fields */
  .z-side-meta{
    flex:1;overflow-y:auto;
    padding:6px 10px;
    display:flex;flex-direction:column;gap:6px;
  }
  .z-side-meta::-webkit-scrollbar{display:none}
  .z-mf{display:flex;flex-direction:column;gap:2px}
  .z-mf-h{display:flex;align-items:center;gap:3px;color:rgba(148,163,184,.4)}
  .z-mf-ic{width:12px;height:12px}
  .z-mf-h span{font-size:12px;font-weight:600;text-transform:uppercase}
  .z-mf-inp{
    background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.08);
    border-radius:8px;padding:6px 10px;
    font-size:12px;font-weight:700;color:#fff;outline:none;
    transition:all .2s;width:100%;
  }
  .z-mf-inp:focus{border-color:rgba(129,140,248,.3);box-shadow:0 0 0 2px rgba(129,140,248,.05)}
  .z-mf-ro{background:rgba(0,0,0,.15);border:1px solid rgba(255,255,255,.04);border-radius:8px;padding:6px 10px}
  .z-mf-ro-v{font-size:12px;font-weight:700;color:#818cf8}

  /* Notes */
  .z-notes{
    display:flex;flex-direction:column;gap:6px;
    padding:0 12px 12px;
  }
  .z-notes-h{display:flex;align-items:center;gap:4px;color:rgba(148,163,184,.6)}
  .z-notes-h span{font-size:13px;font-weight:600}
  .z-notes-inp{
    min-height:100px;resize:vertical;line-height:1.6;
    background:rgba(15,23,42,.4);border:1px solid rgba(255,255,255,.08);
    border-radius:10px;padding:12px;font-size:12px;font-weight:600;color:#e2e8f0;
    outline:none;transition:all .2s;
    box-shadow:inset 0 2px 10px rgba(0,0,0,.1);
  }
  .z-notes-inp:focus{border-color:rgba(99,102,241,.4);background:rgba(15,23,42,.6);box-shadow:0 0 0 2px rgba(99,102,241,.1)}
  .z-notes-inp::placeholder{color:rgba(148,163,184,.3)}

  /* Save Button */
  .z-save{
    display:flex;align-items:center;justify-content:center;gap:10px;
    padding:11px 24px;
    width:auto;min-width:165px;
    border-radius:12px;border:none;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff;font-size:14px;font-weight:700;
    cursor:pointer;
    box-shadow:0 5px 15px rgba(99,102,241,.3);
    transition:all .2s;flex-shrink:0;
  }
  .z-save:hover{transform:translateY(-1px);box-shadow:0 5px 20px rgba(99,102,241,.4)}
  .z-save:active{transform:scale(.97)}
  .z-save:disabled{opacity:.5;cursor:not-allowed}
  .z-save-i{width:14px;height:14px}
  .z-save-sp{width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:zs .6s linear infinite}

  /* ── MAIN ── */
  .z-main{
    flex:1;min-width:600px;
    display:flex;flex-direction:column;
    background:rgba(15,23,42,.4);
    border:1px solid rgba(255,255,255,.04);
    border-radius:14px;
    box-shadow:0 8px 30px rgba(0,0,0,.2);
  }

  /* Top Row */
  .z-top-row{
    display:flex;align-items:center;justify-content:space-between;
    flex-wrap:wrap;
    padding:10px 14px;
    border-bottom:1px solid rgba(255,255,255,.04);
    gap:12px;
  }
  .z-mats{display:flex;gap:2px;padding:2px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:999px}
  .z-mat{
    padding:6px 18px;border-radius:999px;
    font-size:13px;font-weight:700;
    color:rgba(148,163,184,.8);background:transparent;border:none;cursor:pointer;
    transition:all .2s;
  }
  .z-mat:hover{color:rgba(148,163,184,.7)}
  .z-mat-on{background:rgba(99,102,241,.15);color:#fff;box-shadow:inset 0 0 0 1px rgba(129,140,248,.3)}

  /* Weights - Modern Boxed Input Design */
  .z-ws{display:flex;flex-wrap:wrap;gap:10px}
  .z-w{
    display:flex;align-items:center;padding:4px;
    background:rgba(255,255,255,.02);
    border:1px solid rgba(255,255,255,.05);
    border-radius:14px;
    transition:all .3s ease;
  }
  .z-w-l{font-size:13px;font-weight:600;padding:0 12px;color:rgba(148,163,184,.9)}
  .z-w-inp{
    background:rgba(0,0,0,.4);
    border:1px solid rgba(255,255,255,.12);
    border-radius:10px;
    width:90px;height:42px;line-height:42px;
    outline:none;
    font-size:18px;font-weight:700;color:#fff;
    text-align:center !important;padding:0;
    transition:all .2s;
    box-shadow:inset 0 2px 8px rgba(0,0,0,.3);
  }
  .z-w-inp::placeholder{color:rgba(255,255,255,.15)}
  .z-w-inp:focus{
    border-color:#6366f1;
    background:rgba(0,0,0,0.6);
    box-shadow:0 0 15px rgba(99,102,241,0.2);
  }

  /* Colors */
  .zw-c .z-w-l{color:#22d3ee}
  .zw-c .z-w-inp{border-color:rgba(34,211,238,.3)}
  .zw-a .z-w-l{color:#facc15}
  .zw-a .z-w-inp{border-color:rgba(250,204,21,.3)}
  .zw-p .z-w-l{color:#a855f7}
  .zw-p .z-w-inp{border-color:rgba(168,85,247,.3)}

  /* ── DATA TRACKS (RESTORED) ── */
  .z-tracks-wrap {
    display: flex; flex-direction: column; gap: 2px;
    width: 100%; padding: 0 4px;
    background: rgba(8,12,22,0.4); border-radius: 12px;
  }
  .z-tk-header {
    display: flex; align-items: center; padding: 10px 16px;
    font-size: 12px; font-weight: 700; color: rgba(148,163,184,0.7);
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .z-tk-h-sz { width: 80px; text-align: center; }
  .z-tk-h-inp { width: 100px; text-align: center; }
  .z-tk-h-pb { flex: 1; text-align: center; }
  .z-tk-h-cl { width: 105px; text-align: center; }
  .z-tk-h-lim { width: 90px; text-align: center; }
  .z-tk-h-st { width: 80px; text-align: center; }

  .z-tk {
    display: flex; align-items: center; padding: 6px 16px;
    background: rgba(255,255,255,0.01);
    transition: all 0.2s;
    border-radius: 8px;
    min-height: 44px;
  }
  .z-tk:hover { background: rgba(255,255,255,0.03); }
  .z-tk-f { background: rgba(239,68,68,0.02); }

  .z-tk-sz { width: 80px; text-align: center; font-size: 14px; font-weight: 700; color: #f1f5f9; }
  .z-tk-inp-c { width: 100px; display: flex; justify-content: center; }
  .z-tinp {
    width: 85px; height: 32px; line-height: 32px;
    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; text-align: center !important; padding: 0;
    color: #fff; font-size: 13px; font-weight: 700; outline: none;
    transition: all 0.2s;
    box-shadow: inset 0 1px 5px rgba(0,0,0,0.3);
  }
  .z-tinp::placeholder{color:rgba(255,255,255,.2)}
  .z-tinp:focus { 
    border-color: rgba(99,102,241,0.6); 
    background: rgba(0,0,0,0.6);
    box-shadow: 0 0 10px rgba(99,102,241,0.15);
  }

  .z-tk-cl { width: 105px; text-align: center; font-size: 12px; font-weight: 600; color: #cbd5e1; }
  .z-text-sky { color: #38bdf8; font-weight: 700; font-size: 13px; }

  .z-tk-lim { width: 90px; text-align: center; font-size: 13px; font-weight: 600; color: rgba(148,163,184,0.8); }
  .z-tk-st { width: 80px; display: flex; justify-content: center; }
  .z-bg { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 700; }
  .z-bg-ok { color: #10b981; background: rgba(16,185,129,0.1); }
  .z-bg-no { color: #ef4444; background: rgba(239,68,68,0.1); }

  /* ── Bottom (Stats + Save) ── */
  .z-bottom{
    display:flex;align-items:center;gap:8px;
    padding:4px 10px;
    border-top:1px solid rgba(255,255,255,.04);
    flex-shrink:0;
  }
  .z-bottom-stats{
    display:flex;align-items:center;gap:14px;
    flex:1;
  }
  .z-bs{display:flex;align-items:center;gap:4px}
  .z-bs-k{font-size:11px;font-weight:600;color:rgba(148,163,184,.7)}
  .z-bs-v{font-size:13px;font-weight:700}
  .z-bs-ind{color:#818cf8}
  .z-bs-amb{color:#fbbf24}
  .z-bs-cyn{color:#22d3ee}
  .z-chart-col{width:100%;display:flex;flex-direction:column;gap:12px}
  .z-chart-card{background:linear-gradient(180deg,rgba(15,23,42,.6) 0%,rgba(10,14,26,.8) 100%);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,0.3);height:480px;display:flex;flex-direction:column}
  .z-chart-title{font-size:15px;font-weight:800;color:#fff;margin-bottom:15px;text-align:right}
  .z-chart-container{flex:1;min-height:0}

  @media (min-width: 1400px) {
    .z-chart-col{width:420px;flex-shrink:0}
    .z-main{min-width:0}
  }
`;
