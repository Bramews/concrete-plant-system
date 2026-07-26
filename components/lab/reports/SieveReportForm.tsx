"use client";

import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import SieveChart from "../SieveChart";

interface SieveReportFormProps {
  data: any;
  branding?: any;
  lang?: string;
}

export default function SieveReportForm({
  data,
  branding,
  lang = "ar",
}: SieveReportFormProps) {
  const isRtl = lang === "ar";

  const results = Array.isArray(data.results)
    ? data.results
    : typeof data.results === "string"
      ? JSON.parse(data.results)
      : [];

  const readings =
    typeof data.readings === "string"
      ? JSON.parse(data.readings)
      : data.readings || {};

  const tableData = results
    .map((r: any) => ({
      ...r,
      retainedWeight: readings[r.size] ?? readings[r.size.toString()] ?? 0,
    }))
    .sort((a: any, b: any) => parseFloat(b.size) - parseFloat(a.size));

  const isPassed = tableData.every((r: any) => {
    if (r.minLimit === undefined || r.minLimit === null) return true;
    return r.status === "PASS" || r.status === "PASSED";
  });

  const d = (val: any) => {
    if (val instanceof Date) return format(val, "dd/MM/yyyy");
    if (typeof val === "string" && val.includes("-")) {
      try {
        return format(new Date(val), "dd/MM/yyyy");
      } catch (e) {
        return val;
      }
    }
    return val || "---";
  };

  return (
    <div
      className={`report-page bg-white p-8 sm:p-12 max-w-[900px] mx-auto shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col font-sans western-nums ${isRtl ? "rtl text-right" : "ltr text-left"}`}
      id="sieve-analysis-report-print"
    >
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .report-page {
            width: 101% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            height: 275mm !important;
          }
        }
        .western-nums {
          font-variant-numeric: tabular-nums;
        }
        .font-script {
          font-family: "Brush Script MT", cursive;
        }
      `}</style>

      {/* Header with Branding */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase">
            {branding?.companyNameAr || "الشركة النموذجية للخرسانة"}
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">
            {branding?.companyNameEn || "PREMIUM CONCRETE UNIT"}
          </p>
          <div className="text-[9px] text-slate-400 mt-3 space-y-0.5 font-bold">
            <p>{branding?.address || "الموقع: العراق - البصرة"}</p>
            <p>{branding?.phone || "هاتف: 0770 000 0000"}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-100">
            {branding?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Icons.Lab className="w-10 h-10 text-indigo-400" />
            )}
          </div>
          <span className="text-[8px] font-black uppercase text-slate-300 mt-2 tracking-tighter">
            Quality Control Dept.
          </span>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest mb-1">
            {isRtl ? "شهادة فحص مخبرية" : "LABORATORY TEST CERTIFICATE"}
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase">
            {isRtl ? "تقرير التحليل المنخلي" : "Sieve Analysis Report"}
          </h2>
        </div>
        <div className="text-left rtl:text-right border-r-2 rtl:border-r-0 rtl:border-l-2 border-slate-100 px-4">
          <p className="text-[8px] font-black text-slate-400 uppercase leading-none">
            Report No.
          </p>
          <p className="text-lg font-black text-indigo-600">
            #{data.labNo || data.id}
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-[11px] border border-slate-100 p-4 rounded-2xl bg-slate-50/30">
        {[
          {
            label: isRtl ? "اسم المشروع" : "Project Name",
            value: d(data.projectName),
          },
          {
            label: isRtl ? "موقع العمل" : "Work Location",
            value: d(data.location),
          },
          {
            label: isRtl ? "مصدر العينة" : "Sample Source",
            value: d(data.source),
          },
          { label: isRtl ? "اسم المجهز" : "Supplier", value: d(data.supplier) },
          {
            label: isRtl ? "المادة المختبرة" : "Material",
            value: d(data.material?.name || data.testType),
          },
          {
            label: isRtl ? "تاريخ الفحص" : "Date Tested",
            value: d(data.testDate),
          },
          {
            label: isRtl ? "الفاحص" : "Inspected By",
            value: d(data.inspectorName),
          },
          { label: isRtl ? "رمز العينة" : "Sample ID", value: d(data.fieldNo) },
        ].map((item, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-white pb-1"
          >
            <span className="text-slate-400 font-bold uppercase text-[8px]">
              {item.label}
            </span>
            <span className="text-slate-900 font-black truncate max-w-[150px]">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Results Table & Chart Container */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="col-span-12 lg:col-span-5 h-full">
          <table className="w-full border-2 border-slate-900 text-sm font-bold">
            <thead className="bg-slate-900 text-white font-black uppercase">
              <tr>
                <th className="p-2 text-right">{isRtl ? "المنخل" : "Sieve"}</th>
                <th className="p-2 text-center">
                  % {isRtl ? "المار" : "Pass"}
                </th>
                <th className="p-2 text-center">
                  {isRtl ? "المواصفة" : "Spec"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {tableData.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-2 font-black border-l-4 border-l-slate-900 bg-slate-50 text-[11px]">
                    {row.displaySize ||
                      (row.size === "0" || row.size === 0 ? "Pan" : row.size)}
                  </td>
                  <td
                    className={`p-2 text-center text-[12px] font-black ${row.status === "FAIL" ? "text-rose-600 bg-rose-50" : ""}`}
                  >
                    {Number(row.passing || 0).toFixed(1)}
                  </td>
                  <td className="p-2 text-center text-slate-400 text-[9px]">
                    {row.minLimit !== undefined
                      ? `${row.minLimit}-${row.maxLimit}`
                      : "---"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <div className="flex justify-between p-3 bg-slate-900 text-white rounded-xl items-center">
              <span className="text-[8px] font-black uppercase text-slate-400">
                {isRtl ? "معامل النعومة" : "Fineness Modulus"}
              </span>
              <span className="text-lg font-black">
                {data.finenessModulus?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl items-center">
              <span className="text-[8px] font-black uppercase text-slate-400">
                {isRtl ? "نسبة الرطوبة" : "Moisture %"}
              </span>
              <span className="text-sm font-bold font-black text-slate-800 western-nums">
                {(Number(data.moistureContent) || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl items-center">
              <span className="text-[8px] font-black uppercase text-slate-400">
                {isRtl ? "نسبة الأطيان" : "Clay Content %"}
              </span>
              <span className="text-sm font-bold font-black text-slate-800 western-nums">
                {(Number(data.clayContent) || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 h-full flex flex-col">
          <div className="flex-1 min-h-[300px] border-2 border-slate-100 rounded-3xl p-4 bg-white relative overflow-hidden">
            <SieveChart data={tableData} isPrintMode={true} />
          </div>
          <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/30 rounded-2xl">
            <p className="text-[11px] font-black text-indigo-900 mb-1 leading-none uppercase">
              {isRtl
                ? "تقييم العينة والملاحظات:"
                : "Sample Evaluation & Remarks:"}
            </p>
            <p className="text-sm font-bold text-slate-600 font-bold italic leading-relaxed">
              {data.remarks ||
                (isPassed
                  ? isRtl
                    ? "العيئة مطابقة للمواصفات الفنية المعتمدة."
                    : "Sample complies with standard specifications."
                  : isRtl
                    ? "العينة خارج حدود المواصفات المعتمدة."
                    : "Sample failed standard specifications.")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mt-6 pt-6 border-t font-sans">
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">
            {isRtl ? "فني الفحوصات المختبرية" : "Lab Technician"}
          </p>
          <div className="italic text-indigo-400/50 font-script text-xl opacity-40 mb-1">
            {data.inspectorName || "Inspector"}
          </div>
          <p className="text-sm font-bold font-black text-slate-900 uppercase underline decoration-indigo-600 underline-offset-4">
            {data.inspectorName || "---"}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">
            {isRtl ? "مدير المختبر المختص" : "Authorized Lab Manager"}
          </p>
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600/10 flex items-center justify-center relative">
            <Icons.CheckCircle className="w-6 h-6 text-indigo-600/20" />
            <div className="absolute inset-0 flex items-center justify-center rotate-45 text-[4px] text-indigo-600/10 font-black uppercase">
              Official Seal
            </div>
          </div>
          <p className="text-sm font-bold font-black text-slate-900 uppercase mt-2">
            {isRtl ? "وحدة السيطرة النوعية" : "Quality Control Unit"}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 text-[8px] text-slate-300 font-bold text-center uppercase tracking-[0.3em]">
        Digital Laboratory Record • Sovereign LIMS v3.0 • Verified At{" "}
        {format(new Date(), "yyyy-MM-dd")}
      </div>
    </div>
  );
}
