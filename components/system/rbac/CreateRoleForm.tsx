"use client";

import { useState } from "react";
import { createRole } from "@/app/actions/rbac";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";

export function CreateRoleForm({
  companyId,
  departments,
  companies,
}: {
  companyId?: number;
  departments?: any[];
  companies?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createRole(
        formData.get("name") as string,
        formData.get("displayName") as string,
        formData.get("description") as string,
        companyId,
      );
      setIsOpen(false);
      router.refresh();
      toast.success("تم إنشاء الدور بنجاح");
    } catch (err) {
      toast.error("Failed to create role");
      console.error(err);
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-full min-h-[180px] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-4 group p-6 text-center"
      >
        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          <Icons.Plus className="w-8 h-8" />
        </div>
        <div>
          <span className="block font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">
            إضافة دور جديد
          </span>
          <span className="text-sm font-bold text-slate-500 mt-1 block">
            إنشاء دور وظيفي جديد وتخصيص صلاحياته
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="h-full bg-slate-800 border border-white/10 rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in-95 flex flex-col">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Plus className="w-5 h-5 text-indigo-500" />
        بيانات الدور الجديد
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        <div>
          <label className="text-sm font-bold text-slate-400 block mb-1">
            الاسم الداخلي (English)
          </label>
          <input
            name="name"
            required
            pattern="[A-Z_]+"
            placeholder="e.g. SITE_MANAGER"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono uppercase text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
          <p className="text-sm font-bold text-slate-500 mt-1">
            يستخدم في الكود. أحرف إنجليزية كبيرة و _ فقط.
          </p>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-400 block mb-1">
            الاسم المعروض (العربية)
          </label>
          <input
            name="displayName"
            required
            placeholder="مثال: مدير موقع"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex-1">
          <label className="text-sm font-bold text-slate-400 block mb-1">
            الوصف
          </label>
          <textarea
            name="description"
            placeholder="وصف مختصر للمسؤوليات..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm h-20 resize-none text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 pt-2 mt-auto">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 px-3 py-2 text-sm font-bold text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-3 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
          >
            {isPending ? "جاري الحفظ..." : "حفظ الدور"}
          </button>
        </div>
      </form>
    </div>
  );
}
