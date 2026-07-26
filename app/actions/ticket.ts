"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { checkIdempotency, saveIdempotency } from "@/lib/locks";

// Ticket creation is handled automatically by Production (OPERATOR)
// Dispatcher only manages status

export async function updateTicketStatus(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["OPERATOR", "MANAGER"]);

  const ticketId = parseInt(formData.get("ticketId") as string);
  const status = formData.get("status") as string; // DELIVERED, RETURNED
  const requestId = formData.get("requestId") as string;

  if (requestId) {
    const existing = await checkIdempotency(requestId);
    if (existing) return;
  }

  const user = await requireRole(["OPERATOR", "MANAGER"]); // requireRole returns user? No, wait.
  // requireRole returns void. We need getSession or getCurrentUser.
  // Let's import getCurrentUser.

  const currentUser = await getCurrentUser();
  if (!currentUser?.companyId) throw new Error("Unauthorized");

  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: ticketId },
    include: { order: true },
  });

  if (!ticket) throw new Error("Ticket not found");
  if (ticket.order.companyId !== currentUser.companyId)
    throw new Error("Access Denied");

  await prisma.deliveryTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  await logEvent({
    action: "DISPATCH_UPDATE",
    entity: "DeliveryTicket",
    entityId: ticketId,
    newStatus: status,
    requestId,
    startTime,
    details: `Ticket ${ticket.ticketNumber} status updated to ${status}`,
  });

  if (requestId) {
    await saveIdempotency(requestId, { success: true });
  }

  revalidatePath("/tickets");
}

export async function registerSamples(formData: FormData) {
  await requireRole(["LAB_TECH"]);
  const ticketNumber = formData.get("ticketNumber") as string;
  const cubesCount = parseInt(formData.get("cubesCount") as string);

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  // Multi-tenancy check
  const ticketWithOrder = await prisma.deliveryTicket.findUnique({
    where: { ticketNumber },
    include: { order: true },
  });

  if (!ticketWithOrder) throw new Error("Ticket not found");
  if (ticketWithOrder.order.companyId !== user.companyId)
    throw new Error("Access Denied");

  await prisma.deliveryTicket.update({
    where: { id: ticketWithOrder.id },
    data: { cubesCount },
  });

  await logEvent({
    action: "LAB_SAMPLE",
    entity: "DeliveryTicket",
    entityId: ticketWithOrder.id,
    details: `Registered ${cubesCount} cubes for sampling`,
  });

  revalidatePath("/lab/results");
}
