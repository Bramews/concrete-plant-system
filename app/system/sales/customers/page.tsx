import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import {
  CreateCustomerButton,
  CustomerActionsMenu,
} from "./CustomerClientComponents";
import Link from "next/link";

export default async function SalesCustomersPage() {
  await requireRole([
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
  ]);

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const companyId = user?.companyId || 1;

  // Query customers with their orders and order counts
  const customers = await prisma.customer.findMany({
    where: { companyId, deletedAt: null },
    include: {
      _count: { select: { orders: { where: { deletedAt: null } } } },
      orders: {
        where: { deletedAt: null },
        select: { projectId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCustomers = customers.length;
  const totalOrders = customers.reduce((acc, c) => acc + c._count.orders, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-1">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-card/30 border border-white/5 p-10 shadow-2xl backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              {isRtl ? "إدارة الزبائن" : "Customers Management"}
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              {isRtl
                ? `${totalCustomers} زبون مسجل • ${totalOrders} طلب إجمالي`
                : `${totalCustomers} registered customers • ${totalOrders} total orders`}
            </p>
          </div>
          <div>
            <CreateCustomerButton isRtl={isRtl} />
          </div>
        </div>
      </div>

      {/* ─── Customers Grid ─── */}
      {customers.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-16 text-center backdrop-blur-sm">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-4 text-slate-700"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="text-slate-400 font-bold">
            {isRtl ? "لا يوجد زبائن مسجلين بعد" : "No customers registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => {
            // Calculate unique projects from customer orders
            const uniqueProjectIds = new Set(
              customer.orders.map((o) => o.projectId).filter(Boolean),
            );
            const projectCount = uniqueProjectIds.size;
            const ordersCount = customer._count.orders;

            // Simple VIP status: premium if they have more than 5 orders
            const isVip = ordersCount >= 5;
            const initial = customer.name.charAt(0).toUpperCase();

            return (
              <div
                key={customer.id}
                className="group relative overflow-hidden rounded-[2rem] bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-7 transition-all duration-500 text-right"
                dir="rtl"
              >
                {/* Hover gradient glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <Link
                  href={`/system/sales/customers/${customer.id}`}
                  className="absolute inset-0 z-0"
                />

                <div className="relative z-10 pointer-events-none">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg pointer-events-auto">
                      {initial}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isVip
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {isVip
                        ? isRtl
                          ? "زبون VIP"
                          : "VIP Customer"
                        : isRtl
                          ? "نشط"
                          : "Active"}
                    </span>
                    <div className="mr-auto ml-2 pointer-events-auto relative z-20">
                      <CustomerActionsMenu customer={customer} isRtl={isRtl} />
                    </div>
                  </div>

                  {/* Customer Info */}
                  <h3 className="text-lg font-black text-white mb-2 truncate">
                    {customer.name}
                  </h3>

                  <div className="space-y-1.5 mb-5 text-xs text-slate-400 font-bold">
                    {customer.phone && (
                      <p className="flex items-center gap-1.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-500"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span dir="ltr">{customer.phone}</span>
                      </p>
                    )}
                    {customer.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-500"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>{customer.email}</span>
                      </p>
                    )}
                    {customer.address && (
                      <p className="flex items-center gap-1.5 truncate">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-500"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{customer.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-indigo-400"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-bold text-slate-300">
                        {ordersCount}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {isRtl ? "طلب" : "orders"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-teal-400"
                      >
                        <rect
                          x="2"
                          y="7"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span className="font-bold text-slate-300">
                        {projectCount}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {isRtl ? "مشروع" : "projects"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
