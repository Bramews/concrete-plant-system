"use client";

import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";

interface AggregateReportFormProps {
  data: any;
  branding?: any;
  lang?: string;
  isPrintMode?: boolean;
}

export default function AggregateReportForm({
  data,
  branding,
  lang = "ar",
  isPrintMode = false,
}: AggregateReportFormProps) {
  const isRtl = lang === "ar";

  // Metadata extraction from readings JSON
  const readings =
    typeof data.readings === "string"
      ? JSON.parse(data.readings)
      : data.readings || {};

  const metadata = readings.metadata || {};

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
      id="aggregate-test-report-print"
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
            {data.method?.name || "تقرير فحص الركام"}
          </h2>
        </div>
        <div className="text-left rtl:text-right border-r-2 rtl:border-r-0 rtl:border-l-2 border-slate-100 px-4">
          <p className="text-[8px] font-black text-slate-400 uppercase leading-none">
            Report No.
          </p>
          <p className="text-lg font-black text-indigo-600">
            #{metadata.labNo || data.id}
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-[11px] border border-slate-100 p-4 rounded-2xl bg-slate-50/30">
        {[
          {
            label: isRtl ? "اسم المشروع" : "Project Name",
            value: d(metadata.projectName),
          },
          {
            label: isRtl ? "موقع العمل" : "Work Location",
            value: d(metadata.location),
          },
          {
            label: isRtl ? "مصدر العينة" : "Sample Source",
            value: d(metadata.source),
          },
          {
            label: isRtl ? "اسم المجهز" : "Supplier",
            value: d(metadata.supplier),
          },
          {
            label: isRtl ? "المادة المختبرة" : "Material",
            value: d(data.material?.name),
          },
          {
            label: isRtl ? "تاريخ الفحص" : "Date Tested",
            value: d(metadata.testDate || data.createdAt),
          },
          {
            label: isRtl ? "الفاحص" : "Inspected By",
            value: d(metadata.inspectorName),
          },
          {
            label: isRtl ? "رمز العينة" : "Sample ID",
            value: d(metadata.fieldNo),
          },
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

      {/* Main Result Display */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 bg-slate-50 rounded-[3rem] border border-slate-100 mb-8 px-6">
        <div className="text-center space-y-6">
          <span className="text-sm font-bold font-black uppercase text-slate-400 tracking-[0.4em] mb-4 block">
            Test Result Summary
          </span>

          <div className="flex items-center justify-center gap-4">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100">
              <Icons.Scale className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-500 uppercase leading-none">
                {data.method?.name}
              </p>
              <h3 className="text-6xl font-black text-slate-900 western-nums mt-1">
                {data.value}
                <span className="text-xl text-slate-400 mr-2">
                  {data.method?.unit}
                </span>
              </h3>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/50 max-w-sm mx-auto">
            <div
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-black text-sm font-bold uppercase ${data.result === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
            >
              {data.result === "PASS" ? (
                <>
                  <Icons.CheckCircle className="w-4 h-4" />{" "}
                  {isRtl ? "مطابق للمواصفات" : "Pass"}
                </>
              ) : (
                <>
                  <Icons.X className="w-4 h-4" />{" "}
                  {isRtl ? "خارج حدود المواصفات" : "Fail"}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Table (Summary) */}
      {readings && (
        <div className="mb-8">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
            {isRtl
              ? "البيانات المقاسة والمدخلات"
              : "Calculated Data & Readings"}
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {Object.keys(readings)
              .filter((k) => k !== "metadata" && readings[k])
              .map((key, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center"
                >
                  <span className="text-[7px] font-black text-slate-400 uppercase mb-1">
                    {key}
                  </span>
                  <span className="text-sm font-bold font-black text-slate-900 western-nums">
                    {readings[key]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Remarks Section */}
      <div className="mt-4 p-6 border border-slate-100 bg-slate-50/50 rounded-3xl">
        <p className="text-[11px] font-black text-indigo-900 mb-2 leading-none uppercase">
          {isRtl ? "تقييم العينة والملاحظات:" : "Sample Evaluation & Remarks:"}
        </p>
        <p className="text-[11px] text-slate-600 font-bold italic leading-relaxed">
          {data.notes ||
            (data.result === "PASS"
              ? isRtl
                ? "العيئة مطابقة للمواصفات الفنية المعتمدة."
                : "Sample complies with standard specifications."
              : isRtl
                ? "العينة خارج حدود المواصفات المعتمدة."
                : "Sample failed standard specifications.")}
        </p>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-12 mt-10 pt-10 border-t font-sans">
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">
            {isRtl ? "فني الفحوصات المختبرية" : "Lab Technician"}
          </p>
          <div className="italic text-indigo-400/50 font-script text-xl opacity-40 mb-1">
            {metadata.inspectorName || "Inspector"}
          </div>
          <p className="text-sm font-bold font-black text-slate-900 uppercase underline decoration-indigo-600 underline-offset-4">
            {metadata.inspectorName || "---"}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">
            {isRtl ? "مدير المختبر المختص" : "Authorized Lab Manager"}
          </p>
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600/10 flex items-center justify-center relative">
            <Icons.CheckCircle className="w-6 h-6 text-indigo-600/20" />
          </div>
          <p className="text-sm font-bold font-black text-slate-900 uppercase mt-2">
            {isRtl ? "وحدة السيطرة النوعية" : "Quality Control Unit"}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8 text-[8px] text-slate-300 font-bold text-center uppercase tracking-[0.3em]">
        Digital Laboratory Record • Sovereign LIMS v3.0 • Automated Reporting
        System
      </div>
    </div>
  );
}
