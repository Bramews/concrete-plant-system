import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { Icons } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole(["SYSTEM_OWNER"]);

  // Fetch Stats
  const companiesCount = await prisma.company.count();
  const usersCount = await prisma.user.count();
  const activeLicenses = await prisma.license.count({
    where: { company: { status: "ACTIVE" } },
  });

  const recentCompanies = await prisma.company.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { license: true },
  });

  const stats = [
    {
      label: "Total Companies",
      value: companiesCount,
      icon: Icons.Factory,
      color: "text-blue-500",
    },
    {
      label: "Total Users",
      value: usersCount,
      icon: Icons.Users,
      color: "text-emerald-500",
    },
    {
      label: "Active Licenses",
      value: activeLicenses,
      icon: Icons.CreditCard,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8 animate-slow-fade">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white uppercase tracking-widest">
          System Overview
        </h1>
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Live Diagnostics
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-white/5 p-6 rounded-xl shadow-xl hover:border-white/10 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-white/5">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Icons.Activity className="w-4 h-4 text-primary" />
          Recent Registrations
        </h2>
        <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-start text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  Company
                </th>
                <th className="px-6 py-4 text-start text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  Domain
                </th>
                <th className="px-6 py-4 text-start text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  Plan
                </th>
                <th className="px-6 py-4 text-start text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-black text-white">
                    {company.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-400">
                    {company.slug}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase border border-primary/20">
                      {company.license?.type || "Basic"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600 uppercase">
                    {new Date(company.createdAt).toLocaleDateString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
