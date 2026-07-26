"use client";

import { useState, useTransition } from "react";
import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import {
  restoreEntity,
  hardDeleteEntity,
  emptyRecycleBin,
} from "@/app/actions/recycle-bin";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedCompanies: { id: number; name: string; deletedAt: Date | null }[];
  deletedUsers: {
    id: number;
    username?: string | null;
    email: string;
    deletedAt: Date | null;
  }[];
}

export default function RecycleBinModal({
  isOpen,
  onClose,
  deletedCompanies,
  deletedUsers,
}: RecycleBinModalProps) {
  const [isPending, startTransition] = useTransition();
  const [activeSegment, setActiveSegment] = useState<"companies" | "users">(
    "companies",
  );

  // States for confirmation dialogs
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    type: "single" | "empty";
    model?: "company" | "user";
    id?: number;
  }>({ isOpen: false, type: "single" });

  if (!isOpen) return null;

  const handleRestore = async (model: "company" | "user", id: number) => {
    startTransition(async () => {
      const result = await restoreEntity(model, id);
      if (result.success) {
        toast.success(
          model === "company" ? "تم استعادة الشركة" : "تم استعادة المستخدم",
        );
      } else {
        toast.error(result.error || "فشلت عملية الاستعادة");
      }
    });
  };

  const handleHardDelete = async () => {
    if (!deleteConfirmDialog.model || !deleteConfirmDialog.id) return;

    startTransition(async () => {
      const result = await hardDeleteEntity(
        deleteConfirmDialog.model!,
        deleteConfirmDialog.id!,
      );
      if (result.success) {
        toast.success("تم الحذف نهائياً");
      } else {
        toast.error(result.error || "فشل الحذف النهائي");
      }
      setDeleteConfirmDialog({ isOpen: false, type: "single" });
    });
  };

  const handleEmptyBin = async () => {
    if (!deleteConfirmDialog.model) return;

    startTransition(async () => {
      const result = await emptyRecycleBin(deleteConfirmDialog.model!);
      if (result.success) {
        toast.success("تم إفراغ سلة المحذوفات");
      } else {
        toast.error(result.error || "فشل إفراغ السلة");
      }
      setDeleteConfirmDialog({ isOpen: false, type: "empty" });
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8"
        dir="rtl"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-4xl bg-slate-900/40 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 backdrop-blur-3xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Icons.History className="w-5 h-5 text-amber-500" />
                </div>
                سلة المحذوفات
              </h2>
              <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-[0.2em]">
                تصفح واستعد العناصر التي تم حذفها مؤخراً
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Segmented Control */}
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                <button
                  onClick={() => setActiveSegment("companies")}
                  className={`px-6 py-2 rounded-xl text-sm font-bold font-black uppercase tracking-widest transition-all ${
                    activeSegment === "companies"
                      ? "bg-white text-black shadow-xl"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  الشركات ({deletedCompanies.length})
                </button>
                <button
                  onClick={() => setActiveSegment("users")}
                  className={`px-6 py-2 rounded-xl text-sm font-bold font-black uppercase tracking-widest transition-all ${
                    activeSegment === "users"
                      ? "bg-white text-black shadow-xl"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  المستخدمون ({deletedUsers.length})
                </button>
              </div>

              {/* Empty Bin Button */}
              {((activeSegment === "companies" &&
                deletedCompanies.length > 0) ||
                (activeSegment === "users" && deletedUsers.length > 0)) && (
                <button
                  onClick={() =>
                    setDeleteConfirmDialog({
                      isOpen: true,
                      type: "empty",
                      model: activeSegment === "companies" ? "company" : "user",
                    })
                  }
                  className="px-4 py-2 border border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                  إفراغ السلة
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              title="إغلاق سلة المحذوفات"
              className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeSegment === "companies" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deletedCompanies.length === 0 ? (
                  <EmptyState
                    icon={<Icons.Factory className="w-8 h-8" />}
                    message="لا توجد شركات محذوفة"
                  />
                ) : (
                  deletedCompanies.map((c) => (
                    <EntityCard
                      key={c.id}
                      title={c.name}
                      subtitle={`حُذف: ${c.deletedAt ? format(new Date(c.deletedAt), "yyyy-MM-dd") : "-"}`}
                      onRestore={() => handleRestore("company", c.id)}
                      onHardDelete={() =>
                        setDeleteConfirmDialog({
                          isOpen: true,
                          type: "single",
                          model: "company",
                          id: c.id,
                        })
                      }
                      isPending={isPending}
                      icon={c.name.charAt(0)}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deletedUsers.length === 0 ? (
                  <EmptyState
                    icon={<Icons.Users className="w-8 h-8" />}
                    message="لا توجد مستخدمون محذوفون"
                  />
                ) : (
                  deletedUsers.map((u) => (
                    <EntityCard
                      key={u.id}
                      title={u.username || u.email}
                      subtitle={`حُذف: ${u.deletedAt ? format(new Date(u.deletedAt), "yyyy-MM-dd") : "-"}`}
                      onRestore={() => handleRestore("user", u.id)}
                      onHardDelete={() =>
                        setDeleteConfirmDialog({
                          isOpen: true,
                          type: "single",
                          model: "user",
                          id: u.id,
                        })
                      }
                      isPending={isPending}
                      icon={(u.username || u.email).charAt(0)}
                      variant="user"
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-black/20 border-t border-white/5 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              يمكنك حذف العناصر نهائياً من هنا أو سيتم الاحتفاظ بها لمدة 30
              يوماً
            </p>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() =>
          setDeleteConfirmDialog({ isOpen: false, type: "single" })
        }
        onConfirm={
          deleteConfirmDialog.type === "empty"
            ? handleEmptyBin
            : handleHardDelete
        }
        title="تأكيد الحذف النهائي"
        description={
          deleteConfirmDialog.type === "empty"
            ? `هل أنت متأكد من رغبتك في إفراغ سلة محذوفات ${deleteConfirmDialog.model === "company" ? "الشركات" : "المستخدمين"}؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات بشكل نهائي.`
            : "هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم محو بياناته للآبد."
        }
        variant="danger"
        confirmText="حذف نهائي"
        cancelText="إلغاء الأمر"
        isPending={isPending}
      />
    </>
  );
}

function EntityCard({
  title,
  subtitle,
  onRestore,
  onHardDelete,
  isPending,
  icon,
  variant = "company",
}: any) {
  return (
    <div className="p-4 rounded-[1.5rem] bg-slate-900/50 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all shadow-lg hover:shadow-white/5">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg border border-white/10 ${variant === "company" ? "bg-indigo-500/20 border-indigo-500/30" : "bg-red-500/20 border-red-500/30"}`}
        >
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold font-black text-white leading-tight mb-1">
            {title}
          </h4>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onHardDelete}
          disabled={isPending}
          title="حذف نهائي"
          className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
        >
          <Icons.Trash className="w-4 h-4" />
        </button>
        <button
          onClick={onRestore}
          disabled={isPending}
          className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all transform active:scale-95 disabled:opacity-50 ${variant === "company" ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
        >
          استعادة
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: any) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
      <div className="mb-4 text-slate-600 border-2 border-dashed border-white/10 p-6 rounded-full">
        {icon}
      </div>
      <p className="text-sm font-bold font-black uppercase tracking-widest text-slate-500">
        {message}
      </p>
    </div>
  );
}
