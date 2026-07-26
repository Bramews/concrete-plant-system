"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCompany, CreateCompanyState } from "@/app/actions/companies";
import { Icons } from "@/components/ui/Icons";

const initialState: CreateCompanyState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary w-full flex justify-center items-center gap-2"
    >
      {pending ? (
        <Icons.Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Icons.Plus className="w-4 h-4" />
      )}
      Register Company
    </button>
  );
}

export function CreateCompanyDialog({
  trigger,
  lang = "en",
}: {
  trigger: React.ReactNode;
  lang?: "en" | "ar";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(createCompany, initialState);

  // Close on success
  if (state.success && isOpen) {
    setIsOpen(false);
  }

  if (!isOpen) {
    return <div onClick={() => setIsOpen(true)}>{trigger}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Factory className="w-5 h-5 text-cyan-400" />
            {"تسجيل شركة جديدة"}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white"
            aria-label={"إغلاق"}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form action={formAction} className="space-y-4">
            {state.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {state.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">
                  {"اسم الشركة"}
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Beta Concrete"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                {state.fieldErrors?.name && (
                  <p className="text-sm font-bold text-red-400">
                    {state.fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">
                  {"معرف الشركة (Slug)"}
                </label>
                <input
                  name="slug"
                  type="text"
                  required
                  placeholder="e.g. beta-concrete"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
                {state.fieldErrors?.slug && (
                  <p className="text-sm font-bold text-red-400">
                    {state.fieldErrors.slug}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase">
                {"الخطة"}
              </label>
              <select
                name="plan"
                aria-label={"الخطة"}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="TRIAL">Trial (14 Days)</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            <div className="border-t border-white/10 my-4 pt-4">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">
                {"حساب المدير (Admin)"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">
                    {"الاسم الكامل"}
                  </label>
                  <input
                    name="adminName"
                    type="text"
                    required
                    placeholder="Manager Name"
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  {state.fieldErrors?.adminName && (
                    <p className="text-sm font-bold text-red-400">
                      {state.fieldErrors.adminName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">
                    {"البريد الإلكتروني"}
                  </label>
                  <input
                    name="adminEmail"
                    type="email"
                    required
                    placeholder="admin@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  {state.fieldErrors?.adminEmail && (
                    <p className="text-sm font-bold text-red-400">
                      {state.fieldErrors.adminEmail}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-sm font-bold text-slate-400 uppercase">
                  {"كلمة المرور"}
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="******"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                {state.fieldErrors?.password && (
                  <p className="text-sm font-bold text-red-400">
                    {state.fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary"
              >
                {"إلغاء"}
              </button>
              <div className="w-40">
                <SubmitButton />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
