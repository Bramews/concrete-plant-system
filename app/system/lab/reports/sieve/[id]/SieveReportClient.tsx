"use client";

import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import SieveChart from "@/components/lab/SieveChart";
import { useRouter } from "next/navigation";
import SieveReportForm from "@/components/lab/reports/SieveReportForm";

interface SieveReportClientProps {
  analysis: any;
  dict: any;
  lang: string;
  config: any;
}

export function SieveReportClient({
  analysis,
  dict,
  lang,
  config,
}: SieveReportClientProps) {
  const isRtl = lang === "ar";
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 print:p-0 print:bg-white transition-all duration-500 overflow-y-auto">
      {/* Logical Action Bar */}
      <div className="max-w-[900px] mx-auto mb-10 flex flex-wrap justify-between items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all active:scale-90 shadow-sm"
            title={isRtl ? "رجوع" : "Back"}
          >
            <Icons.ArrowRight
              className={`w-6 h-6 ${isRtl ? "" : "rotate-180"}`}
            />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">
              {isRtl ? "المعاينة النهائية" : "Final Preview"}
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">
              {isRtl ? "جاهز للطباعة والارشفة" : "Ready for Print & Archive"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all active:scale-95 group"
          >
            <Icons.Printer className="w-5 h-5 group-hover:animate-bounce" />
            {isRtl ? "طباعة التقرير" : "Print Report"}
          </button>
        </div>
      </div>

      {/* The Report Document */}
      <SieveReportForm data={analysis} branding={config} lang={lang} />
    </div>
  );
}
