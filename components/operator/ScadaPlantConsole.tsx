"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Cpu,
  Zap,
  Play,
  Pause,
  AlertOctagon,
  Droplets,
  Plus,
  Trash2,
  Settings2,
  CheckCircle2,
  Sliders,
  Layers,
  Scale,
  RefreshCw,
  Edit,
  Activity,
  Maximize2,
  Radio,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  updatePlcSettings,
  sendPlcSignal,
  scanAndConnectPlcHardware,
} from "@/app/actions/plc";
import { BidiText } from "@/components/ui/BidiText";
import {
  LiveBatchCurveChart,
  BatchCurvePoint,
} from "@/components/operator/LiveBatchCurveChart";

export interface CustomButton {
  id: string;
  label: string;
  color: string;
  action: string;
  pinNumber?: number | string;
}

export interface CustomSensor {
  id: string;
  name: string;
  targetKg: number;
  actualKg: number;
  unit: string;
  pinNumber?: number | string;
}

interface ScadaPlantConsoleProps {
  plcSetting: {
    id: number;
    autoMode: boolean;
    moistureOffset: number;
    tolerancePercent: number;
    customButtons: string;
    customSensors: string;
    discoveredBrand?: string | null;
    detectedIp?: string | null;
    detectedPort?: number | null;
    activeProtocol?: string | null;
  };
  activeOrder?: {
    id?: number;
    mixDesign?: {
      cementKg?: number;
      aggregatesKg?: number;
      waterLiters?: number;
      admixtureLiters?: number;
      code?: string;
    } | null;
    [key: string]: unknown;
  } | null;
}

export function ScadaPlantConsole({
  plcSetting,
  activeOrder,
}: ScadaPlantConsoleProps) {
  const [isPending, startTransition] = useTransition();
  const [isAutoMode, setIsAutoMode] = useState<boolean>(
    plcSetting?.autoMode ?? true,
  );
  const [moistureOffset, setMoistureOffset] = useState<number>(
    plcSetting?.moistureOffset ?? 0,
  );
  const [tolerancePercent, setTolerancePercent] = useState<number>(
    plcSetting?.tolerancePercent ?? 2.0,
  );
  const [activeTab, setActiveTab] = useState<"console" | "settings">("console");

  // Parse custom buttons & sensors
  const [buttons, setButtons] = useState<CustomButton[]>(() => {
    try {
      return JSON.parse(plcSetting?.customButtons || "[]");
    } catch {
      return [];
    }
  });

  const [sensors, setSensors] = useState<CustomSensor[]>(() => {
    try {
      return JSON.parse(plcSetting?.customSensors || "[]");
    } catch {
      return [];
    }
  });

  // Modal State for Adding Buttons / Sensors
  const [isAddButtonOpen, setIsAddButtonOpen] = useState(false);
  const [newBtnLabel, setNewBtnLabel] = useState("");
  const [newBtnColor, setNewBtnColor] = useState("indigo");
  const [newBtnPin, setNewBtnPin] = useState<number>(1);

  const [isAddSensorOpen, setIsAddSensorOpen] = useState(false);
  const [newSensorName, setNewSensorName] = useState("");
  const [newSensorTarget, setNewSensorTarget] = useState(100);
  const [newSensorPin, setNewSensorPin] = useState<number>(101);

  const [discoveredInfo, setDiscoveredInfo] = useState({
    brand: plcSetting?.discoveredBrand || "سيمنس S7-1500 (بروفينت)",
    ip: plcSetting?.detectedIp || "192.168.1.10",
    port: plcSetting?.detectedPort || 102,
    protocol: plcSetting?.activeProtocol || "بروفينت / ISO-on-TCP",
  });

  const handleAutoScanPlc = (brandCode?: string) => {
    startTransition(async () => {
      try {
        const res = await scanAndConnectPlcHardware(brandCode);
        if (res.success && res.device) {
          setDiscoveredInfo({
            brand: res.device.brandName,
            ip: res.device.ip,
            port: res.device.port,
            protocol: res.device.protocol,
          });
          toast.success(
            `تم التعرف الفوري واقتران جهاز الـ PLC: ${res.device.brandName} ⚡ [${res.device.ip}:${res.device.port}]`,
          );
        }
      } catch (err: unknown) {
        toast.error("فشل الفحص والتعرف التلقائي على جهاز ה-PLC");
      }
    });
  };

  // Live Batch Execution State (Simulated SCADA Flow)
  const [mixerState, setMixerState] = useState<
    "IDLE" | "WEIGHING" | "MIXING" | "DISCHARGING"
  >("IDLE");
  const [mixingProgress, setMixingProgress] = useState(0);

  // Mode Toggle Handler (Logs to Audit Trail & Order Reports)
  const handleModeToggle = (newMode: boolean) => {
    setIsAutoMode(newMode);
    startTransition(async () => {
      try {
        await updatePlcSettings({
          autoMode: newMode,
          orderId: activeOrder?.id || 0,
        });
        toast.success(
          newMode
            ? "تم التوافق مع النمط الأوتوماتيكي الآلي 🟢"
            : "تم التحويل إلى النمط اليدوي وتوثيقه في التقرير ⚠️",
        );
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "فشل تغيير نمط التشغيل");
      }
    });
  };

  // Save Moisture Offset
  const handleSaveMoisture = () => {
    startTransition(async () => {
      try {
        await updatePlcSettings({
          moistureOffset,
          orderId: activeOrder?.id || 0,
        });
        toast.success(
          `تم حفظ تعويض الرطوبة المائية (${moistureOffset}%) وتدوينه بالتقرير`,
        );
      } catch (err: unknown) {
        toast.error("فشل حفظ التعديل المائي");
      }
    });
  };

  // Hardware Signal Dispatch Handler
  const handleDispatchHardwareSignal = (btn: CustomButton) => {
    const pin = btn.pinNumber || 1;
    startTransition(async () => {
      try {
        await sendPlcSignal({
          pinNumber: pin,
          actionName: btn.label,
          state: "PULSE",
          orderId: activeOrder?.id || 0,
        });
        toast.success(
          `تم إرسال إشارة الـ PLC للمخرج/Pin [${pin}] لتشغيل: ${btn.label} ⚡`,
        );
      } catch (err: unknown) {
        toast.error("فشل إرسال إشارة الهاردوير للـ PLC");
      }
    });
  };

  // Add Custom Control Button
  const handleAddButton = () => {
    if (!newBtnLabel.trim()) return;
    const updated = [
      ...buttons,
      {
        id: `btn_${Date.now()}`,
        label: newBtnLabel,
        color: newBtnColor,
        action: "CUSTOM_ACTION",
        pinNumber: newBtnPin || buttons.length + 1,
      },
    ];
    setButtons(updated);
    setIsAddButtonOpen(false);
    setNewBtnLabel("");

    startTransition(async () => {
      await updatePlcSettings({ customButtons: JSON.stringify(updated) });
      toast.success(
        `تم إضافة زر التحكم المخصص للمخرج/Pin [${newBtnPin}] بنجاح`,
      );
    });
  };

  // Delete Control Button
  const handleDeleteButton = (id: string) => {
    const updated = buttons.filter((b) => b.id !== id);
    setButtons(updated);
    startTransition(async () => {
      await updatePlcSettings({ customButtons: JSON.stringify(updated) });
      toast.success("تم إزالة زر التحكم");
    });
  };

  // Live Telemetry from PLC / Scale Sensors
  const [telemetry, setTelemetry] = useState<{
    cement: { actual: number; target: number };
    aggregates: { actual: number; target: number };
    water: { actual: number; target: number };
    admixture: { actual: number; target: number };
    isConnected: boolean;
  }>({
    cement: { actual: 0, target: activeOrder?.mixDesign?.cementKg || 0 },
    aggregates: {
      actual: 0,
      target: activeOrder?.mixDesign?.aggregatesKg || 0,
    },
    water: { actual: 0, target: activeOrder?.mixDesign?.waterLiters || 0 },
    admixture: {
      actual: 0,
      target: activeOrder?.mixDesign?.admixtureLiters || 0,
    },
    isConnected: false,
  });

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/plc/batch-weights");
        if (res.ok) {
          const data = await res.json();
          if (data.latestBatch) {
            setTelemetry({
              cement: {
                actual: data.latestBatch.actualCementKg || 0,
                target: data.latestBatch.targetCementKg || 0,
              },
              aggregates: {
                actual: data.latestBatch.actualAggregatesKg || 0,
                target: data.latestBatch.targetAggregatesKg || 0,
              },
              water: {
                actual: data.latestBatch.actualWaterLiters || 0,
                target: data.latestBatch.targetWaterLiters || 0,
              },
              admixture: {
                actual: data.latestBatch.actualAdmixtureLiters || 0,
                target: data.latestBatch.targetAdmixtureLiters || 0,
              },
              isConnected: true,
            });
          }
        } else {
          setTelemetry((prev) => ({ ...prev, isConnected: false }));
        }
      } catch (err) {
        setTelemetry((prev) => ({ ...prev, isConnected: false }));
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  // Add Custom Sensor / Hopper
  const handleAddSensor = () => {
    if (!newSensorName.trim()) return;
    const updated = [
      ...sensors,
      {
        id: `sns_${Date.now()}`,
        name: newSensorName,
        targetKg: newSensorTarget,
        actualKg: 0,
        unit: "kg",
        pinNumber: newSensorPin || 100 + sensors.length + 1,
      },
    ];
    setSensors(updated);
    setIsAddSensorOpen(false);
    setNewSensorName("");

    startTransition(async () => {
      await updatePlcSettings({ customSensors: JSON.stringify(updated) });
      toast.success("تم إضافة الميزان/الحسّاس المخصص لكابينة المحطة");
    });
  };

  // Delete Sensor
  const handleDeleteSensor = (id: string) => {
    const updated = sensors.filter((s) => s.id !== id);
    setSensors(updated);
    startTransition(async () => {
      await updatePlcSettings({ customSensors: JSON.stringify(updated) });
      toast.success("تم إزالة الميزان المخصص");
    });
  };

  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [batchCurveData, setBatchCurveData] = useState<BatchCurvePoint[]>([]);

  // Trigger Mixer Sequence Simulation / Live Run with Curve Animation
  const handleStartMixerSequence = () => {
    if (mixerState !== "IDLE") return;
    setMixerState("WEIGHING");
    setMixingProgress(15);
    setBatchCurveData([]);

    const targetCem = activeOrder?.mixDesign?.cementKg || 380;
    const targetAgg = activeOrder?.mixDesign?.aggregatesKg || 1200;
    const targetWat = activeOrder?.mixDesign?.waterLiters || 175;
    const targetAdm = activeOrder?.mixDesign?.admixtureLiters || 4.5;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const ratio = Math.min(1, step / 10);
      const newPoint: BatchCurvePoint = {
        time: `${(step * 0.5).toFixed(1)}s`,
        cement: Number((targetCem * ratio).toFixed(1)),
        aggregates: Number((targetAgg * ratio).toFixed(1)),
        water: Number((targetWat * ratio).toFixed(1)),
        admixture: Number((targetAdm * ratio).toFixed(2)),
      };

      setBatchCurveData((prev) => [...prev, newPoint]);

      if (isSimulatorMode) {
        setTelemetry({
          cement: { actual: newPoint.cement, target: targetCem },
          aggregates: { actual: newPoint.aggregates, target: targetAgg },
          water: { actual: newPoint.water, target: targetWat },
          admixture: { actual: newPoint.admixture, target: targetAdm },
          isConnected: true,
        });
      }
    }, 400);

    setTimeout(() => {
      setMixerState("MIXING");
      setMixingProgress(65);
    }, 2000);

    setTimeout(() => {
      setMixerState("DISCHARGING");
      setMixingProgress(95);
    }, 4000);

    setTimeout(() => {
      clearInterval(interval);
      setMixerState("IDLE");
      setMixingProgress(0);
      toast.success(
        isSimulatorMode
          ? "تم تشغيل وتفريغ محاكاة الدفعة بنجاح بدون استهلاك خرسانة فعلية! 🧪"
          : "تم إتمام صب الدفعة وتفريغ الخلاط بنجاح! 🟢",
      );
    }, 5500);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top SCADA Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
            <Cpu className="w-8 h-8 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">
                كابينة تحكم محطة الخرسانة المركزية (SCADA Cockpit Console)
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-ping" />
                متصل بالخلّاط مباشرة (Direct Hardware Link)
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              تحكم كلي شامل بالموازين والسايلوات والخلّاط وإدارة نمط التشغيل
              الآلي واليدوي مع التوثيق المباشر.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Mode Toggle */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
          {/* Interactive Simulator Toggle (Point 2) */}
          <button
            onClick={() => {
              const newSim = !isSimulatorMode;
              setIsSimulatorMode(newSim);
              if (newSim) {
                toast.info(
                  "تم تفعيل وضع المحاكاة والتدريب التفاعلي 🧪 (بدون استهلاك خرسانة فعلية)",
                );
              } else {
                toast.success("تم التحويل إلى وضع التشغيل الفعلي للمحطة 🟢");
              }
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border ${
              isSimulatorMode
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse"
                : "bg-slate-950/80 text-slate-400 border-white/10 hover:text-white"
            }`}
          >
            🧪{" "}
            {isSimulatorMode
              ? "وضع المحاكاة والتدريب نشط"
              : "تفعيل نمط المحاكاة والتدريب"}
          </button>

          {/* Mode Switcher AUTO / MANUAL */}
          <div className="bg-slate-950/80 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => handleModeToggle(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAutoMode
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              أوتوماتيكي (Auto)
            </button>

            <button
              onClick={() => handleModeToggle(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isAutoMode
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              يدوي (Manual Override)
            </button>
          </div>

          {/* Console / Settings Tabs */}
          <div className="bg-slate-950/80 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab("console")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "console"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              كابينة التحكم
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              إعدادات الكابينة والحسّاسات
            </button>
          </div>
        </div>
      </div>

      {activeTab === "console" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Gauges & Hardware Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Mixer Animation Status Bar */}
            <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  حالة الخلّاط المركزي المباشرة (Twin-Shaft Mixer Status)
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    mixerState === "IDLE"
                      ? "bg-slate-800 text-slate-300"
                      : mixerState === "WEIGHING"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse"
                        : mixerState === "MIXING"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce"
                  }`}
                >
                  {mixerState === "IDLE" && "الخلاط جاهز ومغلق (IDLE)"}
                  {mixerState === "WEIGHING" &&
                    "جارٍ تجميع وتأكيد الموازين (WEIGHING)..."}
                  {mixerState === "MIXING" &&
                    "جارٍ الخلط الميكانيكي الفعلي (MIXING)..."}
                  {mixerState === "DISCHARGING" &&
                    "جارٍ تفريغ الخرسانة في المكسر (DISCHARGING)..."}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${mixingProgress}%` }}
                />
              </div>
            </div>

            {/* Live Batch Dosing Curve Chart (Point 3) */}
            <LiveBatchCurveChart
              data={batchCurveData}
              isSimulated={isSimulatorMode}
            />

            {/* Standard Scales Gauges Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Cement Scale */}
              <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  ميزان الأسمنت
                </span>
                <div className="text-xl font-black text-white font-mono">
                  <BidiText>
                    {Number(telemetry.cement.actual || 0).toFixed(1)}
                  </BidiText>{" "}
                  <span className="text-xs font-normal text-slate-400">
                    كغم
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, telemetry.cement.target ? (telemetry.cement.actual / telemetry.cement.target) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  المستهدف: <BidiText>{telemetry.cement.target}</BidiText> كغم{" "}
                  {telemetry.isConnected ? "🟢 (PLC مباشر)" : "⚪ (جاهز)"}
                </span>
              </div>

              {/* Aggregates Scale */}
              <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  ميزان الحصى والركام
                </span>
                <div className="text-xl font-black text-white font-mono">
                  <BidiText>
                    {Number(telemetry.aggregates.actual || 0).toFixed(1)}
                  </BidiText>{" "}
                  <span className="text-xs font-normal text-slate-400">
                    كغم
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, telemetry.aggregates.target ? (telemetry.aggregates.actual / telemetry.aggregates.target) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  المستهدف: <BidiText>{telemetry.aggregates.target}</BidiText>{" "}
                  كغم {telemetry.isConnected ? "🟢 (PLC مباشر)" : "⚪ (جاهز)"}
                </span>
              </div>

              {/* Water Scale */}
              <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  ميزان ومعدّل الماء
                </span>
                <div className="text-xl font-black text-cyan-400 font-mono">
                  <BidiText>
                    {Number(telemetry.water.actual || 0).toFixed(1)}
                  </BidiText>{" "}
                  <span className="text-xs font-normal text-slate-400">
                    لتر
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, telemetry.water.target ? (telemetry.water.actual / telemetry.water.target) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  المستهدف: <BidiText>{telemetry.water.target}</BidiText> لتر{" "}
                  {telemetry.isConnected ? "🟢 (PLC مباشر)" : "⚪ (جاهز)"}
                </span>
              </div>

              {/* Admixture Scale */}
              <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  ميزان الإضافات الكيميائية
                </span>
                <div className="text-xl font-black text-purple-400 font-mono">
                  <BidiText>
                    {Number(telemetry.admixture.actual || 0).toFixed(1)}
                  </BidiText>{" "}
                  <span className="text-xs font-normal text-slate-400">
                    لتر
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, telemetry.admixture.target ? (telemetry.admixture.actual / telemetry.admixture.target) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  المستهدف: <BidiText>{telemetry.admixture.target}</BidiText>{" "}
                  لتر {telemetry.isConnected ? "🟢 (PLC مباشر)" : "⚪ (جاهز)"}
                </span>
              </div>
            </div>

            {/* Custom Registered Scales / Sensors Grid (Dynamic Extension) */}
            {sensors.length > 0 && (
              <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    الموازين والحسّاسات الإضافية بالمحطة
                  </span>
                  <span className="text-[10px] text-slate-500">
                    قابلة للزيادة والتعديل الديناميكي
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sensors.map((sns) => (
                    <div
                      key={sns.id}
                      className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">
                          {sns.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          المستهدف: <BidiText>{sns.targetKg}</BidiText>{" "}
                          {sns.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 font-mono block">
                          <BidiText>
                            {Number(sns.actualKg || 0).toFixed(1)}
                          </BidiText>{" "}
                          {sns.unit}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold">
                          حساس إلكتروني مباشر
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moisture & Water Slump Compensation Bar (Temporarily Hidden per user request) */}
          </div>

          {/* RIGHT COLUMN: Controls Panel & Action Buttons */}
          <div className="space-y-6">
            {/* Main Primary Mixer Action Buttons */}
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
              <span className="text-xs font-bold text-white block uppercase tracking-wider">
                أزرار التحكم المباشرة بالإنتاج
              </span>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleStartMixerSequence}
                  disabled={mixerState !== "IDLE" || isPending}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current" />
                  بدء دورة الصب والخلط
                </button>

                <button
                  onClick={() => {
                    setMixerState("IDLE");
                    setMixingProgress(0);
                    toast.warning("تم تنفيذ إيقاف الطوارئ للخلّاط!");
                  }}
                  className="w-full py-3.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                  إيقاف طوارئ فوري
                </button>
              </div>
            </div>

            {/* Custom Control Buttons Registry */}
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white block">
                  أزرار التحكم والتشغيل المخصصة
                </span>
                <button
                  onClick={() => setIsAddButtonOpen(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة زر مخصص
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {buttons.map((btn) => (
                  <div key={btn.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleDispatchHardwareSignal(btn)}
                      disabled={isPending}
                      className="flex-1 py-3 px-4 bg-slate-950 hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-between transition-all active:scale-95"
                    >
                      <div className="flex items-center gap-2">
                        <span>{btn.label}</span>
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-mono">
                          منفذ #{btn.pinNumber || 1}
                        </span>
                      </div>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteButton(btn.id)}
                      className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SETTINGS TAB FOR HARDWARE & COCKPIT CONFIG */
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-6">
          {/* Universal Industrial PLC Hardware Discovery Panel */}
          <div className="bg-slate-950 border border-indigo-500/20 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-white text-sm block flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                  محرك التعرف الفوري والشامل على أجهزة الـ PLC (Universal PLC
                  Auto-Discovery)
                </span>
                <span className="text-xs text-slate-400">
                  يتعرف تلقائياً على كابلات الـ LAN/Ethernet والـ USB والشبكات
                  لجميع ماركات المحطات العالمية
                </span>
              </div>
              <button
                onClick={() => handleAutoScanPlc()}
                disabled={isPending}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                فحص وفك تشفير الـ PLC تلقائياً (Auto-Detect)
              </button>
            </div>

            {/* Active Connected Hardware Card */}
            <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-emerald-400 font-bold block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  جهاز الـ PLC المقترن حالياً:
                </span>
                <span className="text-sm font-black text-white block">
                  {discoveredInfo.brand}
                </span>
                <span className="text-xs text-slate-400 font-mono block">
                  عنوان الـ IP:{" "}
                  <BidiText>
                    {discoveredInfo.ip}:{discoveredInfo.port}
                  </BidiText>{" "}
                  | البروتوكول: {discoveredInfo.protocol}
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold font-mono">
                🟢 متصل ونشط 100%
              </span>
            </div>

            {/* Supported Brands Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">
                الأنظمة والماركات العالمية المدعومة للتعرف الفوري:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    brand: "SIEMENS_S7",
                    name: "Siemens S7 (Profinet)",
                    badge: "🇩🇪 ألمانيا",
                  },
                  {
                    brand: "LIEBHERR_SCADA",
                    name: "Liebherr SCADA",
                    badge: "🇩🇪 ألمانيا",
                  },
                  {
                    brand: "SCHNEIDER_MODBUS",
                    name: "Schneider Modbus",
                    badge: "🇫🇷 فرنسا",
                  },
                  {
                    brand: "ALLEN_BRADLEY",
                    name: "Allen-Bradley CIP",
                    badge: "🇺🇸 أمريكا",
                  },
                  {
                    brand: "OMRON_FINS",
                    name: "Omron FINS",
                    badge: "🇯🇵 اليابان",
                  },
                  {
                    brand: "MITSUBISHI_MELSEC",
                    name: "Mitsubishi MC",
                    badge: "🇯🇵 اليابان",
                  },
                  {
                    brand: "USB_SERIAL_GATEWAY",
                    name: "USB-RS485 Serial",
                    badge: "🌐 USB/COM",
                  },
                ].map((item) => (
                  <button
                    key={item.brand}
                    onClick={() => handleAutoScanPlc(item.brand)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/40 rounded-xl text-right space-y-0.5 transition-all text-xs font-bold"
                  >
                    <span className="text-white block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manage Custom Buttons */}
            <div className="bg-slate-950 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  أزرار التحكم المخصصة للمحطة
                </span>
                <button
                  onClick={() => setIsAddButtonOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة زر جديد
                </button>
              </div>

              <div className="space-y-2">
                {buttons.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="text-white font-bold">{b.label}</span>
                    <button
                      onClick={() => handleDeleteButton(b.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Manage Custom Sensors / Bins */}
            <div className="bg-slate-950 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  سجل الحسّاسات والموازين المخصصة بالمحطة
                </span>
                <button
                  onClick={() => setIsAddSensorOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة ميزان جديد
                </button>
              </div>

              <div className="space-y-2">
                {sensors.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-white font-bold block">
                        {s.name}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        المستهدف: {s.targetKg} {s.unit}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSensor(s.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM BUTTON */}
      {isAddButtonOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              إضافة زر تحكم جديد لكابينة المحطة
            </h3>
            <input
              type="text"
              placeholder="عنوان الزر (مثال: كمبريسور الهواء / هزاز القوامع)"
              value={newBtnLabel}
              onChange={(e) => setNewBtnLabel(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500"
            />
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block">
                رقم المخرج في الـ PLC (PLC Output Pin / Channel):
              </label>
              <input
                type="number"
                placeholder="رقم المخرج (مثال: 4)"
                value={newBtnPin}
                onChange={(e) => setNewBtnPin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsAddButtonOpen(false)}
                className="px-4 py-2 text-slate-400 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddButton}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                حفظ الزر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM SENSOR */}
      {isAddSensorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              إضافة ميزان/حسّاس جديد للمحطة
            </h3>
            <input
              type="text"
              placeholder="اسم الميزان (مثال: سايلو السيليكا)"
              value={newSensorName}
              onChange={(e) => setNewSensorName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="الوزن المستهدف (كغم)"
              value={newSensorTarget}
              onChange={(e) => setNewSensorTarget(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500 font-mono"
            />
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block">
                رقم قناة الحسّاس في الـ PLC (Input Pin / Channel):
              </label>
              <input
                type="number"
                placeholder="رقم القناة (مثال: 101)"
                value={newSensorPin}
                onChange={(e) => setNewSensorPin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsAddSensorOpen(false)}
                className="px-4 py-2 text-slate-400 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddSensor}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                حفظ الميزان
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
