"use server";

import { prisma } from "@/lib/prisma";

export async function getPublicVerifiedTicket(id: string) {
  // We use the ID or a special verification code
  // For simplicity here, we fetch by ID but limit the fields for public view
  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: parseInt(id) },
    include: {
      batch: true,
      order: {
        include: {
          project: true,
          mixDesign: true,
          customer: true,
        },
      },
    },
  });

  if (!ticket) return null;

  return {
    id: ticket.id,
    orderNumber: ticket.order?.orderNumber,
    customerName: ticket.order?.customer?.name,
    projectName: ticket.order?.project?.name,
    mixCode: ticket.order?.mixDesign?.code,
    strengthClass: ticket.order?.mixDesign?.strengthClass,
    quantity: ticket.batch?.quantity || ticket.cumulativeQuantity,
    truckNumber: ticket.truckNumber,
    batchTime: ticket.createdAt,
    status: ticket.status,
    isVerified: ticket.status !== "CANCELLED",
  };
}
