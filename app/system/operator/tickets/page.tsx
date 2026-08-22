import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketListClient } from "../production/TicketListClient";
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
  } catch {
    redirect("/api/auth/session-cleanup");
  }

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }
  const companyId = user.companyId as number;

  const DBTickets = await prisma.deliveryTicket.findMany({
    where: {
      order: {
        companyId,
      },
    },
    include: {
      order: {
        include: {
          customer: true,
          project: true,
          mixDesign: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const formattedTickets = DBTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    truckNumber: t.truckNumber,
    driverName: t.driverName,
    status: t.status,
    cumulativeQuantity: t.cumulativeQuantity,
    createdAt: t.createdAt,
    order: {
      orderNumber: t.order.orderNumber,
      volume: t.order.volume,
      customer: { name: t.order.customer?.name || "عميل عام" },
      project: { name: t.order.project?.name || "مشروع عام" },
      mixDesign: { code: t.order.mixDesign?.code || "MIX-STD" },
    },
  }));

  return <TicketListClient tickets={formattedTickets} />;
}
