"use client";

import { liftLockdown } from "@/app/actions/lockdown";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LockdownConfirmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLiftLockdown = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await liftLockdown();
      if (res.success) {
        // Redirect to login page
        router.push("/login");
      } else {
        setError(res.error || "فشل رفع حالة الطوارئ");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-red-950/95 text-slate-100 flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="bg-black/40 border border-red-500/40 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl shadow-red-900/20">
        {/* Pulsing Alarm Icon */}
        <div className="relative flex justify-center">
          <div
            className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-25 animate-ping"
            style={{ margin: "auto", width: "4rem", height: "4rem" }}
          ></div>
          <div className="bg-red-600 border-2 border-red-400 text-white rounded-full p-4 font-bold text-3xl z-10 w-16 h-16 flex items-center justify-center animate-pulse">
            🚨
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-red-400">
            وضع الطوارئ نشط (LOCKDOWN)
          </h1>
          <p className="text-sm text-slate-350">
            تم تفعيل الإغلاق الطارئ للنظام فوراً وحظر كافة الاتصالات الخارجية
            والمحلية، وإلغاء صلاحية جميع الجلسات النشطة لحماية البيانات.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-red-500/20 flex flex-col gap-3">
          <button
            onClick={handleLiftLockdown}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 text-sm"
          >
            {loading ? "جاري المعالجة..." : "رفع حالة الطوارئ وإعادة التشغيل"}
          </button>

          <p className="text-xs text-slate-450">
            * يتطلب رفع حالة الطوارئ تأكيد الاتصال الآمن بسيرفر المحطة.
          </p>
        </div>
      </div>
    </div>
  );
}
