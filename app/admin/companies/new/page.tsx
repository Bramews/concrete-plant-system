"use client";

import { useState } from "react";
import { usePreferences } from "@/context/PreferenceContext";
import { Icons } from "@/components/ui/Icons";
import { createCompany } from "@/app/actions/saas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPickerModal } from "@/components/ui/MapPickerModal";

export default function NewCompanyPage() {
  usePreferences();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await createCompany(formData);
      if (result.success) {
        router.push("/admin/companies");
      } else {
        setError(result.error || "حدث خطأ أثناء إنشاء الشركة.");
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in"
      dir="rtl"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-sm">
            <Icons.Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              تسجيل منشأة جديدة
            </h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
              New Facility Onboarding
            </p>
          </div>
        </div>
        <Link
          href="/admin/companies"
          className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white border border-white/5 rounded-xl text-sm font-bold transition-all"
        >
          الرجوع للقائمة
        </Link>
      </div>

      <form
        action={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Main Details */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl space-y-8">
            <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
              <Icons.Briefcase className="w-5 h-5" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                بيانات الشركة
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label
                  htmlFor="comp-name"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  اسم المنشأة / الشركة
                </label>
                <input
                  id="comp-name"
                  name="name"
                  required
                  placeholder="شركة الخرسانة المتطورة"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="comp-slug"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  المعرف (Slug)
                </label>
                <input
                  id="comp-slug"
                  name="domain"
                  required
                  placeholder="adv-concrete"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono font-bold ltr text-left"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="comp-address"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  العنوان / الموقع
                </label>
                <input
                  id="comp-address"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="بغداد - المنطقة الصناعية"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="comp-latitude"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  خط العرض (Latitude)
                </label>
                <input
                  id="comp-latitude"
                  name="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="30.5012"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono font-bold text-left ltr"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="comp-longitude"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  خط الطول (Longitude)
                </label>
                <input
                  id="comp-longitude"
                  name="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="47.8123"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono font-bold text-left ltr"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-white/10 rounded-xl text-sm font-bold text-indigo-400 flex items-center justify-center gap-2 transition-all"
                >
                  <Icons.Navigation className="w-4 h-4" />
                  تحديد موقع المعمل من الخريطة
                </button>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl space-y-8">
            <div className="flex items-center gap-3 text-emerald-500 border-b border-white/5 pb-4">
              <Icons.UserCheck className="w-5 h-5" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                حساب المدير المسؤول
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="admin-name"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  اسم المسؤول
                </label>
                <input
                  id="admin-name"
                  name="adminName"
                  required
                  placeholder="الاسم الثلاثي"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="admin-username"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  اسم المستخدم
                </label>
                <input
                  id="admin-username"
                  name="adminUsername"
                  required
                  placeholder="admin_username"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-bold ltr text-left"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="admin-email"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  البريد الإلكتروني
                </label>
                <input
                  id="admin-email"
                  name="adminEmail"
                  type="email"
                  required
                  placeholder="admin@company.com"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-left ltr"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="admin-pass"
                  className="text-sm font-bold text-slate-500 px-1"
                >
                  كلمة المرور
                </label>
                <input
                  id="admin-pass"
                  name="adminPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-left ltr"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar info & Actions */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center gap-3 text-purple-500 border-b border-white/5 pb-4">
              <Icons.CreditCard className="w-5 h-5" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                خطة الاشتراك
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2">
                <label
                  htmlFor="plan-type"
                  className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest"
                >
                  نوع الخطة
                </label>
                <select
                  id="plan-type"
                  name="planType"
                  aria-label="اختر نوع خطة الاشتراك"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-white outline-none cursor-pointer"
                >
                  <option value="BASIC">خطة أساسية (Basic)</option>
                  <option value="PREMIUM">خطة احترافية (Premium)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 flex justify-between items-center">
                <span className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  المستخدمين
                </span>
                <span className="text-sm font-bold font-black text-white">
                  غير محدود
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <Icons.Loader className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Icons.Plus className="w-5 h-5" /> إنشاء المنشأة الآن
                </>
              )}
            </button>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <Icons.AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-600 leading-relaxed">
                {error}
              </p>
            </div>
          )}
        </div>
      </form>
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(lat, lng, resolvedAddress) => {
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          if (resolvedAddress && !address) {
            setAddress(resolvedAddress);
          }
        }}
      />
    </div>
  );
}
