"use client";

import React, { useState } from "react";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import { createBatch } from "@/app/actions/production";

interface OrderOption {
  id: number;
  orderNumber: string;
  customerName: string;
  volume: number;
  actualQuantity: number;
  mixGrade: string;
}

interface OneClickProps {
  orders: OrderOption[];
}

export default function OneClickProduction({ orders = [] }: OneClickProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [truckNumber, setTruckNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [batchVolume, setBatchVolume] = useState<number>(8); // default 8m³

  const activeOrders = orders;

  // Play synthetic physical alert beep using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150); // 150ms beep duration
    } catch (e) {
      console.warn(
        "Web Audio API not supported or blocked by user gesture:",
        e,
      );
    }
  };

  const handleOrderChange = (id: string) => {
    setSelectedOrderId(id);
  };

  const handleBatchExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !truckNumber || !driverName) {
      toast.warning("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const loader = toast.loading("جاري تشغيل الخلاطة وصرف المواد...");
    playBeep(); // Beep immediately at start of execution

    try {
      const formData = new FormData();
      formData.append("orderId", selectedOrderId);
      formData.append("quantity", batchVolume.toString());
      formData.append("truckNumber", truckNumber);
      formData.append("driverName", driverName);
      formData.append(
        "requestId",
        `oneclick-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      );

      const res = await createBatch(formData);
      if (res.success) {
        toast.success(`تم إنتاج وصرف دفعة بمقدار ${batchVolume} م³ بنجاح!`, {
          id: loader,
        });
        playBeep(); // Beep twice for success
        setTimeout(playBeep, 200);
        setIsOpen(false);
      } else {
        toast.error(res.error || "فشل إنتاج الدفعة", { id: loader });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "حدث خطأ غير متوقع", {
        id: loader,
      });
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 border border-cyan-400/30"
        title="إنتاج دفعة سريعة بضغطة واحدة"
      >
        <span className="text-2xl font-black">⚡</span>
      </button>

      {/* Modal dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">
                ⚡ إنتاج دفعة سريعة (One-Click)
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchExecution} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1">
                  اختر الطلبية النشطة
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>
                    -- اختر الطلبية --
                  </option>
                  {activeOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} ({o.mixGrade})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrderId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-300 block mb-1">
                        رقم الشاحنة
                      </label>
                      <input
                        value={truckNumber}
                        onChange={(e) => setTruckNumber(e.target.value)}
                        placeholder="مثال: T-101"
                        required
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-300 block mb-1">
                        اسم السائق
                      </label>
                      <input
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="أدخل اسم السائق"
                        required
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-1">
                      حجم الدفعة المطلوبة (م³)
                    </label>
                    <div className="flex gap-2">
                      {[6, 8, 10, 12].map((vol) => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setBatchVolume(vol)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                            batchVolume === vol
                              ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                              : "bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          <BidiText>{vol} م³</BidiText>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-xl text-sm font-black transition-all hover:from-emerald-600 hover:to-cyan-600 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/20"
                    >
                      <span>⚡ تأكيد وتشغيل الخلاطة فورياً</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
