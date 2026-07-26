"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logEvent } from "@/lib/logger";

import { z } from "zod";
import { checkIdempotency, saveIdempotency } from "@/lib/locks";

const AddTestResultSchema = z.object({
  ticketId: z.number().int().positive(),
  testDay: z.number().int().min(1),
  type: z.string().min(1),
  value: z.number().positive(),
  result: z.enum(["PASS", "FAIL"]),
  requestId: z.string().min(1),
});

export async function addTestResult(formData: FormData) {
  const startTime = Date.now();

  // Phase 2 Clause 3.2: Internal Role Verification
  await requireRole(["LAB_TECH"]);

  const rawData = {
    ticketId: parseInt(formData.get("ticketId") as string),
    testDay: parseInt(formData.get("testDay") as string),
    type: formData.get("type") as string,
    value: parseFloat(formData.get("value") as string),
    result: formData.get("result") as string,
    requestId: formData.get("requestId") as string,
  };

  const validation = AddTestResultSchema.safeParse(rawData);
  if (!validation.success)
    throw new Error(`VALIDATION_ERROR: ${validation.error.message}`);
  const data = validation.data;

  // Phase 2 Clause 1.1: Idempotency Check
  const existing = await checkIdempotency(data.requestId);
  if (existing) return;

  try {
    const ticket = await prisma.deliveryTicket.findUnique({
      where: { id: data.ticketId },
      include: { order: true },
    });
    if (!ticket) throw new Error("Ticket not found");

    await prisma.$transaction(async (tx) => {
      await (tx as any).testResult.create({
        data: {
          ticketId: data.ticketId,
          testDay: data.testDay,
          type: data.type,
          value: data.value,
          result: data.result,
        },
      });

      // Phase 2 Clause 4.2: Cube counts SHALL decrease ONLY via test execution.
      if (data.type === "CUBE") {
        await tx.curingPond.update({
          where: { id: ticket.orderId },
          data: { cubeCount: { decrement: 1 } },
        });
      }
    });

    await logEvent({
      action: "LAB_RESULT",
      entity: "DeliveryTicket",
      entityId: data.ticketId,
      requestId: data.requestId,
      startTime,
      details: `Added ${data.testDay}-day ${data.type} result: ${data.value}. Processed Phase 2 hardened.`,
    });

    await saveIdempotency(data.requestId, { success: true });

    revalidatePath("/lab/results");
    revalidatePath("/orders");
  } catch (error: any) {
    await logEvent({
      action: "LAB_RESULT_FAILED",
      entity: "DeliveryTicket",
      entityId: data.ticketId,
      requestId: data.requestId,
      startTime,
      details: `Lab result submission failure: ${error.message}`,
    });
    throw error;
  }
}
