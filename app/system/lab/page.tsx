import LabDashboard from "@/components/lab/LabDashboard";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { getLabDashboardStats } from "@/app/actions/lab";

export default async function LabPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const stats = await getLabDashboardStats();

  return (
    <LabDashboard dict={dict.lab} stats={stats as any} isRtl={lang === "ar"} />
  );
}
