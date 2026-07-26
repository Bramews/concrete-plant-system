import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function AdminBillingPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      company: true,
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const invoices = await prisma.invoice.findMany({
    take: 10,
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] min-h-screen text-slate-200">
      <h1 className="text-3xl font-black text-white tracking-tight">
        Billing Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subscriptions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-400">
            Active Subscriptions
          </h2>
          <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-400 uppercase text-sm font-bold">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {sub.company.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full text-sm font-bold">
                        {sub.plan.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-bold ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sub.currentPeriodEnd
                        ? format(sub.currentPeriodEnd, "MMM d, yyyy")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-400">Recent Invoices</h2>
          <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-400 uppercase text-sm font-bold">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {inv.company.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      ${inv.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{inv.status}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(inv.createdAt, "MMM d")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
