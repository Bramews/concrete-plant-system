"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  validatePasswordResetToken,
  resetPassword,
} from "@/app/actions/verification";
import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "LOADING" | "VALID" | "INVALID" | "SUCCESS"
  >(token ? "LOADING" : "INVALID");
  const [error, setError] = useState(token ? "" : "رمز إعادة التعيين مفقود");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    validatePasswordResetToken(token).then((result) => {
      if (result.success) {
        setStatus("VALID");
      } else {
        setStatus("INVALID");
        setError(result.error || "الرابط غير صالح أو انتهت صلاحيته");
      }
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await resetPassword(token!, password);
    if (result.success) {
      setStatus("SUCCESS");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else {
      setError(result.error || "فشل إعادة تعيين كلمة المرور");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Icons.Key className="w-8 h-8 text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white text-center mb-2">
        كلمة المرور الجديدة
      </h1>

      {status === "LOADING" && (
        <div className="text-center py-8">
          <Icons.Loader className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">جاري التحقق من الرابط...</p>
        </div>
      )}

      {status === "INVALID" && (
        <div className="text-center py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <Icons.AlertOctagon className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
          <Link
            href="/forgot-password"
            className="text-indigo-400 hover:text-indigo-300 underline text-sm"
          >
            طلب رابط جديد
          </Link>
        </div>
      )}

      {status === "VALID" && (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <p className="text-slate-400 text-center text-sm">
            أدخل كلمة المرور الجديدة لحسابك
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold font-medium text-slate-400 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-medium text-slate-400 mb-1.5">
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Icons.Loader className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>تغيير كلمة المرور</span>
            )}
          </button>
        </form>
      )}

      {status === "SUCCESS" && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            تم التغيير بنجاح!
          </h3>
          <p className="text-slate-400 text-sm">
            يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>
          <p className="text-slate-500 text-sm font-bold mt-2">
            جاري التوجيه...
          </p>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <Suspense
          fallback={
            <div className="text-center py-8">
              <Icons.Loader className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">جاري التحميل...</p>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
