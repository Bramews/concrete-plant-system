"use client";
/* eslint-disable react/no-unknown-property */

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSieveAnalysis } from "@/app/actions/sieve";
import { exportSieveAnalysisToPDF } from "@/lib/sieve-calculations";
import {
  exportSieveTestsToExcel,
  exportSingleSieveToExcel,
} from "@/lib/sieve-export";
import SievePrintModal from "./SievePrintModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { usePreferences } from "@/context/PreferenceContext";
import { dictionary } from "@/lib/dictionary.base";

interface SieveArchiveProps {
  tests: any[];
}

export default function SieveArchive({ tests }: SieveArchiveProps) {
  const router = useRouter();
  const { preferences } = usePreferences();
  const lang = preferences.language as "ar" | "en";
  const t = dictionary[lang];

  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await deleteSieveAnalysis(confirmDeleteId);
      if (res.success) {
        toast.success(t.common.save_success || "تم حذف الفحص بنجاح");
        router.refresh();
      } else {
        toast.error(res.error || t.common.save_error || "فشل في حذف الفحص");
      }
    } catch (error) {
      toast.error(
        t.api_errors?.server_error || "حدث خطأ أثناء الاتصال بالسيرفر",
      );
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/system/lab/sieve-analysis"
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            title="العودة للوحة التحكم"
          >
            <Icons.ArrowRight className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">أرشيف الفحوصات</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
              سجل تاريخي متكامل لكافة عينات المختبر
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => exportSieveTestsToExcel(tests)}
            className="bg-white/5 text-slate-400 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-all border border-white/5"
          >
            <Icons.Download className="w-4 h-4" />
            تصدير الكل (Excel)
          </button>
          <Link
            href="/system/lab/sieve-analysis?view=add"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            إضافة فحص جديد
          </Link>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-[#1a1f2e]/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-3xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto no-scrollbar">
          <table className="w-full text-right border-separate border-spacing-y-2 px-6">
            <thead className="sticky top-0 bg-[#0d1117] z-10">
              <tr className="text-sm font-bold font-black text-slate-500 uppercase h-12">
                <th className="px-4 text-center w-16">#</th>
                <th className="px-4">الرقم المختبري</th>
                <th className="px-4">تاريخ الفحص</th>
                <th className="px-4">المادة</th>
                <th className="px-4">المجهز / المصدر</th>
                <th className="px-4 text-center">FM</th>
                <th className="px-4 text-center">الحالة</th>
                <th className="px-4 text-center w-32">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="pb-6">
              {tests.map((test, i) => (
                <tr
                  key={test.id}
                  className="group transition-all hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 text-center text-sm font-bold font-mono text-slate-700 bg-white/[0.02] rounded-r-2xl western-nums">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 text-white font-black text-sm western-nums">
                    {test.labNo}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-bold text-sm western-nums">
                    {new Date(test.testDate).toLocaleDateString("ar-u-nu-latn")}
                  </td>
                  <td className="px-4 py-3 text-sky-400 font-black text-sm">
                    {test.material?.name || "رمل"}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm truncate max-w-[200px]">
                    {test.supplier} <br />{" "}
                    <span className="text-[9px] text-slate-600">
                      {test.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-black western-nums text-indigo-400">
                    {test.finenessModulus || "0.00"}
                  </td>
                  <td className="px-4 py-3 text-center bg-white/[0.01]">
                    {test.status === "APPROVED" ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold font-black border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        معتمد
                      </div>
                    ) : test.status === "REJECTED" ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-sm font-bold font-black border border-rose-500/20">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        مرفوض
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-bold font-black border border-amber-500/20">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        قيد التدقيق
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center bg-white/[0.02] rounded-l-2xl">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/system/lab/sieve-analysis?view=add&id=${test.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="عرض التفاصيل"
                      >
                        <Icons.Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setIsPrintModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                        title="طباعة"
                      >
                        <Icons.Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          exportSieveAnalysisToPDF({ analysisData: test })
                        }
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                        title="تصدير PDF"
                      >
                        <Icons.FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportSingleSieveToExcel(test)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                        title="تصدير Excel"
                      >
                        <Icons.Excel className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(test.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="حذف"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {tests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Icons.Inbox className="w-12 h-12 text-slate-400" />
                      <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                        لا توجد سجلات حالياً
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedTest && (
        <SievePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          data={selectedTest}
        />
      )}

      <ConfirmationDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف تحليل منخلي"
        description="هل أنت متأكد من حذف هذا التحليل النهائي؟ سيتم مسح كافة البيانات المرتبطة به ولا يمكن استعادتها."
        variant="danger"
        confirmText="نعم، حذف البيانات"
        cancelText="تراجع"
      />

      <style jsx global>{`
        .western-nums {
          font-family: "Inter", system-ui, sans-serif !important;
          direction: ltr !important;
        }
      `}</style>
    </div>
  );
}
