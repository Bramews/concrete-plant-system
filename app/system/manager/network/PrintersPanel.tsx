"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";
import {
  getPrinters,
  addPrinter,
  deletePrinter,
  discoverLocalPrinters,
} from "@/app/actions/printers";
import { Loader2, Wifi, Plus } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export function PrintersPanel({ companyId }: { companyId: number }) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("9100");
  const [department, setDepartment] = useState("LAB");
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const loadPrinters = async () => {
    setLoading(true);
    const res = await getPrinters(companyId);
    if (res.success && res.printers) {
      setPrinters(res.printers);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPrinters();
  }, []);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    const res = await discoverLocalPrinters(companyId);
    if (res.success && res.printers) {
      setDiscoveredPrinters(res.printers);
      if (res.printers.length === 0) {
        toast.info("لم يتم العثور على طابعات جديدة غير مسجلة حالياً");
      } else {
        toast.success(
          `تم العثور على ${res.printers.length} طابعات جديدة في الشبكة`,
        );
      }
    } else {
      toast.error("فشل فحص الشبكة: " + res.error);
    }
    setIsDiscovering(false);
  };

  const handleAddDiscovered = async (p: any) => {
    const res = await addPrinter({
      companyId,
      name: p.name,
      ipAddress: p.ipAddress,
      port: p.port,
      department: p.department,
      isDefault: false,
    });
    if (res.success) {
      toast.success(`تمت إضافة ${p.name} بنجاح`);
      setDiscoveredPrinters((prev) =>
        prev.filter((x) => x.ipAddress !== p.ipAddress),
      );
      loadPrinters();
    } else {
      toast.error("فشل الإضافة: " + res.error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addPrinter({
      companyId,
      name,
      ipAddress,
      port: Number(port),
      department,
      isDefault,
    });
    if (res.success) {
      toast.success("تم تسجيل الطابعة بنجاح");
      setName("");
      setIpAddress("");
      loadPrinters();
    } else {
      toast.error("فشل تسجيل الطابعة: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setConfirmOpen(false);
    const id = deleteId;
    setDeleteId(null);
    const res = await deletePrinter(id);
    if (res.success) {
      toast.success("تم الحذف بنجاح");
      setPrinters((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div
      className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl mt-8"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 gap-4 flex-wrap">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Icons.Printer className="w-5 h-5 text-indigo-400" />
          طابعات الشبكة المحلية للطباعة التلقائية
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscover}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-indigo-600/10"
          >
            {isDiscovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            {isDiscovering
              ? "جاري فحص الشبكة..."
              : "البحث التلقائي عن الطابعات"}
          </button>
          <button
            onClick={loadPrinters}
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <Icons.Loader
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2">
                  اسم الطابعة
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: طابعة المختبر الرئيسية"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2">
                  القسم
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="LAB" className="bg-slate-900">
                    المختبر
                  </option>
                  <option value="DISPATCH" className="bg-slate-900">
                    المبيعات وقطع التذاكر
                  </option>
                  <option value="ADMIN" className="bg-slate-900">
                    الإدارة
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2">
                  عنوان IP للطابعة
                </label>
                <input
                  required
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-mono text-sm focus:border-indigo-500 outline-none transition-all"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2">
                  المنفذ (Port)
                </label>
                <input
                  required
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-mono text-sm focus:border-indigo-500 outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-white/5 border-white/10 focus:ring-indigo-500"
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-bold text-slate-300"
              >
                طابعة رئيسية (Default) لهذا القسم
              </label>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all mt-4"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة الطابعة"}
            </button>
          </form>
        </div>

        <div>
          <div className="space-y-6">
            {/* Radar Scan Visualizer */}
            {isDiscovering && (
              <div className="relative w-full h-[180px] bg-slate-950/50 border border-indigo-500/20 rounded-3xl flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
                {/* Radar Grid circles */}
                <div className="absolute w-[120px] h-[120px] border border-indigo-500/25 rounded-full animate-ping" />
                <div className="absolute w-[90px] h-[90px] border border-indigo-500/15 rounded-full" />
                <div className="absolute w-[60px] h-[60px] border border-indigo-500/10 rounded-full" />
                {/* Radar sweep beam */}
                <div className="absolute w-[180px] h-[180px] bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full animate-[spin_3s_linear_infinite]" />
                {/* Radar sweep crosshair */}
                <div className="absolute w-full h-[1px] bg-indigo-500/10" />
                <div className="absolute h-full w-[1px] bg-indigo-500/10" />
                {/* Core */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-[11px] font-black text-indigo-300 animate-pulse tracking-wider">
                    جاري مسح النطاق الفرعي للشبكة... (Radar Scanning)
                  </span>
                </div>
              </div>
            )}

            {/* Discovered Printers (Unregistered) */}
            {discoveredPrinters.length > 0 && (
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-4">
                <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-400" />
                  طابعات تم اكتشافها بالشبكة ({discoveredPrinters.length})
                </h3>
                <div className="space-y-2">
                  {discoveredPrinters.map((p) => (
                    <div
                      key={p.ipAddress}
                      className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {p.ipAddress}:{p.port} - {p.department}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddDiscovered(p)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registered Printers */}
            <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-4 h-[350px] overflow-y-auto">
              <h3 className="text-xs font-black text-slate-400 mb-3 border-b border-white/5 pb-2">
                الطابعات المسجلة
              </h3>
              {printers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm font-bold py-12">
                  <Icons.Printer className="w-12 h-12 mb-3 opacity-20" />
                  لا توجد طابعات شبكية مسجلة
                </div>
              ) : (
                <div className="space-y-3">
                  {printers.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                          <Icons.Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {p.name}
                            {p.isDefault && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                الرئيسية
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-1">
                            {p.ipAddress}:{p.port} - {p.department}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
        onConfirm={executeDelete}
        title="حذف الطابعة"
        description="هل أنت متأكد من حذف هذه الطابعة؟"
        variant="danger"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
