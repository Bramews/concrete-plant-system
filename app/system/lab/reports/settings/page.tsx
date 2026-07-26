import { Metadata } from "next";
import { getReportConfig } from "@/app/actions/lab-reports";
import { ReportSettingsForm } from "@/components/lab/ReportSettingsForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Report Settings",
};

export default async function ReportSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/login");
  }
  const COMPANY_ID = user.companyId;

  const { data: config } = await getReportConfig(COMPANY_ID);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Report Configuration
          </h1>
          <p className="text-slate-500 mt-1">
            Customize branding, logos, and layout for official test
            certificates.
          </p>
        </div>
      </div>

      <ReportSettingsForm
        initialConfig={config || null}
        companyId={COMPANY_ID}
      />
    </div>
  );
}
