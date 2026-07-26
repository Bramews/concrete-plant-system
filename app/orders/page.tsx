import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import { getCurrentRole } from "@/lib/auth";
import OrderCabinet from "./OrderCabinet";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang] as any;
  const role = await getCurrentRole();

  let orders: any[] = [];
  let auditLogs: any[] = [];
  try {
    const rawOrders = await prisma.order.findMany({
      take: 50, // PERFORMANCE: Enforce limit
      include: {
        customer: true,
        project: true,
        mixDesign: true,
        labApproval: true,
      },
      orderBy: { date: "desc" },
    });

    orders = rawOrders.map((o) => ({
      ...o,
      originalQuantity: o.volume,
    }));

    auditLogs = await prisma.auditLog.findMany({
      where: { entity: "Order" },
      take: 10,
      orderBy: { timestamp: "desc" },
      include: { user: true },
    });
  } catch (e) {
    console.error("Orders/Logs fetch error:", e);
  }

  return (
    <main className="min-h-screen p-6 md:p-8 space-y-8 animate-fade-in bg-transparent">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200 tracking-tight">
            {t.order.title}
          </h2>
          <div className="h-[2px] w-24 bg-gradient-to-r from-primary to-transparent rounded-full mt-2"></div>
        </div>

        {(role === "SALES" ||
          role === "DEPARTMENT_MANAGER" ||
          role === "COMPANY_ADMIN") && (
          <Link href="/orders/new">
            <button className="neon-pink-active px-6 py-2 rounded-xl font-bold text-sm transition-transform hover:scale-105">
              {t.order?.new || "New Order"}
            </button>
          </Link>
        )}
      </div>

      <OrderCabinet
        orders={orders}
        auditLogs={auditLogs}
        lang={lang}
        translations={t}
        role={role || ""}
      />
    </main>
  );
}
