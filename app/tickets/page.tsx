import { prisma } from "@/lib/prisma";
import { updateTicketStatus } from "@/app/actions/ticket";
import { generateInvoiceFromTicket } from "@/app/actions/invoice";
import { cookies } from "next/headers";
import { dictionary, Locale, DictionaryType } from "@/lib/dictionary";
import { getCurrentRole } from "@/lib/auth";
import { randomUUID } from "crypto";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { PremiumButton } from "@/components/ui/premium/PremiumButton";

export default async function TicketsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t: any = dictionary[lang];

  const role: string | null = await getCurrentRole();

  const tickets = await prisma.deliveryTicket.findMany({
    include: {
      order: { include: { customer: true, project: true } },
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Generate unique request IDs on server side
  const ticketRequestIds = new Map(
    tickets.map((ticket) => [
      ticket.id,
      {
        update: `tkt-${randomUUID()}`,
        invoice: `inv-${randomUUID()}`,
      },
    ]),
  );

  const canUpdateStatus =
    role === "OPERATOR" ||
    role === "DEPARTMENT_MANAGER" ||
    role === "COMPANY_ADMIN" ||
    role === "SYSTEM_OWNER";
  const canInvoice =
    role === "ACCOUNTANT" ||
    role === "DEPARTMENT_MANAGER" ||
    role === "COMPANY_ADMIN" ||
    role === "SYSTEM_OWNER";

  return (
    <main className="min-h-screen p-6 md:p-8 space-y-8 animate-fade-in bg-transparent">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 tracking-tight">
            {t.ticket?.title || "Delivery Management"}
          </h2>
          <div className="h-[2px] w-24 bg-gradient-to-r from-blue-500 to-transparent rounded-full mt-2"></div>
        </div>
      </div>

      <PremiumCard noPadding className="overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">
            {t.ticket?.recent || "Recent Delivery Tickets"}
          </h3>
          <PremiumBadge variant="secondary" size="sm">
            {tickets.length} {"تذكرة"}
          </PremiumBadge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="text-muted-foreground/50 border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-normal text-start">
                  {t.ticket?.id || "Ticket ID"}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.order?.id || "Order"}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.order?.customer || "Client"}
                </th>
                <th className="p-4 font-normal text-start">
                  {t.ticket?.truck || "Truck"}
                </th>
                <th className="p-4 font-normal text-center">
                  {t.common?.status || "Status"}
                </th>
                <th className="p-4 font-normal text-end">
                  {t.common?.actions || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tickets.map((ticket) => {
                const requestIds = ticketRequestIds.get(ticket.id)!;
                return (
                  <tr
                    key={ticket.id}
                    className="group hover:bg-white/5 transition-colors text-slate-300"
                  >
                    <td className="p-4 font-mono text-sm font-semibold text-blue-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="p-4 font-mono text-sm text-slate-400">
                      {ticket.order.orderNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {ticket.order?.customer?.name ?? "N/A"}
                        </span>
                        <span className="text-sm text-slate-400">
                          {ticket.order?.project?.name ?? "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <PremiumBadge
                        variant="outline"
                        size="xs"
                        className="border-blue-500/20 text-blue-300"
                      >
                        🚛 {ticket.truckNumber}
                      </PremiumBadge>
                    </td>
                    <td className="p-4 text-center">
                      <PremiumBadge
                        variant={
                          ticket.status === "DELIVERED"
                            ? "success"
                            : ticket.status === "DISPATCHED"
                              ? "secondary"
                              : ticket.status === "RETURNED"
                                ? "error"
                                : "outline"
                        }
                        size="xs"
                      >
                        {ticket.status}
                      </PremiumBadge>
                    </td>
                    <td className="p-4 text-end">
                      <div className="flex justify-end gap-2 items-center">
                        {ticket.status === "DISPATCHED" && canUpdateStatus && (
                          <form
                            action={async (formData) => {
                              "use server";
                              await updateTicketStatus(formData);
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="hidden"
                              name="requestId"
                              value={requestIds.update}
                            />
                            <input
                              type="hidden"
                              name="ticketId"
                              value={ticket.id}
                            />
                            <PremiumButton
                              name="status"
                              value="DELIVERED"
                              variant="primary"
                              className="!px-3 !py-1 !text-sm font-bold !rounded-lg bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                            >
                              {t.common?.delivered || "Delivered"}
                            </PremiumButton>
                            <PremiumButton
                              name="status"
                              value="RETURNED"
                              variant="danger"
                              className="!px-3 !py-1 !text-sm font-bold !rounded-lg"
                            >
                              {t.common?.returned || "Returned"}
                            </PremiumButton>
                          </form>
                        )}

                        {ticket.status === "DELIVERED" &&
                          !ticket.invoice &&
                          canInvoice && (
                            <form
                              action={async (formData: FormData) => {
                                "use server";
                                await generateInvoiceFromTicket(formData);
                              }}
                            >
                              <input
                                type="hidden"
                                name="ticketId"
                                value={ticket.id}
                              />
                              <input
                                type="hidden"
                                name="requestId"
                                value={requestIds.invoice}
                              />
                              <PremiumButton
                                type="submit"
                                variant="secondary"
                                className="!px-4 !py-1 !text-sm font-bold !rounded-lg bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                              >
                                {t.invoice?.generate || "Invoice"}
                              </PremiumButton>
                            </form>
                          )}

                        {ticket.invoice && (
                          <PremiumBadge
                            variant="success"
                            size="xs"
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          >
                            {"تمت الفوترة"}
                          </PremiumBadge>
                        )}

                        {!canUpdateStatus &&
                          !canInvoice &&
                          ticket.status === "DISPATCHED" && (
                            <span className="text-sm text-slate-500 italic">
                              Processing...
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <span className="text-4xl">🎟️</span>
                      <p className="text-sm italic">
                        {"لا يوجد تذاكر توريد منشأة حالياً"}
                      </p>
                    </div>
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
