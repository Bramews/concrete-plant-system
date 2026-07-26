import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

import { redirect } from "next/navigation";

export default async function DeliveryTicketsPage() {
  try {
    await requireRole([
      "OPERATOR",
      "MANAGER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "SYSTEM_OWNER",
    ]);
  } catch (e) {
    redirect("/api/auth/session-cleanup");
  }

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }
  const companyId = user.companyId as number;

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  const tickets = await prisma.deliveryTicket.findMany({
    where: {
      order: {
        companyId,
      },
    },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
      batch: { select: { quantity: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{dict.ticket.title}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={dict.ticket.search_placeholder}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-all">
            {dict.ticket.filter}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-4 px-2 text-slate-400 font-medium text-sm">
                {dict.ticket.id}
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm">
                {dict.common.order_no}
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm">
                {dict.ticket.truck}
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm">
                {dict.common.qty} ({dict.common.m3_label})
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm">
                {dict.ticket.cumulative}
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm">
                {dict.ticket.time}
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm text-right">
                {dict.common.status}
              </th>
              <th className="py-4 px-2 text-slate-400 font-medium text-sm text-center">
                البصمة الرقمية (QR)
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-2 font-mono text-sm">
                  {ticket.ticketNumber}
                </td>
                <td className="py-4 px-2 text-sm">
                  <span className="font-bold">{ticket.order.orderNumber}</span>
                  <div className="text-sm font-bold text-slate-500">
                    {ticket.order.customer?.name}
                  </div>
                </td>
                <td className="py-4 px-2 font-bold">{ticket.truckNumber}</td>
                <td className="py-4 px-2">
                  {(ticket as any).batch?.quantity?.toFixed(1) ||
                    ticket.cumulativeQuantity}
                </td>
                <td className="py-4 px-2 text-sm font-bold text-slate-400">
                  {ticket.cumulativeQuantity} / {ticket.order.volume}
                </td>
                <td className="py-4 px-2 text-sm">
                  {format(ticket.createdAt, "HH:mm")}
                </td>
                <td className="py-4 px-2 text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      ticket.status === "DISPATCHED"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {ticket.status === "DISPATCHED"
                      ? dict.ticket.dispatched
                      : ticket.status}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  {ticket.deliveryHash ? (
                    <a
                      href={`/verify/${ticket.deliveryHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    >
                      <img
                        src={
                          ticket.qrCode ||
                          `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`/verify/${ticket.deliveryHash}`)}`
                        }
                        alt="QR"
                        className="w-5 h-5 rounded"
                      />
                      فحص الـ QR
                    </a>
                  ) : (
                    <span className="text-slate-600 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-500 italic"
                >
                  {"لا توجد تذاكر صادرة بعد"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
