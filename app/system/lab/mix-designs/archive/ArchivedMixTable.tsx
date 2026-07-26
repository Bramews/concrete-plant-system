"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Icons } from "@/components/ui/Icons";
import {
  restoreMixDesign,
  deleteMixDesignPermanently,
} from "@/app/actions/lab";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export default function ArchivedMixTable({ mixes, dict, canDelete }: any) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const handleRestore = (id: number) => {
    setConfirmTitle("استعادة الخلطة");
    setConfirmDesc("هل أنت متأكد من استعادة هذه الخلطة إلى المسودات؟");
    setConfirmAction(() => async () => {
      setLoadingId(id);
      try {
        await restoreMixDesign(id);
        toast.success("تمت استعادة الخلطة بنجاح");
      } catch (e: unknown) {
        toast.error((e as Error).message || "فشلت عملية الاستعادة");
      } finally {
        setLoadingId(null);
      }
    });
    setConfirmOpen(true);
  };

  const handleDelete = (mix: any) => {
    // التحقق المسبق من الارتباط بأوردرات
    if (mix._count?.orders > 0) {
      toast.error(
        `لا يمكن الحذف! هذه الخلطة مرتبطة بـ (${mix._count.orders}) أوردرات. يرجى مراجعة سجلات الأوردرات المرتبطة بهذه الخلطة قبل محاولة الحذف.`,
      );
      return;
    }

    setConfirmTitle("حذف نهائي");
    setConfirmDesc("تأكيد الحذف النهائي؟ لا يمكن التراجع عن هذه الخطوة أبداً.");
    setConfirmAction(() => async () => {
      setLoadingId(mix.id);
      try {
        await deleteMixDesignPermanently(mix.id);
        toast.success("تم الحذف النهائي");
        router.refresh();
      } catch (e: unknown) {
        if ((e as Error).message === "HAS_ORDERS") {
          toast.error(
            "لا يمكن الحذف! هذه الخلطة مرتبطة بأوردرات موجودة بالفعل.",
          );
        } else {
          toast.error((e as Error).message || "Failed to delete");
        }
      } finally {
        setLoadingId(null);
      }
    });
    setConfirmOpen(true);
  };

  if (!mixes || mixes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl">
        <Icons.Inbox className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-300">
          {"لا توجد خلطات مؤشفة"}
        </h3>
        <p className="text-slate-500 text-sm mt-2">
          {"سلة الأرشيف فارغة حالياً."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/[0.05] border-b border-white/10 text-slate-400 font-black uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4 rounded-tl-xl text-right">
                {dict?.name || "الاسم"}
              </th>
              <th className="px-6 py-4 text-right">الرمز التلقائي</th>
              <th className="px-6 py-4 text-center">
                {dict?.strength_class || "رتبة المقاومة"}
              </th>
              <th className="px-6 py-4 text-center">أوردرات مرتبطة</th>
              <th className="px-6 py-4 text-center">تاريخ الأرشفة</th>
              <th className="px-6 py-4 text-center rounded-tr-xl">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mixes.map((mix: any) => (
              <tr key={mix.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-300 text-right">
                  {mix.name}
                </td>
                <td className="px-6 py-4 font-mono text-indigo-400 text-right">
                  {mix.code}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-bold font-mono">
                    {mix.strengthClass}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {mix._count?.orders > 0 ? (
                    <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold animate-pulse">
                      <Icons.AlertTriangle className="w-3.5 h-3.5" />
                      {mix._count.orders} أوردر
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">لا يوجد</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-slate-500 text-xs font-mono">
                  {mix.deletedAt
                    ? format(new Date(mix.deletedAt), "yyyy-MM-dd")
                    : "-"}
                </td>
                <td className="px-6 py-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleRestore(mix.id)}
                    disabled={loadingId === mix.id}
                    className="p-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors"
                    title={"استعادة الخلطة"}
                  >
                    <Icons.RefreshCw className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(mix)}
                      disabled={loadingId === mix.id}
                      className="p-2 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 transition-colors group relative"
                      title={"حذف نهائي"}
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (confirmAction) await confirmAction();
          setConfirmOpen(false);
        }}
        title={confirmTitle}
        description={confirmDesc}
        variant="danger"
        confirmText="تأكيد"
        cancelText="إلغاء"
      />
    </div>
  );
}
