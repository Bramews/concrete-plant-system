"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/verification";
import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "SUBMITTING" | "SUCCESS">(
    "IDLE",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("SUBMITTING");
    setError("");

    const result = await requestPasswordReset(email);
    if (result.success) {
      setStatus("SUCCESS");
    } else {
      setError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
      setStatus("IDLE");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Icons.Key className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          نسيت كلمة المرور؟
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين
        </p>

        {status === "SUCCESS" ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6">
              <Icons.CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">تم الإرسال بنجاح</p>
              <p className="text-emerald-400/80 text-sm">
                تحقق من بريدك الإلكتروني للحصول على الرابط.
              </p>
            </div>
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Icons.ChevronRight className="w-4 h-4 rotate-180" />
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold font-medium text-slate-400 mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === "SUBMITTING"}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "SUBMITTING" ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <span>إرسال رابط التعيين</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm font-bold"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
