"use client";

import React, { useState } from "react";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import {
  addMaintenanceLog,
  addEquipment,
} from "@/app/actions/operator-cockpit";

interface EquipmentLog {
  id: number;
  description: string;
  type: string;
  cost: number;
  date: Date | string;
  technician: string | null;
}

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  status: string; // ACTIVE, MAINTENANCE, FAULTY
  hoursRun: number;
  lastMaintenance: Date | string | null;
  nextMaintenance: Date | string | null;
  serialNumber: string | null;
  maintenanceLogs?: EquipmentLog[];
}

interface EquipmentHubProps {
  initialEquipment?: EquipmentItem[];
}

export default function EquipmentHub({
  initialEquipment = [],
}: EquipmentHubProps) {
  const [equipmentList, setEquipmentList] =
    useState<EquipmentItem[]>(initialEquipment);

  React.useEffect(() => {
    setEquipmentList(initialEquipment);
  }, [initialEquipment]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState<EquipmentItem | null>(null);

  const handleAddEquipmentSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loader = toast.loading("جاري إضافة المعدة...");

    try {
      const res = await addEquipment(formData);
      if (res.success && res.data) {
        toast.success("تم إضافة المعدة بنجاح!", { id: loader });
        setEquipmentList((prev) => [...prev, res.data as EquipmentItem]);
        setIsAddModalOpen(false);
      } else {
        toast.error(res.error || "فشل إضافة المعدة", { id: loader });
      }
    } catch (err) {
      toast.error("حدث خطأ ما", { id: loader });
    }
  };

  const handleMaintSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedEq) {
      formData.append("equipmentId", selectedEq.id.toString());
    }
    const loader = toast.loading("جاري تسجيل أعمال الصيانة...");

    try {
      const res = await addMaintenanceLog(formData);
      if (res.success) {
        toast.success("تم تسجيل الصيانة بنجاح وإعادة تشغيل المعدة!", {
          id: loader,
        });

        // Update local state
        setEquipmentList((prev) =>
          prev.map((eq) =>
            eq.id === selectedEq?.id
              ? {
                  ...eq,
                  status: "ACTIVE",
                  lastMaintenance: new Date().toISOString().split("T")[0],
                  nextMaintenance: new Date(
                    Date.now() + 90 * 24 * 60 * 60 * 1000,
                  )
                    .toISOString()
                    .split("T")[0],
                }
              : eq,
          ),
        );

        setIsMaintModalOpen(false);
      } else {
        toast.error(res.error || "فشل تسجيل الصيانة", { id: loader });
      }
    } catch (err) {
      toast.error("حدث خطأ ما", { id: loader });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-900 flex items-center gap-1.5 w-fit">
            🟢 تعمل
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-900 flex items-center gap-1.5 w-fit">
            🟡 صيانة
          </span>
        );
      case "FAULTY":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-900 flex items-center gap-1.5 w-fit">
            🔴 معطلة
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1.5 w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">الآليات والمعدات</h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            تتبع ساعات التشغيل وجداول الصيانة الوقائية
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          + إضافة معدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {equipmentList.map((eq) => (
          <div
            key={eq.id}
            className="p-5 bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="text-white text-base font-bold truncate max-w-[180px]">
                  {eq.name}
                </h4>
                {getStatusBadge(eq.status)}
              </div>
              <div className="flex gap-2 text-xs font-bold text-slate-500">
                <span>سيريال:</span>
                <span className="font-mono text-slate-300">
                  <BidiText>{eq.serialNumber || "-"}</BidiText>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 block">
                  ساعات العمل
                </span>
                <span className="text-white text-sm font-black font-mono">
                  <BidiText>{eq.hoursRun}</BidiText>
                </span>
              </div>
              <div className="text-center border-x border-white/5">
                <span className="text-[10px] font-bold text-slate-500 block">
                  آخر صيانة
                </span>
                <span className="text-slate-300 text-xs font-bold font-mono block mt-0.5">
                  <BidiText>
                    {eq.lastMaintenance ? String(eq.lastMaintenance) : "-"}
                  </BidiText>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 block">
                  الصيانة القادمة
                </span>
                <span className="text-amber-400 text-xs font-bold font-mono block mt-0.5">
                  <BidiText>
                    {eq.nextMaintenance ? String(eq.nextMaintenance) : "-"}
                  </BidiText>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedEq(eq);
                setIsMaintModalOpen(true);
              }}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white rounded-xl text-xs font-bold transition-all"
            >
              تسجيل صيانة وإعادة تفعيل
            </button>
          </div>
        ))}
      </div>

      {/* MODAL: ADD EQUIPMENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">
              إضافة معدة جديدة
            </h3>
            <form onSubmit={handleAddEquipmentSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  اسم الآلية / المعدة
                </label>
                <input
                  name="name"
                  required
                  placeholder="مثال: مضخة إسمنت فوتسمايستر 02"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  نوع المعدة
                </label>
                <select
                  name="type"
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="MIXER">خلاط مركزي (Mixer)</option>
                  <option value="PUMP">مضخة إسمنت (Pump)</option>
                  <option value="SILO">صومعة تخزين (Silo)</option>
                  <option value="TRUCK">شاحنة خلط (Truck)</option>
                  <option value="COMPRESSOR">مكبس هواء (Compressor)</option>
                  <option value="OTHER">أخرى (Other)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    الرقم التسلسلي
                  </label>
                  <input
                    name="serialNumber"
                    placeholder="SN-XXXX"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    ساعات التشغيل الحالية
                  </label>
                  <input
                    name="hoursRun"
                    type="number"
                    step="0.1"
                    defaultValue="0"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 rounded-xl text-sm font-black transition-all"
                >
                  حفظ المعدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG MAINTENANCE */}
      {isMaintModalOpen && selectedEq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">
              تسجيل صيانة وإعادة تفعيل
            </h3>
            <p className="text-slate-400 text-sm font-medium mb-4">
              المعدة:{" "}
              <span className="text-white font-bold">{selectedEq.name}</span>
            </p>

            <form onSubmit={handleMaintSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  وصف الصيانة
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="مثال: تغيير فلتر الزيت وربط البواجي وفحص ضغط الهيدروليك..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    نوع الصيانة
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ROUTINE">دورية وقائية (Routine)</option>
                    <option value="REPAIR">إصلاح عطل (Repair)</option>
                    <option value="OVERHAUL">عمرة كاملة (Overhaul)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    التكلفة التشغيلية (IQD)
                  </label>
                  <input
                    name="cost"
                    type="number"
                    defaultValue="0"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    المهندس الفني المسؤول
                  </label>
                  <input
                    name="technician"
                    placeholder="مثال: م. علي صالح"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">
                    تاريخ الصيانة
                  </label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsMaintModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 rounded-xl text-sm font-black transition-all"
                >
                  تسجيل وتأكيد التشغيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
