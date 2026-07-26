import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";

export default async function ManagerLogsPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">{"سجل النشاطات"}</h1>

      <div className="card glass-panel p-8 text-center text-gray-500">
        <p>{"سجل النشاطات للعرض فقط (قيد التطوير)"}</p>
      </div>
    </div>
  );
}
