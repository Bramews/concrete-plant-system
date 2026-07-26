import { Metadata } from "next";
import {
  getLabStandards,
  getLabPreferences,
  getTestMethods,
} from "@/app/actions/lab/standards";
import { LabStandardsManager } from "@/components/lab/LabStandardsManager";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Lab Standards Management",
};

export default async function LabStandardsPage() {
  const user = await getCurrentUser();
  const companyId = user?.companyId;

  if (!companyId) {
    return <div>الرجاء تسجيل الدخول لشركة.</div>;
  }

  // Fetch data in parallel
  const [standards, testMethods, preferences] = await Promise.all([
    getLabStandards(),
    getTestMethods(),
    getLabPreferences(companyId),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            إعدادات المواصفات
          </h1>
          <p className="text-slate-400 mt-1">
            حدد المواصفات الحاكمة للاختبارات المعملية الخاصة بك
          </p>
        </div>
      </div>

      <LabStandardsManager
        standards={standards}
        testMethods={testMethods}
        preferences={preferences}
      />
    </div>
  );
}
