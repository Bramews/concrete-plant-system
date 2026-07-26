import { Metadata } from "next";
import { getTestCertificateData } from "@/app/actions/lab-reports";
import { LabReportHeader } from "@/components/reports/LabReportHeader";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/ui/IndustrialComponents";
import { Printer } from "lucide-react";

export const metadata: Metadata = {
  title: "Official Test Certificate",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificatePage(props: PageProps) {
  const params = await props.params;
  const { id } = params;
  const result = await getTestCertificateData(id);

  if (!result.success) {
    if (result.error === "Test not found") return notFound();
    return <div>Error loading certificate: {result.error}</div>;
  }

  const { test, config } = result.data as any;

  if (!config) {
    return (
      <div>Configuration missing. Please configure report settings first.</div>
    );
  }

  // Parse readings safely
  let readings: any = {};
  try {
    readings = test.readings ? JSON.parse(test.readings) : {};
  } catch (e) {
    readings = {};
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center gap-6">
      {/* Print Controls (Hidden in Print) */}
      <div className="w-[210mm] flex justify-end print:hidden">
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 font-bold">
          <Printer className="w-4 h-4" /> Print Certificate
        </button>
      </div>

      {/* Paper Sheet */}
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-0 mx-auto print:shadow-none print:w-full print:m-0 relative">
        {/* Header */}
        <LabReportHeader
          config={config}
          reportDate={test.createdAt}
          reportNo={test.id.substring(0, 8).toUpperCase()} // Simple ID for now
        />

        {/* Content Body */}
        <div className="px-12 py-8 space-y-8 font-serif text-slate-800">
          {/* Project Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm border p-4 rounded-sm border-slate-200">
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Client
              </span>
              <span className="font-bold">
                {test.order?.customer?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Project
              </span>
              <span className="font-bold">
                {test.order?.project?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Order No
              </span>
              <span className="font-bold font-mono">
                #{test.order?.orderNumber || test.orderId || "---"}
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Material / Mix
              </span>
              <span className="font-bold">
                {test.material?.name ||
                  test.order?.mixDesign?.name ||
                  "Unknown"}
              </span>
            </div>
          </div>

          {/* Test Definition */}
          <div className="bg-slate-50 p-4 border-l-4 border-slate-300">
            <h3 className="font-bold text-lg text-slate-900">
              {test.testMethod.name}
            </h3>
            <p className="text-sm text-slate-600 font-mono">
              {test.testMethod.labStandard.code} - {test.testMethod.code}
            </p>
          </div>

          {/* Results Section */}
          <div>
            <h3 className="text-lg font-bold border-b-2 border-slate-800 mb-4 pb-1 uppercase tracking-wider">
              Test Results
            </h3>

            <div className="space-y-6">
              {/* Main Value */}
              <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-lg">
                <span className="text-sm font-bold uppercase text-slate-500">
                  Measured Value
                </span>
                <span className="text-3xl font-black font-mono tracking-tight">
                  {test.value}{" "}
                  <span className="text-lg text-slate-400">
                    {test.testMethod.unit || ""}
                  </span>
                </span>
              </div>

              {/* Readings Details (if accessible) */}
              {Object.keys(readings).length > 0 && (
                <div className="text-sm text-slate-600">
                  <p className="font-bold text-sm uppercase mb-2 opacity-50">
                    Raw Data:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(readings).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between border-b py-1"
                      >
                        <span className="capitalize">{k}:</span>
                        <span className="font-mono font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Determination */}
              <div className="flex items-center justify-between pt-4">
                <span className="font-bold text-sm uppercase">
                  Compliance Status
                </span>
                <span
                  className={`
                        px-4 py-1 rounded border-2 font-black uppercase text-sm tracking-widest
                        ${test.result === "PASS" ? "border-emerald-600 text-emerald-700 bg-emerald-50" : ""}
                        ${test.result === "FAIL" ? "border-red-600 text-red-700 bg-red-50" : ""}
                        ${test.result === "WARNING" ? "border-amber-500 text-amber-700 bg-amber-50" : ""}
                    `}
                >
                  {test.result}
                </span>
              </div>
            </div>
          </div>

          {/* Footer / Notes */}
          <div className="pt-8">
            <h4 className="font-bold text-sm uppercase text-slate-400 mb-2">
              Remarks
            </h4>
            <div className="text-sm text-slate-600 p-4 bg-slate-50 border border-slate-200 min-h-[80px]">
              {test.notes || "No additional remarks."}
            </div>
          </div>

          {/* Signatures & QR */}
          <div className="pt-20 flex justify-between items-end px-4">
            {/* QR Code Placeholder */}
            {config.showQrCode && (
              <div className="text-center space-y-2">
                {/* Using a simple API for QR code for now, ensuring HTTPS */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${test.id}`}
                  alt="Verification QR"
                  className="w-24 h-24 mix-blend-multiply"
                />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Scan to Verify
                </p>
              </div>
            )}

            {config.showSignature && (
              <div className="flex gap-16">
                <div className="text-center space-y-2">
                  <div className="h-0.5 w-48 bg-slate-900 mb-2"></div>
                  <p className="font-bold uppercase text-sm font-bold tracking-wider">
                    Test Performed By
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {test.testedBy?.name || test.creatorName || "—"}
                  </p>
                </div>
                {(test.approvedBy || test.approverName) && (
                  <div className="text-center space-y-2">
                    <div className="h-0.5 w-48 bg-slate-900 mb-2"></div>
                    <p className="font-bold uppercase text-sm font-bold tracking-wider">
                      {config.signatureText || "Lab Manager"}
                    </p>
                    <p className="text-sm font-bold text-slate-500">
                      {test.approvedBy?.name || test.approverName}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Text */}
          {config.footerText && (
            <div className="pt-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest mt-auto">
              {config.footerText}
            </div>
          )}
        </div>
      </div>
      <PrintScript />
    </div>
  );
}

// Simple Client Component for Print Button logic
function PrintScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
            document.querySelector('button').addEventListener('click', () => window.print());
        `,
      }}
    />
  );
}
