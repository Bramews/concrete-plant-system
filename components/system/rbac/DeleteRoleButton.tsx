"use client";

import { useState } from "react";
import { deleteRole } from "@/app/actions/rbac";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

interface Props {
  roleId: number;
  roleName: string;
  isSovereign: boolean;
  userCount: number;
}

export function DeleteRoleButton({
  roleId,
  roleName,
  isSovereign,
  userCount,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteRole(roleId);
      router.refresh();
      setIsConfirming(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "فشل حذف الدور");
      console.error(err);
    } finally {
      setIsPending(false);
    }
  }

  if (isSovereign) {
    return null; // لا يمكن حذف الأدوار السيادية
  }

  if (!isConfirming) {
    return (
      <button
        onClick={() => setIsConfirming(true)}
        className="px-3 py-1.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
        title="حذف الدور"
      >
        حذف
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setIsConfirming(false)}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">تأكيد الحذف</h3>
            <p className="text-sm text-slate-400">
              هذا الإجراء لا يمكن التراجع عنه
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-white/5 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-300">
            هل أنت متأكد من حذف الدور{" "}
            <span className="font-bold text-white">{roleName}</span>؟
          </p>
          {userCount > 0 && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm font-bold text-red-400 font-bold">
                ⚠️ تحذير: هذا الدور مرتبط بـ {userCount} مستخدم(ين). لا يمكن
                حذفه.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            className="flex-1 px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/5 rounded-lg transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending || userCount > 0}
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? "جاري الحذف..." : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
