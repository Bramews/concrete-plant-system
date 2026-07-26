"use client";

import { useState } from "react";
import { updateRole } from "@/app/actions/rbac";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";

interface Role {
  id: number;
  name: string;
  displayName: string | null;
  description: string | null;
  isSystem: boolean;
  isSovereign: boolean;
}

interface Props {
  role: Role;
}

export function EditRoleDialog({ role }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateRole(role.id, {
        displayName: formData.get("displayName") as string,
        description: formData.get("description") as string,
        // We generally don't update 'name' for system roles to avoid breaking code references
        // But for custom roles, we could allow it. For now, let's stick to display properties to be safe.
      });
      setIsOpen(false);
      router.refresh();
      toast.success("تم تحديث الدور بنجاح");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update role");
      console.error(err);
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-sm font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all flex items-center gap-1"
        title="تعديل بيانات الدور"
        disabled={role.isSovereign} // Cannot edit sovereign roles totally? Maybe allow description.
      >
        <Icons.Edit className="w-3 h-3" />
        تعديل
      </button>
    );
  }

  // If sovereign, maybe restrictive? user said "Full Control".
  // Actions checks isSovereign. Let's assume description/display name is fine even for sovereign?
  // Actually, actions/rbac.ts says: if (role.isSovereign) throw "Cannot modify sovereign roles".
  // So we must respect that disable logic or update action.
  // For now, respect action logic.

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Icons.Edit className="w-5 h-5 text-indigo-500" />
            تعديل الدور:{" "}
            <span className="text-indigo-400">
              {role.displayName || role.name}
            </span>
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
            title="إغلاق"
            aria-label="Close"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="role-display-name"
              className="text-sm font-bold text-slate-500 block mb-1.5"
            >
              الاسم المعروض (العربية)
            </label>
            <input
              id="role-display-name"
              name="displayName"
              required
              defaultValue={role.displayName || ""}
              className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="مثال: مدير موقع"
              title="الاسم المعروض للدور"
            />
          </div>

          <div>
            <label
              htmlFor="role-name"
              className="text-sm font-bold text-slate-500 block mb-1.5"
            >
              الاسم البرمجي (للعلم فقط)
            </label>
            <input
              id="role-name"
              disabled
              value={role.name}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/5 rounded-lg text-slate-500 text-sm font-mono cursor-not-allowed"
              title="الاسم البرمجي الفريد"
            />
            <p className="text-sm font-bold text-slate-600 mt-1">
              لا يمكن تعديل الاسم البرمجي للأدوار الحالية حفاظاً على استقرار
              النظام.
            </p>
          </div>

          <div>
            <label
              htmlFor="role-description"
              className="text-sm font-bold text-slate-500 block mb-1.5"
            >
              الوصف
            </label>
            <textarea
              id="role-description"
              name="description"
              defaultValue={role.description || ""}
              className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="وصف مختصر للمهام والمسؤوليات..."
              title="وصف مهام الدور"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5 rounded-lg transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isPending ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Icons.Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
