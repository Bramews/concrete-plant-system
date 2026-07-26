import { getCubeReportData } from "@/app/actions/lab-reports";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { notFound } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";

interface Props {
  params: { id: string };
}

export default async function CubeReportPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }
  const result = await getCubeReportData(numericId);

  if (!result.success || !result.data) {
    notFound();
  }

  const { test, config } = result.data;

  // Helper for safe display
  const d = (val: any) => val || "---";

  // Mock standard gained strengths for chart (OPC standard curve)
  const strength3 = test.mpa ? Number((test.mpa * 0.45).toFixed(1)) : 0;
  const strength7 = test.mpa ? Number((test.mpa * 0.7).toFixed(1)) : 0;
  const strength28 = test.mpa ? Number(test.mpa.toFixed(1)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:p-0 print:bg-white overflow-y-auto">
      {/* Print Button (Hidden on Print) */}
      <div className="max-w-[800px] mx-auto mb-6 flex justify-end gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
        >
          <Icons.Printer className="w-4 h-4" />
          طباعة التقرير / PDF
        </button>
      </div>

      {/* The Report Document (A4 Feel) */}
      <div
        className="max-w-[800px] mx-auto bg-white shadow-2xl border border-slate-200 p-[1.5cm] print:shadow-none print:border-none print:p-0 relative font-serif text-slate-900"
        dir="rtl"
      >
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-8 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              {config?.companyNameAr || "شركة الخرسانة المركزية"}
            </h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {config?.companyNameEn || "PREMIUM CONCRETE CORE"}
            </p>
            <div className="text-sm font-bold text-slate-500 mt-2 font-sans space-y-0.5">
              <p>الموقع: {config?.address || "المنطقة الصناعية"}</p>
              <p>
                الهاتف: <BidiText>{config?.phone || "000-000-000"}</BidiText>
              </p>
              <p>البريد الإلكتروني: {config?.email || "info@concrete.iq"}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 bg-slate-50 border-2 border-slate-950 flex items-center justify-center overflow-hidden">
              {config?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Icons.Activity className="w-8 h-8 text-slate-900" />
              )}
            </div>
            <div className="text-[9px] font-black uppercase text-center text-slate-500 tracking-[0.2em] leading-none">
              شهادة جودة المختبر
              <br />
              QUALITY CERTIFICATE
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center mb-10">
          <div className="inline-block px-8 py-2 border-2 border-slate-950 rounded-none relative">
            <h2 className="text-xl font-black text-slate-900 uppercase">
              {config?.reportTitleAr || "تقرير فحص قوة الانضغاط للمكعبات"}
            </h2>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
              ASTM C39 / BS EN 12390-3
            </div>
          </div>
        </div>

        {/* Project Info Table */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-12">
          {[
            { label: "المشروع:", value: d(test.order?.project?.name) },
            { label: "العميل:", value: d(test.order?.customer?.name) },
            { label: "كود الخلطة:", value: d(test.order?.mixDesign?.code) },
            {
              label: "صنف المقاومة:",
              value: d(test.order?.mixDesign?.strengthClass),
            },
            {
              label: "تاريخ الصب:",
              value: (
                <BidiText>
                  {format(new Date(test.sampleDate), "yyyy-MM-dd")}
                </BidiText>
              ),
            },
            {
              label: "رقم الطلب:",
              value: <BidiText>{test.order?.orderNumber}</BidiText>,
            },
            {
              label: "عمر العينة:",
              value: (
                <span>
                  <BidiText>{test.age}</BidiText> يوم
                </span>
              ),
            },
            {
              label: "تاريخ الفحص:",
              value: (
                <BidiText>
                  {format(
                    new Date(test.updatedAt || test.createdAt),
                    "yyyy-MM-dd",
                  )}
                </BidiText>
              ),
            },
          ].map((row, i) => (
            <div
              key={i}
              className="flex gap-4 items-baseline border-b border-slate-200 pb-1 h-8"
            >
              <span className="font-bold text-slate-500 w-24 shrink-0 text-sm">
                {row.label}
              </span>
              <span className="text-slate-900 font-extrabold truncate">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Result Highlight */}
        <div className="bg-slate-950 p-8 rounded-none mb-12 flex justify-between items-center relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1.5 h-full bg-indigo-600" />

          <div className="space-y-1">
            <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
              متوسط مقاومة الضغط الفعلي (Average Compressive Strength)
            </p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-5xl font-black text-white">
                <BidiText>{test.mpa?.toFixed(1)}</BidiText>
              </h3>
              <span className="text-xl font-bold text-slate-400 italic">
                MPa
              </span>
            </div>
          </div>

          <div className="text-left">
            <div
              className={`px-10 py-4 rounded-none border-2 text-2xl font-black tracking-tighter ${
                test.result === "PASS"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-rose-500 text-rose-400 bg-rose-500/5"
              }`}
            >
              {test.result === "PASS" ? "مقبول (PASS)" : "مرفوض (FAIL)"}
            </div>
          </div>
        </div>

        {/* Technical Readings Table */}
        <div className="mb-12">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">
            بيانات الفحص التقني للمكعبات (Test Specimen Readings)
          </h4>
          <div className="w-full border-2 border-slate-950 text-slate-900">
            <div className="grid grid-cols-4 bg-slate-100 border-b-2 border-slate-950 text-sm font-black uppercase text-center py-3">
              <div>عمر الكسر</div>
              <div>الحمل الأقصى (kN)</div>
              <div>المساحة (mm²)</div>
              <div>المقاومة الناتجة (MPa)</div>
            </div>
            <div className="grid grid-cols-4 text-center py-4 font-bold text-slate-900 text-sm">
              <div>
                <BidiText>{test.age}</BidiText> يوم
              </div>
              <div>
                <BidiText>{d(test.kn)}</BidiText>
              </div>
              <div>
                <BidiText>{22500}</BidiText>
              </div>
              <div className="font-extrabold">
                <BidiText>{d(test.mpa)}</BidiText>
              </div>
            </div>
          </div>
        </div>

        {/* Strength Development Curve SVG Chart */}
        <div className="mb-12 border-2 border-slate-950 p-6 bg-slate-50 relative">
          <h4 className="text-sm font-bold text-slate-900 mb-4">
            منحنى تطور المقاومة مقارنة بالمعيار (Strength Gain Curve)
          </h4>
          <div className="w-full h-40 flex items-end justify-between relative px-8 pt-4">
            {/* Grid Lines */}
            <div className="absolute inset-x-8 top-4 bottom-0 border-b border-slate-200 flex flex-col justify-between">
              <div className="w-full border-t border-dashed border-slate-200" />
              <div className="w-full border-t border-dashed border-slate-200" />
              <div className="w-full border-t border-dashed border-slate-200" />
            </div>

            {/* Simulated Gain Bars */}
            <div className="flex flex-col items-center z-10 w-16">
              <div
                className="w-8 bg-slate-400 transition-all"
                style={{ height: `${(strength3 / strength28) * 100}px` }}
              />
              <span className="text-[10px] text-slate-500 mt-2">
                ٣ أيام (<BidiText>{strength3}</BidiText>)
              </span>
            </div>
            <div className="flex flex-col items-center z-10 w-16">
              <div
                className="w-8 bg-slate-500 transition-all"
                style={{ height: `${(strength7 / strength28) * 100}px` }}
              />
              <span className="text-[10px] text-slate-500 mt-2">
                ٧ أيام (<BidiText>{strength7}</BidiText>)
              </span>
            </div>
            <div className="flex flex-col items-center z-10 w-16">
              <div
                className="w-8 bg-indigo-600 transition-all animate-pulse"
                style={{ height: "100px" }}
              />
              <span className="text-[10px] text-indigo-600 font-extrabold mt-2">
                ٢٨ يوم (<BidiText>{strength28}</BidiText>)
              </span>
            </div>
          </div>
        </div>

        {/* Verification and Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-12 items-end">
          {/* QR Code Verification */}
          <div className="flex flex-col items-center space-y-2 border border-slate-200 p-3 bg-slate-50">
            <div className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center">
              {/* SVG mock QR Code */}
              <svg
                className="w-full h-full text-slate-900"
                viewBox="0 0 100 100"
              >
                <rect
                  x="10"
                  y="10"
                  width="20"
                  height="20"
                  fill="currentColor"
                />
                <rect
                  x="70"
                  y="10"
                  width="20"
                  height="20"
                  fill="currentColor"
                />
                <rect
                  x="10"
                  y="70"
                  width="20"
                  height="20"
                  fill="currentColor"
                />
                <rect
                  x="40"
                  y="40"
                  width="20"
                  height="20"
                  fill="currentColor"
                />
                <rect
                  x="70"
                  y="70"
                  width="10"
                  height="10"
                  fill="currentColor"
                />
                <rect
                  x="80"
                  y="80"
                  width="10"
                  height="10"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">
              رمز التحقق الفوري
              <br />
              QR VERIFICATION
            </span>
          </div>

          {/* Lab tech signature */}
          <div className="text-center space-y-6">
            <div className="h-px bg-slate-300 w-full" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-900">
                مهندس الفحص والمختبر
              </p>
              <p className="text-[10px] text-slate-500 italic">
                مُعتمد الكترونياً
              </p>
            </div>
          </div>

          {/* Official Stamp */}
          <div className="text-center flex flex-col items-center justify-center space-y-2 relative">
            {/* Stamp Circle */}
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-indigo-600/30 flex flex-col items-center justify-center text-indigo-600/40 rotate-12 absolute -top-8 bg-white/50 backdrop-blur-[1px]">
              <span className="text-[8px] font-bold">مختبر الجودة الرسمي</span>
              <span className="text-[10px] font-black uppercase">APPROVED</span>
              <span className="text-[8px] font-mono">
                <BidiText>{id}</BidiText>
              </span>
            </div>
            <div className="h-px bg-slate-300 w-full z-10" />
            <div className="space-y-1 z-10">
              <p className="font-bold text-sm text-slate-900">
                ختم الاعتماد الرسمي
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                LABORATORY SEAL
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-6">
          <span>نظام إدارة محطة الخرسانة الموحد v3.0</span>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            <BidiText>{format(new Date(), "yyyy-MM-dd HH:mm")}</BidiText>
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            QR-ID: <BidiText>{id.substring(0, 8).toUpperCase()}</BidiText>
          </span>
        </div>
      </div>
    </div>
  );
}
