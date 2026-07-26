"use server";

import { getApprovedLabResults } from "@/app/actions/lab";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { ReportsClient } from "./ReportsClient";

export default async function LabReportsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  const data = await getApprovedLabResults();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {lang === "ar" ? "مركز التقارير المختبرية" : "Lab Reports Center"}
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
            {lang === "ar"
              ? "إصدار وإدارة شهادات الفحص المعتمدة"
              : "Generate & Manage Approved Test Certificates"}
          </p>
        </div>
      </div>

      <ReportsClient initialData={data} dict={dict.lab} lang={lang} />
    </div>
  );
}
