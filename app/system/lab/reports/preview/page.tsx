import { Metadata } from "next";
import { getReportConfig } from "@/app/actions/lab-reports";
import { LabReportHeader } from "@/components/reports/LabReportHeader";

export const metadata: Metadata = {
  title: "Report Preview",
};

export default async function ReportPreviewPage() {
  const COMPANY_ID = 1;
  const { data: config } = await getReportConfig(COMPANY_ID);

  if (!config) {
    return <div>No configuration found. Please save settings first.</div>;
  }

  // Mock Data for Preview
  const mockTest = {
    testDate: new Date(),
    reportNo: "QC-2024-0042",
    client: "Al-Amal Skyscrapers Ltd.",
    project: "Baghdad Mall Extension",
    sampleId: "S-5521",
    material: "Concrete C35",
    results: [
      { test: "Slump", value: "120 mm", spec: "100 ± 20 mm", status: "PASS" },
      { test: "Temp", value: "28°C", spec: "Max 32°C", status: "PASS" },
      {
        test: "Air Content",
        value: "2.1%",
        spec: "1.5 - 4.5%",
        status: "PASS",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex justify-center">
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-0 mx-auto print:shadow-none print:w-full">
        {/* Header */}
        <LabReportHeader
          config={config}
          reportDate={mockTest.testDate}
          reportNo={mockTest.reportNo}
        />

        {/* Content Body */}
        <div className="px-12 py-8 space-y-8 font-serif text-slate-800">
          {/* Project Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm border p-4 rounded-sm border-slate-200">
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Client
              </span>
              <span className="font-bold">{mockTest.client}</span>
            </div>
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Project
              </span>
              <span className="font-bold">{mockTest.project}</span>
            </div>
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Sample ID
              </span>
              <span className="font-bold font-mono">{mockTest.sampleId}</span>
            </div>
            <div>
              <span className="block text-sm font-bold uppercase font-bold text-slate-400">
                Material
              </span>
              <span className="font-bold">{mockTest.material}</span>
            </div>
          </div>

          {/* Results Table */}
          <div>
            <h3 className="text-lg font-bold border-b-2 border-slate-800 mb-4 pb-1 uppercase tracking-wider">
              Test Results
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-black uppercase">
                    Test Name
                  </th>
                  <th className="text-center py-3 px-4 font-black uppercase">
                    Result
                  </th>
                  <th className="text-center py-3 px-4 font-black uppercase">
                    Spec
                  </th>
                  <th className="text-center py-3 px-4 font-black uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockTest.results.map((r, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 font-bold">{r.test}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {r.value}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 italic">
                      {r.spec}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded textxs font-bold border border-emerald-200">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer / Notes */}
          <div className="pt-12">
            <h4 className="font-bold text-sm uppercase text-slate-400 mb-2">
              Remarks
            </h4>
            <p className="text-sm italic text-slate-600 p-4 bg-slate-50 border-l-4 border-slate-300">
              All tests were performed in accordance with ASTM/IQS standards.
              Samples were cured under standard conditions.
            </p>
          </div>

          {/* Signatures */}
          {config.showSignature && (
            <div className="pt-24 flex justify-between px-12">
              <div className="text-center space-y-2">
                <div className="h-0.5 w-48 bg-slate-900 mb-2"></div>
                <p className="font-bold uppercase text-sm font-bold tracking-wider">
                  Lab Technician
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="h-0.5 w-48 bg-slate-900 mb-2"></div>
                <p className="font-bold uppercase text-sm font-bold tracking-wider">
                  {config.signatureText || "Lab Manager"}
                </p>
              </div>
            </div>
          )}

          {/* Footer Text */}
          {config.footerText && (
            <div className="pt-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest mt-auto">
              {config.footerText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
