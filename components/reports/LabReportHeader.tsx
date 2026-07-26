import React from "react";
import { format } from "date-fns";

interface ReportConfig {
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  reportTitleAr?: string;
  reportTitleEn?: string;
  themeColor?: string;
  showQrCode?: boolean;
}

interface LabReportHeaderProps {
  config: ReportConfig;
  reportDate?: Date;
  reportNo?: string;
}

export function LabReportHeader({
  config,
  reportDate = new Date(),
  reportNo,
}: LabReportHeaderProps) {
  const themeColor = config.themeColor || "#000000";

  return (
    <div className="w-full bg-white print:bg-white text-black font-sans">
      {/* Top Border with Theme Color */}
      <div
        style={{ height: "4px", backgroundColor: themeColor }}
        className="w-full mb-6 print:mb-4"
      ></div>

      <div className="flex items-start justify-between px-8 py-2 print:px-0">
        {/* Left: English Info */}
        <div className="flex-1 text-left space-y-1">
          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900 leading-tight">
            {config.companyNameEn || "Company Name"}
          </h2>
          <div className="text-sm font-bold text-slate-500 font-medium space-y-0.5">
            {config.address && <p>{config.address}</p>}
            {config.phone && <p>Tel: {config.phone}</p>}
            {config.email && <p>Email: {config.email}</p>}
            {config.website && <p>Web: {config.website}</p>}
          </div>
        </div>

        {/* Center: Logo */}
        <div className="mx-6 shrink-0 flex flex-col items-center justify-center">
          {config.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={config.logoUrl}
              alt="Company Logo"
              className="h-24 w-auto object-contain max-w-[150px]"
            />
          ) : (
            <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-400 font-bold border-2 border-dashed border-slate-200">
              NO LOGO
            </div>
          )}
        </div>

        {/* Right: Arabic Info */}
        <div className="flex-1 text-right space-y-1" dir="rtl">
          <h2 className="text-xl font-bold text-slate-900 leading-tight font-arabic">
            {config.companyNameAr || "اسم الشركة"}
          </h2>
          <div className="text-sm font-bold text-slate-500 font-medium space-y-0.5 font-arabic">
            {config.address && <p>{config.address}</p>}
            {config.phone && <p>هاتف: {config.phone}</p>}
            {config.email && <p>البريد: {config.email}</p>}
            {config.website && <p>موقع: {config.website}</p>}
          </div>
        </div>
      </div>

      {/* Report Title Banner */}
      <div className="mt-6 mb-8 text-center border-y-2 border-slate-100 py-3 bg-slate-50/50 print:bg-transparent print:border-y print:border-black">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex flex-col gap-1">
          <span>{config.reportTitleEn || "Laboratory Test Certificate"}</span>
          <span className="text-lg font-arabic font-bold text-slate-700">
            {config.reportTitleAr || "شهادة فحص مختبري"}
          </span>
        </h1>
      </div>

      {/* Meta Data Line */}
      <div className="flex justify-between border-b pb-2 mb-6 px-8 text-sm font-bold text-slate-600 print:px-0 print:text-black">
        <div>
          Report No:{" "}
          <span className="font-mono text-black">{reportNo || "---"}</span>
        </div>
        <div>
          Date:{" "}
          <span className="font-mono text-black">
            {format(reportDate, "dd/MM/yyyy")}
          </span>
        </div>
      </div>
    </div>
  );
}
