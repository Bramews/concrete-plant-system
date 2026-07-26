import {
  getAllCompanies,
  updateCompanyLicense,
} from "@/app/actions/admin-saas";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { redirect } from "next/navigation";

export default async function LicensesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  let companies: any[] = [];
  try {
    companies = await getAllCompanies();
  } catch (e: any) {
    if (e.message === "UNAUTHENTICATED" || e.message === "FORBIDDEN") {
      redirect("/api/auth/session-cleanup");
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {"إدارة التراخيص"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {"التحكم في الخطط، حدود المستخدمين، والميزات."}
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-700/50 uppercase text-sm font-bold text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4">{"الشركة"}</th>
              <th className="px-6 py-4">{"الخطة الحالية"}</th>
              <th className="px-6 py-4">{"حد المستخدمين"}</th>
              <th className="px-6 py-4">{"تحديث الترخيص"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {companies.map((company: any) => (
              <tr
                key={company.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {company.name}
                  </div>
                  <div className="text-sm font-bold text-gray-500">
                    {company.slug}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold ${
                      company.license?.type === "PREMIUM"
                        ? "bg-purple-100 text-purple-700"
                        : company.license?.type === "ENTERPRISE"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {company.license?.type || "TRIAL"}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono">
                  {company.license?.maxUsers || 5}
                </td>
                <td className="px-6 py-4">
                  <form
                    action={async (formData) => {
                      "use server";
                      const type = formData.get("type") as string;
                      const maxUsers = parseInt(
                        formData.get("maxUsers") as string,
                      );
                      await updateCompanyLicense(company.id, type, maxUsers);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <select
                      title="Plan Type"
                      name="type"
                      defaultValue={company.license?.type || "BASIC"}
                      className="form-select text-sm font-bold py-1 px-2 border rounded bg-white dark:bg-gray-800"
                    >
                      <option value="TRIAL">TRIAL</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>

                    <input
                      title="Max Users"
                      type="number"
                      name="maxUsers"
                      defaultValue={company.license?.maxUsers || 5}
                      className="w-16 text-sm font-bold py-1 px-2 border rounded bg-white dark:bg-gray-800"
                      min="1"
                    />

                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-3 py-1 rounded transition-colors">
                      {"حفظ"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
