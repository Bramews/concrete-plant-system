"use client";

import React, { useState } from "react";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import { reportFault, resolveFault } from "@/app/actions/operator-cockpit";

interface FaultItem {
  id: number;
  equipmentId: number;
  equipmentName: string;
  title: string;
  description: string;
  severity: number; // 1-5
  reportedBy: string;
  reportedAt: Date | string;
  status: string; // PENDING, RESOLVED
  resolvedAt?: Date | string | null;
  solution?: string | null;
  cost?: number;
  type?: string;
}

interface EquipmentOption {
  id: number;
  name: string;
}

interface SmartFaultLogProps {
  initialFaults?: FaultItem[];
  equipmentOptions?: EquipmentOption[];
}

export default function SmartFaultLog({
  initialFaults = [],
  equipmentOptions = [],
}: SmartFaultLogProps) {
  const [faults, setFaults] = useState<FaultItem[]>(initialFaults);

  React.useEffect(() => {
    setFaults(initialFaults);
  }, [initialFaults]);

  const eqOptions = equipmentOptions;

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedFault, setSelectedFault] = useState<FaultItem | null>(null);

  const handleReportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loader = toast.loading("جاري تسجيل بلاغ العطل...");

    try {
      const res = await reportFault(formData);
      if (res.success && res.data) {
        toast.success("تم تسجيل البلاغ بنجاح وتجميد تشغيل المعدة!", {
          id: loader,
        });

        const eqId = parseInt(formData.get("equipmentId") as string);
        const eqName =
          eqOptions.find((o) => o.id === eqId)?.name || "معدة غير معروفة";

        const newFault: FaultItem = {
          ...(res.data as any),
          equipmentName: eqName,
        };

        setFaults((prev) => [newFault, ...prev]);
        setIsReportOpen(false);
      } else {
        toast.error(res.error || "فشل تسجيل البلاغ", { id: loader });
      }
    } catch (err) {
      toast.error("حدث خطأ ما", { id: loader });
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedFault) {
      formData.append("faultId", selectedFault.id.toString());
    }
    const loader = toast.loading("جاري إغلاق ملف العطل...");

    try {
      const res = await resolveFault(formData);
      if (res.success) {
        toast.success("تم إصلاح العطل وإعادة تفعيل المعدة بنجاح!", {
          id: loader,
        });

        const sol = formData.get("solution") as string;
        const c = parseFloat((formData.get("cost") as string) || "0");

        setFaults((prev) =>
          prev.map((f) =>
            f.id === selectedFault?.id
              ? {
                  ...f,
                  status: "RESOLVED",
                  solution: sol,
                  cost: c,
                  resolvedAt: new Date()
                    .toISOString()
                    .replace("T", " ")
                    .substring(0, 16),
                }
              : f,
          ),
        );

        setIsResolveOpen(false);
      } else {
        toast.error(res.error || "فشل إغلاق البلاغ", { id: loader });
      }
    } catch (err) {
      toast.error("حدث خطأ ما", { id: loader });
    }
  };

  const getSeverityBadge = (lvl: number) => {
    if (lvl >= 5) {
      return (
        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-900 rounded text-xs font-bold font-mono">
          طوارئ (5)
        </span>
      );
    } else if (lvl >= 3) {
      return (
        <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-900 rounded text-xs font-bold font-mono">
          عالي (3-4)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs font-bold font-mono">
          منخفض (1-2)
        </span>
      );
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">سجل الأعطال الذكي</h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            تتبع تقارير الأعطال وتصليحها الفوري
          </p>
        </div>
        <button
          onClick={() => setIsReportOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all border border-red-500/30"
        >
          🚨 إبلاغ عن عطل
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>المعدة</th>
              <th>العطل</th>
              <th>الخطورة</th>
              <th>المبلغ</th>
              <th>الوقت</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {faults.map((f) => (
              <tr key={f.id}>
                <td className="text-slate-300 font-bold">{f.equipmentName}</td>
                <td>
                  <div className="space-y-1">
                    <p className="text-white text-sm font-bold">{f.title}</p>
                    <p
                      className="text-slate-400 text-xs font-bold max-w-[300px] truncate"
                      title={f.description}
                    >
                      {f.description}
                    </p>
                    {f.status === "RESOLVED" && (
                      <p className="text-emerald-400 text-xs font-bold">
                        الحل: {f.solution}
                      </p>
                    )}
                  </div>
                </td>
                <td>{getSeverityBadge(f.severity)}</td>
                <td>
                  <span className="font-mono text-slate-300 font-bold">
                    <BidiText>
                      {f.cost ? `${f.cost.toLocaleString("en-US")} د.ع` : "-"}
                    </BidiText>
                  </span>
                </td>
                <td className="text-slate-400 text-xs font-bold font-mono">
                  <BidiText>{String(f.reportedAt)}</BidiText>
                </td>
                <td>
                  {f.status === "PENDING" ? (
                    <span className="status-badge status-LAB_PENDING">
                      نشط قيد الصيانة
                    </span>
                  ) : (
                    <span className="status-badge status-LAB_APPROVED">
                      تم الإصلاح
                    </span>
                  )}
                </td>
                <td>
                  {f.status === "PENDING" ? (
                    <button
                      onClick={() => {
                        setSelectedFault(f);
                        setIsResolveOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-bold transition-all"
                    >
                      إغلاق وإصلاح
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">
                      مغلق
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: REPORT FAULT */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">
              تسجيل بلاغ عطل طارئ
            </h3>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  المعدة المتأثرة
                </label>
                <select
                  name="equipmentId"
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>
                    اختر المعدة
                  </option>
                  {eqOptions.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  عنوان العطل
                </label>
                <input
                  name="title"
                  required
                  placeholder="مثال: تسرب في هيدروليك حلة الخلط"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  وصف المشكلة بالتفصيل
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="اشرح العطل بالتفصيل وكيف يؤثر على خط الإنتاج..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  الخطورة والأثر (1-5)
                </label>
                <select
                  name="severity"
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="1">1 - عطل بسيط لا يؤثر على سير العمل</option>
                  <option value="2">
                    2 - عطل متوسط مع انخفاض بسيط بالكفاءة
                  </option>
                  <option value="3">3 - عطل عالي يعيق تشغيل جزء فرعي</option>
                  <option value="4">4 - عطل حرج يهدد جودة الإنتاج</option>
                  <option value="5">5 - طوارئ (توقف خط الإنتاج بالكامل)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all border border-red-500/30"
                >
                  إرسال البلاغ وتجميد المعدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE FAULT */}
      {isResolveOpen && selectedFault && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">
              إغلاق وتسجيل حل العطل
            </h3>
            <p className="text-slate-400 text-sm font-medium mb-4">
              المعدة:{" "}
              <span className="text-white font-bold">
                {selectedFault.equipmentName}
              </span>{" "}
              <br />
              المشكلة:{" "}
              <span className="text-red-400 font-bold">
                {selectedFault.title}
              </span>
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  الحل الفعلي المطبق
                </label>
                <textarea
                  name="solution"
                  required
                  rows={3}
                  placeholder="اشرح بالتفصيل كيف تم حل العطل وما هي القطع التي تم تبديلها..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  التكلفة المالية الإجمالية للإصلاح (IQD)
                </label>
                <input
                  name="cost"
                  type="number"
                  defaultValue="0"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 rounded-xl text-sm font-black transition-all"
                >
                  إغلاق وتفعيل التشغيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
