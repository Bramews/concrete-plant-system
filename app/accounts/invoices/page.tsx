import { prisma } from "@/lib/prisma";
import { generateInvoiceFromTicket, markPaid } from "@/app/actions/invoice";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import { getCurrentRole } from "@/lib/auth";

export default async function InvoicesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];
  const role = await getCurrentRole();

  const pendingTickets = await prisma.deliveryTicket.findMany({
    where: {
      invoice: null,
      status: "DELIVERED",
    },
    include: { order: { include: { customer: true, mixDesign: true } } },
    orderBy: { createdAt: "desc" },
  });

  const invoices = await prisma.invoice.findMany({
    include: {
      ticket: { include: { order: { include: { customer: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="page-title">{t.invoice.title}</h1>

      {/* Pending Invoices */}
      <div
        className="glass-panel"
        style={{ padding: "1rem", marginBottom: "2rem" }}
      >
        <h3 style={{ marginBottom: "1rem", color: "#8b5cf6" }}>
          {t.invoice.pending}
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t.ticket.id}</th>
              <th>{t.order.customer}</th>
              <th>{t.order.mix}</th>
              <th>{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {pendingTickets.map((ticket) => {
              return (
                <tr key={ticket.id}>
                  <td>{ticket.ticketNumber}</td>
                  <td>{ticket.order?.customer?.name ?? "N/A"}</td>
                  <td>{ticket.order?.mixDesign?.code ?? "N/A"}</td>
                  <td>
                    {role === "ACCOUNTANT" || role === "MANAGER" ? (
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await generateInvoiceFromTicket(formData);
                        }}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="hidden"
                          name="ticketId"
                          value={ticket.id}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          {t.invoice.generate}
                        </button>
                      </form>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                        Accountant Only
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {pendingTickets.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "#94a3b8",
                  }}
                >
                  {t.invoice.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice History */}
      <div className="glass-panel" style={{ padding: "1rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#cbd5e1" }}>
          {t.invoice.history}
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t.invoice.id}</th>
              <th>{t.order.customer}</th>
              <th>{t.invoice.amount}</th>
              <th>{t.common.status}</th>
              <th>{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>INV-{inv.id}</td>
                <td>{inv.ticket?.order?.customer?.name || "-"}</td>
                <td>${inv.amount}</td>
                <td>
                  <span className={`status-badge status-${inv.status}`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  {inv.status === "PENDING" &&
                    (role === "ACCOUNTANT" || role === "MANAGER") && (
                      <form action={markPaid}>
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <button
                          type="submit"
                          className="btn btn-secondary"
                          style={{
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.8rem",
                            background: "#10b981",
                          }}
                        >
                          {t.invoice.markPaid}
                        </button>
                      </form>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
