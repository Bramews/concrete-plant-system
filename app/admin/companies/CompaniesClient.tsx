"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { deleteCompany, updateCompanyStatus } from "@/app/actions/companies";
import RecycleBinModal from "./RecycleBinModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";

interface CompaniesClientProps {
  initialCompanies: any[];
  deletedCompanies: any[];
  deletedUsers: any[];
  dict: any;
}

export function CompaniesClient({
  initialCompanies,
  deletedCompanies,
  deletedUsers,
  dict,
}: CompaniesClientProps) {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalDeleted = deletedCompanies.length + deletedUsers.length;

  const filteredCompanies = initialCompanies;

  const handleDelete = () => {
    if (!deleteConfirmId) return;

    startTransition(async () => {
      try {
        await deleteCompany(deleteConfirmId);
        toast.success("تم حذف الشركة بنجاح (نُقلت للأرشيف)");
        setDeleteConfirmId(null);
      } catch (error) {
        toast.error("فشل حذف الشركة");
      }
    });
  };

  const handleToggleStatus = (companyId: number, currentStatus: string) => {
    startTransition(async () => {
      try {
        const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        const result = await updateCompanyStatus(companyId, newStatus);
        if (result.success) {
          toast.success(
            newStatus === "ACTIVE" ? "تم تنشيط الشركة" : "تم تعليق الشركة",
          );
        } else {
          toast.error("فشل تغيير حالة الشركة");
        }
      } catch (error) {
        toast.error("حدث خطأ غير متوقع");
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Slug",
      "Status",
      "Users Count",
      "Plan",
      "Created At",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredCompanies.map((c) =>
        [
          c.id,
          `"${c.name}"`,
          c.slug,
          c.status,
          c._count?.users || 0,
          c.license?.type || "Basic",
          c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
        ].join(","),
      ),
    ].join("\n");

    // Create BOM for UTF-8 Excel support
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `companies_export_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-white/5 p-6 rounded-xl shadow-2xl mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-sm font-black text-white uppercase tracking-widest">
            {dict.companies.new_title}
          </h1>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            إجمالي الكيانات:{" "}
            <span className="text-primary">{initialCompanies.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-black px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all text-sm font-bold uppercase"
            title="تصدير قائمة الشركات الحالية إلى ملف Excel/CSV"
          >
            <Icons.Download className="w-4 h-4" />
            تصدير تقرير
          </button>

          <button
            onClick={() => setIsRecycleBinOpen(true)}
            className="group relative flex items-center gap-2 bg-white/5 border border-white/10 text-white font-black px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all text-sm font-bold uppercase"
          >
            <Icons.History className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
            سجل المحذوفات
            {totalDeleted > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-slate-900 animate-pulse">
                {totalDeleted}
              </span>
            )}
          </button>

          <Link
            href="/admin/companies/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground font-black px-4 py-2.5 rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all text-sm font-bold uppercase"
          >
            <Icons.Plus className="w-4 h-4" />
            {dict.companies.actions.new_company}
          </Link>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="relative bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-xl transition-all group hover:border-primary/30"
          >
            <div className="p-5 flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-lg font-black shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors mt-1">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex justify-between items-start mb-1">
                  <Link href={`/admin/companies/${company.id}`}>
                    <h3 className="text-sm font-bold font-black text-white uppercase truncate hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                  </Link>
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                      company.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {company.status === "ACTIVE" ? "نشط" : "معلق"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-500 font-mono truncate mb-3">
                  {company.slug}
                </p>

                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  <div className="flex items-center gap-1.5">
                    <Icons.User className="w-3 h-3" />
                    {company._count?.users || 0} مستخدم
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icons.CreditCard className="w-3 h-3" />
                    {company.license?.type || "أساسي"}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex justify-between items-center relative z-20">
              <Link
                href={`/admin/companies/${company.id}`}
                className="text-[9px] font-black text-primary uppercase hover:underline flex items-center gap-1"
              >
                التفاصيل
                <Icons.ArrowRight className="w-3 h-3" />
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(company.id, company.status)}
                  className={`p-1.5 rounded-md transition-all ${
                    company.status === "ACTIVE"
                      ? "hover:bg-amber-500/10 text-slate-400 hover:text-amber-500"
                      : "hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500"
                  }`}
                  title={
                    company.status === "ACTIVE"
                      ? "تجميد الشركة"
                      : "تنشيط الشركة"
                  }
                >
                  {company.status === "ACTIVE" ? (
                    <Icons.Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Icons.Play className="w-3.5 h-3.5" />
                  )}
                </button>
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  title="تعديل الشركة"
                >
                  <Icons.Edit className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(company.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                  title="نقل للأرشيف / حذف"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full py-20 bg-slate-900 border border-white/5 rounded-xl text-center border-dashed">
            <Icons.Factory className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">
              لم يتم العثور على أي شركات مطابقة لبحثك
            </p>
          </div>
        )}
      </div>

      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedCompanies={deletedCompanies}
        deletedUsers={deletedUsers}
      />

      <ConfirmationDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="تأكيد الحذف للأرشيف"
        description="هل أنت متأكد من رغبتك في حذف هذه الشركة؟ سيتم نقلها إلى سجل المحذوفات ويمكنك استعادتها لاحقاً."
        variant="danger"
        confirmText="نقل للأرشيف"
        cancelText="تراجع"
        isPending={isPending}
      />
    </>
  );
}
