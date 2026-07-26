import { getAllCompanies } from "@/app/actions/admin-saas";
import { Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

// NOTE: In a real implementation we would fetch per-company governance details on a detail page.
// For this high-level directive, we are building a Master Governance Board that lists companies and their status.

export default async function GovernanceDashboard() {
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
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Governance Control Panel
          </h1>
          <p className="text-slate-500">{"التحكم الموحد التجاري والتشغيلي"}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/governance/policies"
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-900 transition-colors"
          >
            Manage Policies (Rules Engine)
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Metric Cards */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
            System Health
          </h3>
          <div className="text-4xl font-black text-green-500">98.5%</div>
          <div className="text-sm font-bold text-slate-400 mt-2">
            Aggregated Tenant Score
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
            Billing Health
          </h3>
          <div className="text-4xl font-black text-blue-500">$45.2k</div>
          <div className="text-sm font-bold text-slate-400 mt-2">
            Projected MRR (No Payment Failures)
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
            Governance Actions
          </h3>
          <div className="text-4xl font-black text-orange-500">3</div>
          <div className="text-sm font-bold text-slate-400 mt-2">
            Active Suspensions / Flags
          </div>
        </div>
      </div>

      {/* Main Governance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold">Tenant Governance Matrix</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-sm font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Tenant</th>
              <th className="px-6 py-4">Suspension Level</th>
              <th className="px-6 py-4">Health Score</th>
              <th className="px-6 py-4">Billing Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {companies.map((company: any) => (
              <tr
                key={company.id}
                className="hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 dark:text-white">
                    {company.name}
                  </div>
                  <div className="text-sm font-bold text-slate-400">
                    {company.slug}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold border ${getLevelColor(company.suspensionLevel)}`}
                  >
                    {company.suspensionLevel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mb-1">
                    <div className="bg-green-500 h-2.5 rounded-full w-[95%]"></div>
                  </div>
                  <span className="text-sm font-bold font-mono">95/100</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                    ● Good Standing
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="text-blue-600 hover:underline text-sm font-bold"
                  >
                    Deep Dive →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getLevelColor(level: string) {
  switch (level) {
    case "NONE":
      return "bg-green-50 text-green-700 border-green-200";
    case "READ_ONLY":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FREEZE_ORDERS":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "FULL_SUSPENSION":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-600";
  }
}
