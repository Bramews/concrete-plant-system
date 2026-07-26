import { prisma } from "@/lib/prisma";
import { createBatch } from "@/app/actions/production";
import { cookies } from "next/headers";
import { dictionary, Locale, DictionaryType } from "@/lib/dictionary";
import { getCurrentRole } from "@/lib/auth";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { PremiumButton } from "@/components/ui/premium/PremiumButton";

export default async function ProductionPage() {
  const role = await getCurrentRole();
  const cookieStore = await cookies();

  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t: DictionaryType = dictionary[lang];

  const approvedOrders = await prisma.order.findMany({
    where: { status: "LAB_APPROVED" },
    include: { customer: true, project: true, mixDesign: true, batches: true },
    orderBy: { createdAt: "desc" },
  });

  const inProduction = await prisma.order.findMany({
    where: { status: "PRODUCTION" },
    include: { batches: true },
    orderBy: { createdAt: "desc" },
  });

  const isOperator =
    role === "OPERATOR" ||
    role === "DEPARTMENT_MANAGER" ||
    role === "COMPANY_ADMIN" ||
    role === "SYSTEM_OWNER";

  return (
    <main className="min-h-screen p-6 md:p-8 space-y-8 animate-fade-in bg-transparent">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200 tracking-tight">
            {t.prod?.title || "Production Dashboard"}
          </h2>
          <div className="h-[2px] w-24 bg-gradient-to-r from-emerald-500 to-transparent rounded-full mt-2"></div>
        </div>
      </div>

      {/* PENDING PRODUCTION */}
      <PremiumCard noPadding className="overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">
            {"الطلبيات الجاهزة للإنتاج"}
          </h3>
          <PremiumBadge variant="secondary" size="sm">
            {approvedOrders.length} {"معلق"}
          </PremiumBadge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="text-muted-foreground/50 border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-normal text-start">
                  {t.order?.id || "ID"}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.order?.mix || "Mix"}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.prod?.orderedQty || "Quantity Status"}
                </th>
                <th className="p-4 font-normal text-end">
                  {t.common?.actions || "Control"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {approvedOrders.map((order) => {
                const batchedQty = order.batches.reduce(
                  (sum: number, b: { quantity: number }) => sum + b.quantity,
                  0,
                );
                return (
                  <tr
                    key={order.id}
                    className="group hover:bg-white/5 transition-colors text-slate-300"
                  >
                    <td className="p-4 font-mono text-sm font-bold text-emerald-400">
                      {order.orderNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">
                          {order.mixDesign?.code || "---"}
                        </span>
                        <span className="text-sm font-bold opacity-50">
                          {order.customer?.name || "---"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between text-sm font-bold">
                          <span>{batchedQty} m³</span>
                          <span className="opacity-50">
                            / {order.volume} m³
                          </span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500"
                            style={{
                              width: `${Math.min((batchedQty / order.volume) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-end">
                      {isOperator ? (
                        <form
                          action={createBatch}
                          className="flex flex-col gap-3 max-w-md ml-auto rtl:mr-auto rtl:ml-0"
                        >
                          <input
                            type="hidden"
                            name="orderId"
                            value={order.id}
                          />
                          <input
                            type="hidden"
                            name="requestId"
                            value={`prod-${order.id}-${batchedQty}`}
                          />

                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1 group/input">
                              <label className="text-sm font-bold text-slate-500 px-1">
                                {t.prod?.batch || "Batch Size"}
                              </label>
                              <input
                                type="number"
                                name="quantity"
                                step="0.1"
                                placeholder="0.0 m³"
                                className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:border-emerald-500/50 outline-none w-24"
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-bold text-slate-500 px-1">
                                {t.ticket?.truck || "Truck #"}
                              </label>
                              <input
                                type="text"
                                name="truckNumber"
                                placeholder="TRK-000"
                                className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:border-emerald-500/50 outline-none w-24"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 items-end">
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-sm font-bold text-slate-500 px-1">
                                {t.ticket?.driver || "Driver Name"}
                              </label>
                              <input
                                type="text"
                                name="driverName"
                                placeholder="..."
                                className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:border-emerald-500/50 outline-none w-full"
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-bold text-slate-500 px-1">
                                Cubes
                              </label>
                              <input
                                type="number"
                                name="cubesCount"
                                placeholder="0"
                                title={"عدد المكعبات"}
                                className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:border-emerald-500/50 outline-none w-16"
                                defaultValue={3}
                                required
                              />
                            </div>
                            <PremiumButton
                              type="submit"
                              variant="secondary"
                              className="!px-4 !py-1.5 !text-sm font-bold bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                            >
                              {t.prod?.startBatch || "Start"}
                            </PremiumButton>
                          </div>
                        </form>
                      ) : (
                        <PremiumBadge variant="outline" size="sm">
                          Monitoring Only
                        </PremiumBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {approvedOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <span className="text-4xl">🏗️</span>
                      <p className="text-sm italic">
                        {t.lab?.empty || "No orders ready for production"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumCard>

      {/* ACTIVE PRODUCTION */}
      <PremiumCard noPadding className="border-emerald-500/10 bg-emerald-950/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-emerald-400">
            {t.prod?.filled || "Active Production"}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="text-muted-foreground/50 border-b border-white/5 opacity-50">
                <th className="p-4 font-normal text-start">
                  {t.order?.id || "Order"}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.prod?.batchedQty || "Progress"}
                </th>
                <th className="p-4 font-normal text-end">
                  {t.common?.status || "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inProduction.map((order) => {
                const batchedQty = order.batches.reduce(
                  (sum: number, b: { quantity: number }) => sum + b.quantity,
                  0,
                );
                return (
                  <tr key={order.id} className="text-slate-400">
                    <td className="p-4 font-mono text-sm font-bold">
                      {order.orderNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="min-w-[60px] text-sm font-bold text-white">
                          {batchedQty} / {order.volume}
                        </span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                          <div
                            className="h-full bg-emerald-500/50"
                            style={{
                              width: `${Math.min((batchedQty / order.volume) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-end">
                      <PremiumBadge
                        variant="success"
                        size="xs"
                        className="animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      >
                        {t.prod?.filled || "PRODUCING"}
                      </PremiumBadge>
                    </td>
                  </tr>
                );
              })}
              {inProduction.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center opacity-20 italic">
                    {"لا توجد طلبيات قيد الإنتاج حالياً"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </main>
  );
}
