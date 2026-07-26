import { getManagerOrders } from "@/app/actions/manager";
import { cookies } from "next/headers";
import { Locale, dictionary } from "@/lib/dictionary";
import OrdersList from "../dashboard/components/OrdersList";
import OrderStats from "./OrdersStats";

export const dynamic = "force-dynamic";

export default async function ManagerOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  const page = Number(searchParams?.page) || 1;
  const status = searchParams?.status || "ALL";

  // Fetch via Action (Role check & Audit internal)
  const { orders, totalCount, stats } = await getManagerOrders(
    page,
    10,
    status,
  );
  const dict = dictionary[lang as "en" | "ar"]?.dashboard?.stats || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {lang === "ar" ? "سجل الأوردرات" : "Orders Log"}
        </h1>
        {/* Add Order Button can go here if agreed */}
      </div>

      <OrderStats stats={stats} dict={dict} />

      {/* Reusing the List Component - assuming it's generic enough or I will recreate a specific one */}
      <div className="card glass-panel p-0 bg-transparent border-0">
        <OrdersList
          orders={orders}
          lang={lang}
          totalCount={totalCount}
          currentPage={page}
          currentStatus={status}
        />
      </div>
    </div>
  );
}
