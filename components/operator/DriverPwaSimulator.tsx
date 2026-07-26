"use client";

import React, { useState, useRef, useEffect } from "react";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";

interface PwaTicket {
  id: number;
  ticketNumber: string;
  customerName: string;
  volume: number;
  grade: string;
  projectAddress: string;
  status: string; // DISPATCHED, DELIVERED
}

export default function DriverPwaSimulator() {
  const [tickets, setTickets] = useState<PwaTicket[]>([
    {
      id: 1,
      ticketNumber: "TKT-8902",
      customerName: "شركة الفرات للمقاولات",
      volume: 9.0,
      grade: "C30/37",
      projectAddress: "بابل - شارع 60",
      status: "تم الصب والإرسال",
    },
    {
      id: 2,
      ticketNumber: "TKT-8905",
      customerName: "مجموعة حمورابي العامة",
      volume: 10.0,
      grade: "C35/45",
      projectAddress: "النجف - حي السلام",
      status: "تم التسليم",
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState<PwaTicket | null>(
    tickets[0],
  );
  const [isOffline, setIsOffline] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number[]>([]);

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Clear signature canvas
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsSigned(false);
      }
    }
  };

  // Canvas drawing mouse handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    // Check if anything drawn
    setIsSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#38bdf8"; // Cyan blue brush

        if (e.type === "mousedown") {
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }
  };

  // Toggle PWA connection status
  const handleToggleConnection = () => {
    setIsOffline(!isOffline);
    toast.info(
      !isOffline
        ? "تم تحويل التطبيق لوضع التشغيل دون اتصال (Offline)"
        : "تم استعادة الاتصال بالإنترنت ومزامنة البيانات مع السيرفر الرئيسي!",
    );
  };

  // Sync offline queue when connection is restored
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      const loader = toast.loading("جاري مزامنة التذاكر المسلّمة أوفلاين...");
      setTimeout(() => {
        setTickets((prev) =>
          prev.map((t) =>
            offlineQueue.includes(t.id) ? { ...t, status: "تم التسليم" } : t,
          ),
        );
        setOfflineQueue([]);
        toast.success("تمت المزامنة بنجاح وحفظ التوقيعات والصور بالسيرفر!", {
          id: loader,
        });
      }, 2000);
    }
  }, [isOffline, offlineQueue]);

  // Submit delivery sign-off
  const handleSubmitDelivery = () => {
    if (!isSigned) {
      toast.warning("يرجى الحصول على توقيع المستلم أولاً");
      return;
    }

    if (selectedTicket) {
      if (isOffline) {
        // Queue for offline sync
        setOfflineQueue((prev) => [...prev, selectedTicket.id]);
        toast.success(
          "تم حفظ التذكرة محلياً في ذاكرة الجوال (IndexedDB) بانتظار استعادة الشبكة!",
        );
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: "تم التسليم" } : null,
        );
      } else {
        // Direct online submit
        const loader = toast.loading(
          "جاري رفع التوقيع والصورة وتأكيد التسليم...",
        );
        setTimeout(() => {
          setTickets((prev) =>
            prev.map((t) =>
              t.id === selectedTicket.id ? { ...t, status: "تم التسليم" } : t,
            ),
          );
          toast.success("تم إرسال تأكيد تسليم التذكرة بنجاح!", { id: loader });
          setSelectedTicket((prev) =>
            prev ? { ...prev, status: "تم التسليم" } : null,
          );
        }, 1500);
      }

      // Reset PWA state
      setHasPhoto(false);
      setIsSigned(false);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col items-center">
      <div className="w-full mb-6">
        <h3 className="text-lg font-bold text-white">
          محاكي تطبيق السائق (Driver PWA)
        </h3>
        <p className="text-slate-400 text-sm font-medium mt-1">
          رصد تجربة السائق بالكامل في تسليم التذاكر والتوقيع الإلكتروني والتشغيل
          دون اتصال
        </p>
      </div>

      {/* Connection Switcher */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4 px-4 py-2 bg-slate-900 border border-white/5 rounded-xl">
        <span className="text-sm font-bold text-slate-300">
          حالة شبكة الجوال:
        </span>
        <button
          onClick={handleToggleConnection}
          className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
            isOffline
              ? "bg-red-950 text-red-400 border border-red-900"
              : "bg-emerald-950 text-emerald-400 border border-emerald-900"
          }`}
        >
          {isOffline ? "🔴 منفصل (أوفلاين)" : "🟢 متصل (أونلاين)"}
        </button>
      </div>

      {/* The Smartphone Frame */}
      <div className="w-full max-w-sm bg-slate-950 rounded-[40px] border-8 border-slate-800 shadow-2xl p-4 relative overflow-hidden flex flex-col min-h-[580px]">
        {/* Smartphone Camera Notch */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
        </div>

        {/* PWA Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 pt-6 mb-4 text-white">
          <span className="text-sm font-black font-mono">12:00</span>
          <span className="text-sm font-black text-cyan-400">
            سائق نيون-لاب
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${isOffline ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}
            ></span>
            <span className="text-[10px] font-bold text-slate-400">
              {isOffline ? "أوفلاين" : "أونلاين"}
            </span>
          </div>
        </div>

        {/* PWA Main Screen */}
        <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
          {!selectedTicket ? (
            // Screen 1: Ticket list
            <div className="space-y-3">
              <h4 className="text-white text-sm font-bold mb-2">
                التذاكر المسندة لك اليوم
              </h4>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-4 bg-slate-900 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-all space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-cyan-400 font-mono">
                      <BidiText>{t.ticketNumber}</BidiText>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "تم التسليم"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                          : "bg-amber-950 text-amber-400 border border-amber-900"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-white text-sm font-bold truncate">
                      {t.customerName}
                    </h5>
                    <p className="text-slate-400 text-xs font-bold truncate">
                      {t.projectAddress}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-white/5">
                    <span className="text-slate-500">الحجم:</span>
                    <span className="text-slate-300 font-bold">
                      <BidiText>{t.volume} م³</BidiText>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Screen 2: Ticket details & Action Sign-off
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setHasPhoto(false);
                    setIsSigned(false);
                  }}
                  className="text-xs font-bold text-cyan-400 flex items-center gap-1 hover:underline"
                >
                  ← العودة لقائمة التذاكر
                </button>

                <div className="p-4 bg-slate-900 border border-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-sm font-black text-cyan-400 font-mono">
                      <BidiText>{selectedTicket.ticketNumber}</BidiText>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300">
                      <BidiText>{selectedTicket.grade}</BidiText>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-sm font-bold truncate">
                      {selectedTicket.customerName}
                    </h4>
                    <p className="text-slate-400 text-xs font-bold">
                      {selectedTicket.projectAddress}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-white/5">
                    <span className="text-slate-500">الحجم الكلي:</span>
                    <span className="text-emerald-400 font-black">
                      <BidiText>{selectedTicket.volume} م³</BidiText>
                    </span>
                  </div>
                </div>

                {selectedTicket.status !== "تم التسليم" ? (
                  <div className="space-y-4">
                    {/* Recipient Signature Canvas */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">
                          توقيع المستلم باللمس:
                        </label>
                        {isSigned && (
                          <button
                            onClick={clearSignature}
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            مسح التوقيع
                          </button>
                        )}
                      </div>
                      <canvas
                        ref={canvasRef}
                        width="300"
                        height="100"
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onMouseMove={draw}
                        className="bg-slate-900 border border-white/10 rounded-xl cursor-crosshair w-full"
                      />
                    </div>

                    {/* Camera simulation */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">
                        إثبات الصب (صورة الموقع):
                      </label>
                      {showCamera ? (
                        <div className="h-32 bg-slate-900 border border-white/10 rounded-xl relative overflow-hidden flex flex-col justify-center items-center">
                          <span className="text-slate-500 text-xs font-bold mb-2">
                            جاري محاكاة الكاميرا...
                          </span>
                          <button
                            onClick={() => {
                              setHasPhoto(true);
                              setShowCamera(false);
                              toast.success(
                                "تم التقاط صورة إثبات الموقع بنجاح!",
                              );
                            }}
                            className="px-4 py-1.5 bg-cyan-600 text-slate-950 text-xs font-black rounded-lg hover:bg-cyan-500 transition-all"
                          >
                            📸 التقاط الصورة
                          </button>
                        </div>
                      ) : hasPhoto ? (
                        <div className="h-32 bg-slate-900 border border-white/10 rounded-xl relative overflow-hidden flex justify-center items-center">
                          <div className="text-center p-3">
                            <span className="text-emerald-400 text-xs font-bold block mb-1">
                              ✓ تم إرفاق صورة الموقع
                            </span>
                            <button
                              onClick={() => setHasPhoto(false)}
                              className="text-[10px] text-red-400 hover:underline"
                            >
                              حذف وإعادة التقاط
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCamera(true)}
                          className="w-full py-3 bg-slate-900 border border-dashed border-white/10 hover:border-white/20 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          📷 فتح الكاميرا للموقع
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center">
                    <span className="text-emerald-400 text-lg font-bold block mb-1">
                      تم تسليم التذكرة!
                    </span>
                    <span className="text-slate-400 text-xs font-bold">
                      تم حفظ شهادة التسليم والتوقيع الإلكتروني.
                    </span>
                  </div>
                )}
              </div>

              {selectedTicket.status !== "تم التسليم" && (
                <button
                  onClick={handleSubmitDelivery}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-xl text-sm transition-all hover:from-emerald-600 hover:to-cyan-600 mt-4"
                >
                  {isOffline ? "💾 حفظ التسليم أوفلاين" : "رفع وتأكيد التذكرة"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Smartphone Home Bar */}
        <div className="w-32 h-1 bg-slate-800 rounded-full mx-auto mt-4 mb-1"></div>
      </div>
    </div>
  );
}
