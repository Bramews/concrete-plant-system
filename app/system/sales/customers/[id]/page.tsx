import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  Plus,
} from "lucide-react";
import { CustomerActionsMenu } from "../CustomerClientComponents";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole([
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
  ]);

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";
  const companyId = user?.companyId || 1;

  const customerId = parseInt(id);
  if (isNaN(customerId)) return notFound();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId, companyId, deletedAt: null },
    include: {
      orders: {
        where: { deletedAt: null },
        include: {
          project: true,
          mixDesign: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          orders: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!customer) return notFound();

  const projectCount = await prisma.project.count({
    where: {
      companyId,
      deletedAt: null,
      orders: { some: { customerId, deletedAt: null } },
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-1 max-w-7xl mx-auto">
      {/* ─── Breadcrumbs & Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/system/sales/customers"
            className="p-2 rounded-xl bg-card hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {isRtl ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white">{customer.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {isRtl ? "الملف الشخصي والتفاصيل" : "Customer Profile & Details"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CustomerActionsMenu customer={customer} isRtl={isRtl} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Sidebar Info ─── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Card */}
          <div className="bg-card/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              {isRtl ? "معلومات الاتصال" : "Contact Info"}
            </h2>

            <div className="space-y-4 text-sm font-medium">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs mb-0.5">
                    {isRtl ? "رقم الهاتف" : "Phone"}
                  </p>
                  <p className="text-white" dir="ltr">
                    {customer.phone || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-slate-500 text-xs mb-0.5">
                    {isRtl ? "البريد الإلكتروني" : "Email"}
                  </p>
                  <p className="text-white truncate">{customer.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs mb-0.5">
                    {isRtl ? "العنوان" : "Address"}
                  </p>
                  <p className="text-white leading-relaxed">
                    {customer.address || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/10 rounded-3xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-6">
              {isRtl ? "ملخص النشاط" : "Activity Summary"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs font-bold mb-1">
                  {isRtl ? "إجمالي الطلبات" : "Total Orders"}
                </p>
                <p className="text-3xl font-black text-white">
                  {customer._count.orders}
                </p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs font-bold mb-1">
                  {isRtl ? "المشاريع" : "Projects"}
                </p>
                <p className="text-3xl font-black text-white">{projectCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-card/20 border border-white/5 rounded-2xl p-3">
            <Link
              href={`/system/sales/orders/create?customerId=${customer.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl transition-colors font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              {isRtl ? "طلب جديد" : "New Order"}
            </Link>
            <Link
              href={`/system/sales/projects?customerId=${customer.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl transition-colors font-bold text-sm"
            >
              <Briefcase className="w-4 h-4" />
              {isRtl ? "المشاريع" : "Projects"}
            </Link>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-card border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {isRtl ? "آخر الطلبيات" : "Recent Orders"}
              </h2>
              <Link
                href={`/system/sales/orders?customerId=${customer.id}`}
                className="text-indigo-400 text-sm font-bold hover:underline"
              >
                {isRtl ? "عرض الكل" : "View All"}
              </Link>
            </div>

            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                {isRtl
                  ? "لا توجد طلبات مسجلة لهذا العميل"
                  : "No orders found for this customer."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left text-sm"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-bold">
                        {isRtl ? "رقم الطلب" : "Order #"}
                      </th>
                      <th className="px-6 py-4 font-bold">
                        {isRtl ? "المشروع" : "Project"}
                      </th>
                      <th className="px-6 py-4 font-bold">
                        {isRtl ? "التصميم (Mix)" : "Mix Design"}
                      </th>
                      <th className="px-6 py-4 font-bold">
                        {isRtl ? "الكمية" : "Quantity"}
                      </th>
                      <th className="px-6 py-4 font-bold">
                        {isRtl ? "الحالة" : "Status"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customer.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">
                          <Link
                            href={`/system/orders/details/${order.id}`}
                            className="text-indigo-400 hover:underline"
                          >
                            #{order.id.toString().padStart(4, "0")}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          {order.project?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {order.mixDesign?.name || "-"}
                        </td>
                        <td className="px-6 py-4 font-bold">
                          {order.volume}{" "}
                          <span className="text-slate-500 text-xs">m³</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
