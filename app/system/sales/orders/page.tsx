import { prisma } from "@/lib/prisma";
import { submitOrderToLab } from "@/app/actions/order";
import { requireRole, getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { SalesTabs } from "@/components/sales/SalesTabs";
import SalesOrdersListClient from "@/components/sales/SalesOrdersListClient";
import fs from "fs";
import path from "path";

export default async function SalesOrdersPage() {
  await requireRole(["SALES", "SALES_REP", "SALES_MANAGER", "COMPANY_ADMIN"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const currentUser = await getCurrentUser();
  const role = currentUser?.role || "SALES_MANAGER";

  // Read approved prices list
  let approvedPrices: Record<string, number> = {
    C20: 65000,
    C25: 68000,
    C30: 72000,
    C40: 80000,
  };
  try {
    const pricesPath = path.join(process.cwd(), "data", "approved-prices.json");
    const data = fs.readFileSync(pricesPath, "utf-8");
    approvedPrices = JSON.parse(data);
  } catch (err) {
    console.error("Failed to read approved-prices.json, using defaults:", err);
  }

  // Query orders with customers and projects with tenant isolation
  const whereClause: any = {};
  if (role !== "SYSTEM_OWNER" && currentUser?.companyId) {
    whereClause.companyId = currentUser.companyId;
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      project: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // KPI stats
  const totalOrders = orders.length;
  const draftOrders = orders.filter((o) => o.status === "DRAFT").length;
  const approvedOrders = orders.filter(
    (o) => o.status === "APPROVED" || o.status === "LAB_APPROVED",
  ).length;
  const totalVolume = orders.reduce((acc, o) => acc + (o.volume || 0), 0);
  const deliveredVolume = orders.reduce(
    (acc, o) => acc + (o.actualQuantity || 0),
    0,
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <SalesTabs>
      <div className="high-density space-y-4 animate-in fade-in duration-700 p-1">
        {/* ━━━ Hero Header Section ━━━ */}
        <div className="relative overflow-hidden rounded-2xl bg-card/30 border border-white/5 p-5 md:p-6 shadow-2xl backdrop-blur-3xl panel-dense">
          {/* Background glow effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-1">
                {dict.orders?.title ||
                  (isRtl ? "إدارة الطلبات" : "Orders Management")}
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                {dict.orders?.subtitle ||
                  (isRtl
                    ? "تخطيط الإنتاج و تتبع التسليم"
                    : "Production planning & delivery tracking")}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/system/sales/orders/create"
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>
                  {dict.orders?.new_order || (isRtl ? "طلب جديد" : "New Order")}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ━━━ KPI Grid ━━━ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-dense">
          {/* Total Orders */}
          <div className="group relative overflow-hidden rounded-xl bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-4 md:p-5 transition-all duration-500 card-dense">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-900/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                  {isRtl ? "الإجمالي" : "Total"}
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {totalOrders}
                </h3>
                <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {isRtl ? "إجمالي الطلبات" : "Total Orders"}
                </p>
              </div>
            </div>
          </div>

          {/* Draft Orders */}
          <div className="group relative overflow-hidden rounded-xl bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-4 md:p-5 transition-all duration-500 card-dense">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-900/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                {draftOrders > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {isRtl ? "بانتظار الإرسال" : "Pending"}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {draftOrders}
                </h3>
                <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {isRtl ? "مسودات الطلبات" : "Draft Orders"}
                </p>
              </div>
            </div>
          </div>

          {/* Approved / In-Progress */}
          <div className="group relative overflow-hidden rounded-xl bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-4 md:p-5 transition-all duration-500 card-dense">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-900/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                {approvedOrders > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {approvedOrders} {isRtl ? "معتمدة" : "Active"}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {approvedOrders}
                </h3>
                <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {isRtl ? "طلبات معتمدة" : "Approved Orders"}
                </p>
              </div>
            </div>
          </div>

          {/* Total Volume */}
          <div className="group relative overflow-hidden rounded-xl bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-4 md:p-5 transition-all duration-500 card-dense">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-900/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                  {deliveredVolume.toLocaleString()}{" "}
                  {isRtl ? "مسلّم" : "delivered"}
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {totalVolume.toLocaleString()}
                  <span className="text-sm font-bold text-slate-500 ms-1">
                    {dict.common.m3_label}
                  </span>
                </h3>
                <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {isRtl ? "إجمالي الحجم المطلوب" : "Total Requested Volume"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ Main Content Grid ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 gap-dense">
          {/* ── Orders Table (2/3 width) ── */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm overflow-hidden panel-dense">
            {/* Table Header */}
            <div className="flex justify-between items-center p-5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white mb-0.5">
                  {isRtl ? "جميع الطلبات" : "All Orders"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? `${totalOrders} طلب • ${draftOrders} بانتظار الإرسال`
                    : `${totalOrders} orders • ${draftOrders} pending submission`}
                </p>
              </div>
              <Link
                href="/system/sales/orders/create"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {dict.orders?.new_order || (isRtl ? "طلب جديد" : "New Order")}
              </Link>
            </div>

            <div className="p-5 pt-0">
              <SalesOrdersListClient
                initialOrders={orders}
                userRole={role}
                approvedPrices={approvedPrices}
                isRtl={isRtl}
                dict={dict}
              />
            </div>
          </div>

          {/* ── Recent Activity Sidebar (1/3) ── */}
          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-5 backdrop-blur-sm flex flex-col panel-dense">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {isRtl ? "آخر الطلبات" : "Recent Orders"}
              </h3>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-400"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <div className="flex-1 space-y-2">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/system/orders/details/${order.id}`}
                    className="flex p-3 rounded-xl bg-black/20 border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer"
                  >
                    <div
                      className={`w-1 rounded-full ${
                        order.status === "APPROVED" ||
                        order.status === "COMPLETED" ||
                        order.status === "DELIVERED"
                          ? "bg-emerald-500"
                          : order.status === "IN_PROGRESS" ||
                              order.status === "DISPATCHED"
                            ? "bg-blue-500"
                            : order.status === "REJECTED" ||
                                order.status === "CANCELLED"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                      } ${isRtl ? "ms-3" : "me-3"} flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="font-bold text-white text-xs truncate">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            order.status === "APPROVED" ||
                            order.status === "COMPLETED" ||
                            order.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {dict.common.status_labels[
                            order.status as keyof typeof dict.common.status_labels
                          ] || order.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 truncate mb-0.5">
                        {order.customer?.name || dict.common.na} •{" "}
                        {order.project?.name || "—"}
                      </p>
                      <div className="text-[10px] font-bold text-slate-500">
                        {order.volume} {dict.common.m3_label}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-slate-500">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="mb-1 opacity-20"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  </svg>
                  <p className="text-xs font-bold">
                    {isRtl ? "لا توجد طلبات حديثة" : "No recent orders"}
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/system/sales/orders/create"
              className="w-full mt-4 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {dict.orders?.new_order ||
                (isRtl ? "إنشاء طلب جديد" : "Create New Order")}
            </Link>
          </div>
        </div>

        {/* ━━━ Info Notice ━━━ */}
        <div className="rounded-xl bg-indigo-500/[0.06] border border-indigo-500/15 px-4 py-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="text-xs font-medium text-indigo-300/80">
            {dict.sales?.immutable_notice ||
              (isRtl
                ? "الطلبات المعتمدة لا يمكن تعديلها لضمان سلامة البيانات"
                : "Approved orders cannot be modified to ensure data integrity")}
          </p>
        </div>
      </div>
    </SalesTabs>
  );
}
