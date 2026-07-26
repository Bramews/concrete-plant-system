"use client";

import { useState } from "react";
import { registerCompany } from "@/app/actions/register";
import { useRouter } from "next/navigation";
import { RegisterPageConfig } from "../actions/register-page";

export function RegisterForm({
  lang,
  config,
}: {
  lang: string;
  config: RegisterPageConfig;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const isRtl = lang === "ar";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await registerCompany(formData);

    if (res.success && res.redirectUrl) {
      router.push(res.redirectUrl);
    } else if (res.success) {
      // Fallback
      router.push("/login?message=registered");
    } else {
      setError(res.error || "Something went wrong");
      setLoading(false);
    }
  };

  const t = {
    companyName: isRtl ? config.companyNameAr : config.companyNameEn,
    subdomain: isRtl ? config.subdomainAr : config.subdomainEn,
    name: isRtl ? config.nameAr : config.nameEn,
    email: isRtl ? config.emailAr : config.emailEn,
    password: isRtl ? config.passwordAr : config.passwordEn,
    phone: isRtl ? config.phoneAr : config.phoneEn,
    submit: isRtl ? config.submitTextAr : config.submitTextEn,
    processing: isRtl ? "جاري الإنشاء..." : "Creating...",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="companyName"
            className="text-sm font-semibold uppercase text-slate-300"
          >
            {t.companyName}
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="subdomain"
            className="text-sm font-semibold uppercase text-slate-300"
          >
            {t.subdomain}
          </label>
          <input
            id="subdomain"
            name="subdomain"
            type="text"
            required
            pattern="[a-zA-Z0-9-]+"
            title="English letters, numbers, and hyphens only"
            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="e.g. acme-concrete"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="name"
          className="text-sm font-semibold uppercase text-slate-300"
        >
          {t.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-semibold uppercase text-slate-300"
          >
            {t.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="text-sm font-semibold uppercase text-slate-300"
          >
            {t.phone}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-semibold uppercase text-slate-300"
        >
          {t.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_5px_20px_-5px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t.processing : t.submit}
      </button>
    </form>
  );
}
