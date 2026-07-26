"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays, addMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import {
  getEquipmentList,
  addEquipment,
  addMaintenanceLog,
  updateEquipmentStatus,
} from "@/app/actions/operator-cockpit";

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  status: string;
  serialNumber: string | null;
  lastMaintenance: string | Date | null;
  nextMaintenance: string | Date | null;
}

export function CalibrationManager() {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<EquipmentItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalibrateModal, setShowCalibrateModal] =
    useState<EquipmentItem | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [calibrateTechnician, setCalibrateTechnician] = useState("");
  const [calibrateCost, setCalibrateCost] = useState("");
  const [calibrateNotes, setCalibrateNotes] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    const res = await getEquipmentList();
    if (res.success && res.data) {
      // Filter for LAB type or OTHER lab equipment
      const labDevices = res.data.filter(
        (e: any) =>
          e.type === "LAB" ||
          e.name.includes("ميزان") ||
          e.name.includes("مكبس") ||
          e.name.includes("منخل"),
      ) as EquipmentItem[];
      setDevices(labDevices);
    } else {
      toast.error(res.error || "فشل جلب الأجهزة");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();
  }, []);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      toast.error("الرجاء إدخال اسم الجهاز");
      return;
    }
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("type", "LAB");
    formData.append("serialNumber", newSerial);
    formData.append("hoursRun", "0");

    const res = await addEquipment(formData);
    if (res.success) {
      toast.success("تم إضافة جهاز المختبر بنجاح");
      setShowAddModal(false);
      setNewName("");
      setNewSerial("");
      fetchDevices();
    } else {
      toast.error(res.error || "فشل إضافة الجهاز");
    }
  };

  const handleCalibrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCalibrateModal) return;

    const formData = new FormData();
    formData.append("equipmentId", showCalibrateModal.id.toString());
    formData.append(
      "description",
      `معايرة مخبرية دورية: ${calibrateNotes || "تأكيد دقة القياس"}`,
    );
    formData.append("type", "ROUTINE");
    formData.append("cost", calibrateCost || "0");
    formData.append("technician", calibrateTechnician || "مختبر خارجي");
    formData.append("date", new Date().toISOString());

    const res = await addMaintenanceLog(formData);
    if (res.success) {
      toast.success("تم تسجيل معايرة الجهاز وتحديث صلاحيته");
      setShowCalibrateModal(null);
      setCalibrateTechnician("");
      setCalibrateCost("");
      setCalibrateNotes("");
      fetchDevices();
    } else {
      toast.error(res.error || "فشل تسجيل المعايرة");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Icons.Settings className="w-5 h-5 text-indigo-400" />
            إدارة معايرة أجهزة المختبر
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            تابع فترات صلاحية المعايرة لأجهزة الفحص لضمان دقة النتائج الهندسية
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
        >
          <Icons.Plus className="w-4 h-4" />
          إضافة جهاز فحص
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          جاري تحميل الأجهزة...
        </div>
      ) : devices.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/10 rounded-2xl border border-dashed border-white/5 text-slate-500 text-sm font-bold">
          لا توجد أجهزة مختبر مسجلة حالياً. قم بإضافة أول جهاز للبدء.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const nextDate = device.nextMaintenance
              ? new Date(device.nextMaintenance)
              : null;
            const daysRemaining = nextDate
              ? differenceInDays(nextDate, new Date())
              : null;
            const isExpired = daysRemaining !== null && daysRemaining <= 0;
            const isNearExpiry =
              daysRemaining !== null &&
              daysRemaining > 0 &&
              daysRemaining <= 30;

            return (
              <div
                key={device.id}
                className={`p-5 rounded-2xl border bg-slate-900/20 backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-all relative overflow-hidden group ${
                  isExpired
                    ? "border-rose-500/20"
                    : isNearExpiry
                      ? "border-amber-500/20"
                      : "border-white/5"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-white/5 font-mono text-xs font-bold">
                    LAB-{device.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isExpired ? (
                      <span className="text-rose-400 font-extrabold flex items-center gap-1">
                        <Icons.AlertTriangle className="w-3.5 h-3.5" />
                        منتهي المعايرة!
                      </span>
                    ) : isNearExpiry ? (
                      <span className="text-amber-400 font-extrabold flex items-center gap-1">
                        <Icons.Clock className="w-3.5 h-3.5" />
                        ينتهي قريباً (<BidiText>{daysRemaining}</BidiText> يوم)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <Icons.ShieldCheck className="w-3.5 h-3.5" />
                        معايرة صالحة
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-white text-base truncate">
                    {device.name}
                  </h4>
                  {device.serialNumber && (
                    <p className="text-xs text-slate-500 mt-1">
                      الرقم التسلسلي:{" "}
                      <span className="font-mono text-slate-400">
                        <BidiText>{device.serialNumber}</BidiText>
                      </span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs border-t border-b border-white/5 py-3">
                  <div>
                    <span className="text-slate-500 block">آخر معايرة</span>
                    <span className="text-white font-bold block mt-1">
                      {device.lastMaintenance ? (
                        <BidiText>
                          {format(
                            new Date(device.lastMaintenance),
                            "yyyy-MM-dd",
                          )}
                        </BidiText>
                      ) : (
                        "بلا سجل"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">معايرة قادمة</span>
                    <span className="text-white font-bold block mt-1">
                      {device.nextMaintenance ? (
                        <BidiText>
                          {format(
                            new Date(device.nextMaintenance),
                            "yyyy-MM-dd",
                          )}
                        </BidiText>
                      ) : (
                        "غير محدد"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCalibrateModal(device)}
                    className="flex-1 bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-400 hover:border-indigo-500/30 border border-white/10 text-slate-300 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Icons.Scale className="w-3.5 h-3.5" />
                    تسجيل معايرة جديدة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <h3 className="text-lg font-black text-white">
              إضافة جهاز فحص جديد
            </h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  اسم الجهاز
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: جهاز كسر المكعبات الهيدروليكي"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  الرقم التسلسلي
                </label>
                <input
                  type="text"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: SN-58392-A"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-black transition-all"
                >
                  إضافة الجهاز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Calibration Modal */}
      {showCalibrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCalibrateModal(null)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <h3 className="text-lg font-black text-white">
              تسجيل معايرة: {showCalibrateModal.name}
            </h3>
            <form onSubmit={handleCalibrate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  جهة المعايرة / الفني
                </label>
                <input
                  type="text"
                  value={calibrateTechnician}
                  onChange={(e) => setCalibrateTechnician(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: مختبر القياس والمعايرة المركزي"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  تكلفة المعايرة (اختياري)
                </label>
                <input
                  type="number"
                  value={calibrateCost}
                  onChange={(e) => setCalibrateCost(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">
                  ملاحظات / نتائج المعايرة
                </label>
                <textarea
                  value={calibrateNotes}
                  onChange={(e) => setCalibrateNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 h-20 resize-none"
                  placeholder="مثال: تم ضبط دقة الضغط ونسبة التفاوت 0.1%"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-black transition-all"
                >
                  حفظ المعايرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
