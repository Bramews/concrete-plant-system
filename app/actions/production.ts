"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { generateTicketHash, generateQRUrl } from "@/lib/delivery-dna";

import { requireRole, getCurrentUser } from "@/lib/auth";
import { trackBatchProduction } from "@/lib/maintenance-engine";
import { logEvent } from "@/lib/logger";
import { z } from "zod";
import {
  acquireLock,
  releaseLock,
  checkIdempotency,
  saveIdempotency,
} from "@/lib/locks";

const CreateBatchSchema = z.object({
  orderId: z.number().int().positive(),
  quantity: z.number().positive(),
  truckNumber: z.string().min(1),
  driverName: z.string().min(1),
  cubesCount: z.number().int().nonnegative().optional(),
  requestId: z.string().min(1), // Idempotency token
});

export async function createBatch(formData: FormData) {
  const startTime = Date.now();

  // Phase 2 Clause 3.1: Internal Role & User Verification
  await requireRole(["OPERATOR"]);

  // Parse and validate input (Clause 3.3)
  const rawData = {
    orderId: parseInt(formData.get("orderId") as string),
    quantity: parseFloat(formData.get("quantity") as string),
    truckNumber: formData.get("truckNumber") as string,
    driverName: formData.get("driverName") as string,
    cubesCount: parseInt(formData.get("cubesCount") as string) || 3,
    requestId: formData.get("requestId") as string,
  };

  const validation = CreateBatchSchema.safeParse(rawData);
  if (!validation.success) {
    throw new Error(`VALIDATION_ERROR: ${validation.error.message}`);
  }
  const data = validation.data;

  // Phase 2 Clause 1.1: Idempotency Check
  const existingResult = await checkIdempotency(data.requestId);
  if (existingResult) return existingResult;

  // Phase 2 Clause 1.1: Logical Locking
  const lockId = `Order-${data.orderId}`;
  const lockAcquired = await acquireLock(lockId);
  if (!lockAcquired) {
    throw new Error(
      "CONCURRENCY_ERROR: Order is currently being processed by another worker.",
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        mixDesign: true,
        labApproval: true,
        tickets: true,
        project: true,
      },
    });

    const user = await getCurrentUser();
    if (!user?.companyId) throw new Error("Unauthorized");

    if (!order) throw new Error("Order not found");

    // Security: Ensure Order belongs to same company
    if (order.companyId !== user.companyId) {
      throw new Error("Unauthorized Access to Order");
    }

    // Check truck availability (Ensure truck is not currently in transit)
    const activeTruckTicket = await prisma.deliveryTicket.findFirst({
      where: {
        truckNumber: data.truckNumber,
        status: "DISPATCHED",
        companyId: user.companyId!,
      },
    });

    if (activeTruckTicket) {
      throw new Error(
        `الشاحنة (${data.truckNumber}) حالياً في الطريق بشحنة سابقة (تذكرة: ${activeTruckTicket.ticketNumber}). يرجى تأكيد وصولها وتحديث حالتها أولاً.`,
      );
    }

    // Check if MixDesign is ACTIVE and locked
    if (order.mixDesign && (order.mixDesign as any).status === "ARCHIVED") {
      throw new Error(
        "لا يمكن الصب: الخلطة المعتمدة مؤرشفة أو ملغاة من قبل المختبر.",
      );
    }

    // Ensure actualQuantity is current
    if (order.status !== "LAB_APPROVED" && order.status !== "PRODUCTION") {
      throw new Error("Order must be approved by Lab before production");
    }

    const approvalData = JSON.parse(order.labApproval?.mixData || "{}");
    const proportions = approvalData.proportions || {};
    if (Object.keys(proportions).length === 0) {
      const components = await prisma.mixComponent.findMany({
        where: { mixDesignId: order.mixDesign?.id || 0 },
      });
      if (components.length > 0) {
        for (const comp of components) {
          proportions[comp.materialName] = comp.quantity;
        }
      } else {
        throw new Error(
          "لا يمكن بدء الإنتاج: بيانات الخلطة غير مكتملة. يرجى التواصل مع مسؤول المختبر.",
        );
      }
    }
    const actualMixData = JSON.stringify({
      proportions,
      timestamp: Date.now(),
    });

    const newActualQuantity = order.actualQuantity + data.quantity;
    const ticketNumber = `TKT-${Date.now()}`;

    // Pre-generate tracking token, hashes, and QR code to keep transaction fast & lightweight
    const trackingToken = crypto.randomBytes(16).toString("hex");
    let destLat: number | undefined = undefined;
    let destLng: number | undefined = undefined;
    const locationStr = order.project?.location || "";
    const notesStr = order.notes || "";
    const gpsMatch =
      locationStr.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
      notesStr.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (gpsMatch) {
      destLat = parseFloat(gpsMatch[1]);
      destLng = parseFloat(gpsMatch[2]);
    }
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const deliveryHash = await generateTicketHash({
      orderId: data.orderId,
      mixDesignCode: order.mixDesign?.code || "",
      quantity: data.quantity,
      driverName: data.driverName,
      truckNumber: data.truckNumber,
      timestamp: new Date(),
      companyId: user.companyId!,
    });
    const qrCode = generateQRUrl(deliveryHash, baseUrl);
    const trackingLink = `${baseUrl}/track/${trackingToken}`;

    const result = await prisma.$transaction(
      async (tx) => {
        const batch = await tx.batch.create({
          data: {
            orderId: data.orderId,
            quantity: data.quantity,
            actualMixData,
            companyId: user.companyId,
          },
        });

        // --- New Inventory Deduction Logic ---
        const proportions = approvalData.proportions || {};
        for (const [matName, valuePerM3] of Object.entries(proportions)) {
          const consumption = (valuePerM3 as number) * data.quantity;

          // Find material and deduct
          const material = await tx.material.findFirst({
            where: {
              name: matName as string,
              companyId: user.companyId!,
            },
          });
          if (material) {
            await tx.material.update({
              where: { id: material.id, companyId: user.companyId! },
              data: { stock: { decrement: consumption } },
            });

            await tx.inventoryTransaction.create({
              data: {
                materialId: material.id,
                type: "OUT",
                quantity: consumption,
                reference: `BATCH-${batch.id}`,
                companyId: user.companyId!,
              },
            });
          }
        }
        // -------------------------------------

        await tx.deliveryTicket.create({
          data: {
            ticketNumber,
            orderId: data.orderId,
            batchId: batch.id,
            truckNumber: data.truckNumber,
            driverName: data.driverName,
            status: "DISPATCHED",
            cubesCount: data.cubesCount,
            cumulativeQuantity: newActualQuantity,
            trackingToken,
            destinationLat: destLat,
            destinationLng: destLng,
            destinationLabel: order.project?.location || order.notes || "",
            deliveryHash,
            qrCode,
            companyId: user.companyId!,
          },
        });

        await tx.order.update({
          where: { id: data.orderId, companyId: user.companyId! },
          data: {
            status: "PRODUCTION",
            actualQuantity: newActualQuantity,
          },
        });

        return {
          success: true,
          ticketNumber,
          trackingLink,
          driverName: data.driverName,
        };
      },
      { timeout: 15000 },
    );

    // CONTRACT Phase 2: Traceable Log with Duration and Mix Snapshot for Order Report
    await logEvent({
      action: "PRODUCTION",
      entity: "Order",
      entityId: data.orderId,
      newStatus: "PRODUCTION",
      requestId: data.requestId,
      startTime,
      details: `Batched ${data.quantity} m3 (Cumulative: ${newActualQuantity}). Truck: ${data.truckNumber}, Driver: ${data.driverName}. Mix Code: ${order.mixDesign?.code || "N/A"}, Mix Proportions: ${JSON.stringify(proportions)}.`,
    });

    // Save for idempotency
    await saveIdempotency(data.requestId, result);

    // Track Predictive Maintenance
    try {
      await trackBatchProduction(user.companyId);
    } catch (mErr) {
      console.error("Failed to track batch maintenance:", mErr);
    }

    revalidatePath("/production");
    revalidatePath("/orders");
    revalidatePath("/tickets");
    // Removed return for Form Action compatibility
  } catch (error: unknown) {
    // Clause 2.3: No silent failures. Log and report.
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    await logEvent({
      action: "PRODUCTION_FAILED",
      entity: "Order",
      entityId: data.orderId,
      requestId: data.requestId,
      startTime,
      details: `Production failed: ${errorMessage}`,
    });
    throw error;
  } finally {
    // Release Logical Lock
    await releaseLock(lockId);
  }
}

export async function updateProductionTicket(formData: FormData) {
  await requireRole(["OPERATOR", "MANAGER"]);

  const ticketId = parseInt(formData.get("ticketId") as string);
  const quantity = parseFloat(formData.get("quantity") as string);
  const truckNumber = formData.get("truckNumber") as string;
  const driverName = formData.get("driverName") as string;
  const reason = formData.get("reason") as string;

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: ticketId },
    include: { batch: true, order: true },
  });

  if (!ticket) throw new Error("Ticket not found");

  // Security check
  if (ticket.order.companyId !== user.companyId) {
    throw new Error("Access Denied");
  }

  const diff = quantity - ticket.batch.quantity;

  await prisma.$transaction([
    prisma.batch.update({
      where: { id: ticket.batchId },
      data: { quantity },
    }),
    prisma.deliveryTicket.update({
      where: { id: ticketId },
      data: { truckNumber, driverName },
    }),
    prisma.order.update({
      where: { id: ticket.orderId },
      data: { actualQuantity: { increment: diff } },
    }),
  ]);

  await logEvent({
    action: "OPERATOR_CORRECTION",
    entity: "Ticket",
    entityId: ticketId,
    details: `Ticket ${ticket.ticketNumber} updated. Diff: ${diff} m3. Reason: ${reason}`,
  });

  revalidatePath("/production");
  revalidatePath("/tickets");
}

export async function completeOrderDelivery(orderId: number) {
  await requireRole(["OPERATOR"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("غير مصرح");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error("الأوردر غير موجود");
  if (order.companyId !== user.companyId) throw new Error("غير مصرح");
  if (order.status !== "PRODUCTION") {
    throw new Error("لا يمكن إنهاء أوردر ليس في مرحلة الإنتاج");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "DELIVERED",
      dispatchedAt: new Date(),
    },
  });

  revalidatePath("/system/operator/production");
  revalidatePath("/system/lab/cube-results");
  return { success: true };
}
