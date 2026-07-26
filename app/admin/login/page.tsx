"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginSystemOwner } from "@/app/actions/system-owner";
import { Icons } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SystemOwnerLoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const res = await loginSystemOwner(formData);
    if (res.success) {
      toast.success("Welcome back, System Owner");
      router.push("/admin");
    } else {
      setError(res.error || "Login failed");
      toast.error(res.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6 animate-float">
            <Icons.ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            System Sovereignty
          </h1>
          <p className="text-slate-400 text-sm">Restricted Access Level 0</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500 font-semibold ml-1">
              Owner Identity
            </label>
            <div className="relative group">
              <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                name="email"
                type="email"
                required
                placeholder="owner@system.local"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500 font-semibold ml-1">
              Passkey
            </label>
            <div className="relative group">
              <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <SubmitButton />
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-bold text-slate-700 font-mono">
            SECURE CONNECTION • 256-BIT ENCRYPTED
          </p>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-6"
    >
      {pending ? "Authenticating..." : "Establish Session"}
    </button>
  );
}
