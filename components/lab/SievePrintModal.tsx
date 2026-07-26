"use client";

import { Icons } from "@/components/ui/Icons";

interface SievePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  branding?: any;
}

export default function SievePrintModal({
  isOpen,
  onClose,
  data,
  branding,
}: SievePrintModalProps) {
  if (!isOpen) return null;

  const results = data.results || [];

  // Calculate global status
  const isPassed =
    results.length > 0 &&
    results.every((r: any) => {
      if (r.minLimit === undefined || r.minLimit === null) return true;
      return r.status === "PASS";
    });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 print:p-0 print:bg-white overflow-y-auto no-scrollbar">
      {/* Floating Exit Button */}
      <button
        onClick={onClose}
        title="إغلاق"
        aria-label="Close"
        className="fixed top-8 right-8 w-14 h-14 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:scale-110 active:scale-95 transition-all z-[110] print:hidden"
      >
        <Icons.X className="w-8 h-8" />
      </button>

      <div className="bg-white w-full max-w-[900px] min-h-[1150px] shadow-2xl rounded-[40px] p-12 flex flex-col print:shadow-none print:rounded-none relative my-8">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 print:hidden">
          <div className="flex flex-col text-right">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Icons.Printer className="w-8 h-8 text-indigo-600" />
              معاينة التقرير الفني النهائي
            </h2>
            <p className="text-sm font-bold text-slate-400 mt-1">
              يرجى مراجعة كافة البيانات قبل تأكيد عملية الطباعة
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              title="تأكيد وطباعة التقرير"
              aria-label="Print Report"
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg shadow-indigo-200"
            >
              <Icons.Printer className="w-5 h-5" />
              تأكيد واستخراج
            </button>
          </div>
        </div>

        {/* Certificate Header */}
        <div className="flex justify-between items-start mb-10 text-right">
          <div>
            <h1 className="text-2xl font-black text-indigo-900 mb-1">
              {branding?.systemName || "الشركة النموذجية للخرسانة"}
            </h1>
            <p className="text-sm font-bold font-black text-slate-500 mb-4 uppercase tracking-widest">
              نظام مختبرات الخرسانة المطور
            </p>
            <div className="space-y-1 text-sm font-bold text-slate-700">
              <p>قسم الفحوصات المختبرية</p>
              <p>شهادة فحص التدرج المنخبي</p>
            </div>
          </div>
          <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden border">
            {branding?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Icons.Layers className="w-12 h-12 text-slate-300" />
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-right border-t border-b py-6 bg-slate-50/50 rounded-xl px-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-sm uppercase">
              كود التقرير:
            </span>
            <span className="font-black text-slate-900 font-mono tracking-tighter">
              {data.labNo || data.id || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-sm">
              نوع المادة:
            </span>
            <span className="font-black text-slate-900">
              {data.material?.name || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-sm">
              تاريخ الفحص:
            </span>
            <span className="font-black text-slate-900">
              {data.testDate || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-sm">المشروع:</span>
            <span className="font-black text-slate-900">
              {data.projectName || data.fieldNo || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-sm">المصدر:</span>
            <span className="font-black text-slate-900">
              {data.source || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-sm">المورد:</span>
            <span className="font-black text-slate-900">
              {data.supplier || "-"}
            </span>
          </div>
        </div>

        {/* Technical Data Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "الوزن الرطب", value: `${data.totalWeight || 0} g` },
            { label: "معامل النعومة", value: data.finenessModulus },
            { label: "نسبة الأطيان", value: `${data.clayContent || 0}%` },
            { label: "نسبة الرطوبة", value: `${data.moistureContent || 0}%` },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border rounded-2xl p-4 text-center"
            >
              <p className="text-sm font-bold font-black text-slate-400 mb-1 uppercase leading-none">
                {item.label}
              </p>
              <p className="text-base font-black text-slate-900 western-nums">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Results Table */}
        <div className="border rounded-2xl overflow-hidden mb-10">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-900 text-white text-sm font-bold font-black uppercase">
                <th className="p-3 text-center">#</th>
                <th className="p-3">مقاس المنخل</th>
                <th className="p-3">المحجوز (g)</th>
                <th className="p-3">% المحتجز</th>
                <th className="p-3 text-center">% المار</th>
                <th className="p-3 text-center">المواصفة (Pass)</th>
                <th className="p-3 text-center">التقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm font-bold text-slate-700">
              {results.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="p-3 text-center text-slate-400 font-mono">
                    {i + 1}
                  </td>
                  <td className="p-3 font-black text-slate-900 western-nums">
                    {r.size === 0 ? "Pan" : r.size}
                  </td>
                  <td className="p-3 western-nums">
                    {Number(r.retained || 0).toFixed(1)}
                  </td>
                  <td className="p-3 western-nums">
                    {Number(r.percentRetained || 0).toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-black text-slate-900 western-nums">
                    {Number(r.passing || 0).toFixed(1)}%
                  </td>
                  <td className="p-3 text-center text-slate-500 western-nums">
                    {r.minLimit !== undefined
                      ? `${r.minLimit}-${r.maxLimit}`
                      : "-"}
                  </td>
                  <td className="p-3 text-center">
                    {r.status && r.minLimit !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded-md text-sm font-bold ${r.status === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {r.status === "PASS" ? "مطابق" : "خارج"}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conclusion Table Foot */}
        <div className="flex justify-between items-center p-6 bg-slate-900 rounded-3xl mb-12">
          <div className="text-white">
            <span className="text-sm font-bold font-black text-slate-500 block mb-1 uppercase tracking-widest">
              Technical Performance Result
            </span>
            <div className="flex items-center gap-3">
              <div
                className={`px-6 py-2 rounded-xl text-sm font-black ${isPassed ? "bg-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)]" : "bg-rose-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)]"}`}
              >
                {isPassed
                  ? "مطابق للمواصفات الفنية"
                  : "غير مطابق للمواصفات الفنية"}
              </div>
              <span className="text-slate-400 font-mono text-sm font-bold uppercase">
                Index FM: {data.finenessModulus}
              </span>
            </div>
          </div>
          <div className="p-2 bg-white rounded-xl">
            <Icons.QrCode className="w-12 h-12 text-slate-900" />
          </div>
        </div>

        {/* Footer / Signatures */}
        <div className="mt-auto grid grid-cols-2 gap-20 text-center text-sm font-black pt-12 border-t">
          <div className="space-y-4">
            <p className="text-slate-400">مهندس المختبر</p>
            <div className="h-10 border-b-2 border-slate-100 italic font-medium text-slate-300">
              توقيع المعتمد
            </div>
            <p className="text-slate-900">
              م. {data.inspectorName || "أحمد علي"}
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-slate-400">مدير الجودة</p>
            <div className="h-10 border-b-2 border-slate-100 italic font-medium text-slate-300">
              الختم والتوقيع
            </div>
            <p className="text-slate-900">م. علي الرمادي</p>
          </div>
        </div>

        <div className="text-center mt-12 text-[8px] text-slate-300 font-bold uppercase tracking-widest">
          تم الإنشاء بواسطة نظام إدارة المصانع المركزية - وحدة المختبر -{" "}
          {new Date().getFullYear()}
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .western-nums { font-family: 'Inter', sans-serif !important; direction: ltr !important; }
      `,
        }}
      />
    </div>
  );
}
