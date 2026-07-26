import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { addDomain, deleteDomain, verifyDomain } from "@/app/actions/domains";
import { Icons } from "@/components/ui/Icons";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export default async function DomainsPage() {
  await requireRole(["SYSTEM_OWNER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  const domains = await prisma.domain.findMany({
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const companies = await prisma.company.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            {dict.dashboard.domains.title}
          </h1>
          <p className="text-slate-400">
            {dict.dashboard.domains.no_custom_domains}
          </p>
        </div>
      </div>

      {/* Add New Domain Form */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icons.Plus className="w-5 h-5 text-emerald-400" />
          {dict.dashboard.kpi.new_tenant}
        </h2>
        <form
          action={async (formData) => {
            "use server";
            const companyId = parseInt(formData.get("companyId") as string);
            const domain = formData.get("domain") as string;
            await addDomain(companyId, domain);
          }}
          className="flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-slate-400">
              {dict.dashboard.table.company}
            </label>
            <select
              name="companyId"
              required
              title={dict.dashboard.table.company}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">-- {dict.dashboard.sections.view_all} --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-slate-400">
              {dict.dashboard.table.domain}
            </label>
            <input
              name="domain"
              type="text"
              placeholder={
                dict.dashboard.domains.placeholder || "مثال: app.mycompany.com"
              }
              required
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
          >
            {dict.dashboard.command_center.execute_btn}
          </button>
        </form>
      </div>

      {/* Domains List */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-start text-sm">
          <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4 text-start">{dict.dashboard.table.domain}</th>
              <th className="p-4 text-start">{dict.dashboard.table.company}</th>
              <th className="p-4 text-start">{dict.dashboard.table.status}</th>
              <th className="p-4 text-start uppercase">
                {dict.dashboard.domains.verification}
              </th>
              <th className="p-4 text-end">
                {dict.admin.backup.table.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {domains.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {dict.dashboard.domains.no_custom_domains}
                </td>
              </tr>
            ) : (
              domains.map((domain) => (
                <tr
                  key={domain.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-mono text-slate-200">
                    {domain.domain}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-white">
                      {domain.company.name}
                    </div>
                    <div className="text-sm font-bold text-slate-500">
                      {domain.company.slug}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-bold font-medium ${
                        domain.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {domain.status === "ACTIVE"
                        ? dict.dashboard.domains.status_active
                        : dict.dashboard.domains.status_pending}
                    </span>
                  </td>
                  <td className="p-4">
                    {domain.verified ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Icons.CheckCircle className="w-4 h-4" />
                        <span>{dict.dashboard.domains.verified_label}</span>
                      </div>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await verifyDomain(domain.id);
                        }}
                      >
                        <button className="text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full transition-colors border border-blue-500/20">
                          {dict.dashboard.domains.verify_btn}
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="p-4 text-end">
                    <form
                      action={async () => {
                        "use server";
                        await deleteDomain(domain.id);
                      }}
                      className="inline-block"
                    >
                      <button
                        title={dict.admin.backup.table.actions}
                        className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
