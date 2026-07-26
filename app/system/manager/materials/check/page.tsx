import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import MaterialCalculator from "../../dashboard/components/MaterialCalculator";

export default async function ManagerMaterialCheckPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-white">
        {"حاسبة كفاية المواد"}
      </h1>

      {/* Reusing the isolated calculator component */}
      <MaterialCalculator lang={lang} />
    </div>
  );
}
