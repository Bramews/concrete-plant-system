"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logEvent } from "@/lib/logger";

export async function createOrder(formData: FormData) {
  try {
    await requireRole([
      "SALES",
      "SALES_REP",
      "SALES_MANAGER",
      "MANAGER",
      "DEPARTMENT_MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
    ]);

    const customerId = parseInt(formData.get("customerId") as string);
    const projectId = parseInt(formData.get("projectId") as string);
    const mixDesignId = parseInt(formData.get("mixDesignId") as string);
    const date = new Date(formData.get("date") as string);
    const originalQuantity = parseFloat(formData.get("quantity") as string);

    if (!customerId) throw new Error("Customer is required");

    // Generate simple order number
    const orderNumber = `ORD-${Date.now()}`;

    // Phase 4.3: Enforcement
    const { enforceLimit } = await import("@/lib/enforcement");
    // Assuming companyId can be derived from customerId or another source,
    // and volume corresponds to originalQuantity.
    // For this example, we'll use a placeholder for companyId and originalQuantity for volume.
    // In a real scenario, you'd need to fetch the companyId associated with the customer.
    const companyIdPlaceholder = 1; // Replace with actual logic to get companyId
    const decision = await enforceLimit(companyIdPlaceholder, "ORDERS", 1);
    if (!decision.allowed) {
      throw new Error(decision.reason);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        date,
        volume: originalQuantity,
        customerId,
        projectId,
        mixDesignId,
        status: "DRAFT",
        companyId: companyIdPlaceholder,
      },
    });

    await logEvent({
      action: "CREATE",
      entity: "Order",
      entityId: order.id,
      newStatus: "DRAFT",
      details: `Order ${orderNumber} created for ${originalQuantity} m3`,
    });

    revalidatePath("/orders");
    return {
      success: true,
      message: "Order created successfully",
      id: order.id,
    };
  } catch (err: any) {
    console.error("Create Order Error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateOrder(formData: FormData) {
  try {
    await requireRole([
      "SALES",
      "SALES_REP",
      "SALES_MANAGER",
      "MANAGER",
      "DEPARTMENT_MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
    ]);

    const id = parseInt(formData.get("id") as string);
    const date = new Date(formData.get("date") as string);
    const mixDesignId = parseInt(formData.get("mixDesignId") as string);
    const quantity = parseFloat(formData.get("quantity") as string);

    // Check locking
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");
    if (order.status !== "DRAFT") {
      throw new Error(
        "Order is locked (not in DRAFT status) and cannot be modified.",
      );
    }

    await prisma.order.update({
      where: { id },
      data: {
        date,
        mixDesignId,
        volume: quantity,
      },
    });

    await logEvent({
      action: "UPDATE",
      entity: "Order",
      entityId: id,
      details: `Updated draft order ${order.orderNumber}. New Quantity: ${quantity} m3`,
    });

    revalidatePath("/orders");
    return { success: true, message: "Order updated successfully" };
  } catch (err: any) {
    console.error("Update Order Error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteOrder(formData: FormData) {
  try {
    await requireRole([
      "SALES",
      "SALES_REP",
      "SALES_MANAGER",
      "MANAGER",
      "DEPARTMENT_MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
    ]);

    const id = parseInt(formData.get("id") as string);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");

    const startedStatuses = [
      "PRODUCTION",
      "DISPATCHED",
      "DELIVERED",
      "COMPLETED",
      "IN_PROGRESS",
    ];
    if (startedStatuses.includes(order.status)) {
      throw new Error(
        "Cannot delete order once loading or production has started.",
      );
    }

    await prisma.order.delete({ where: { id } });

    await logEvent({
      action: "DELETE",
      entity: "Order",
      entityId: id,
      details: `Deleted order ${order.orderNumber}`,
    });

    revalidatePath("/orders");
    return { success: true, message: "Order deleted successfully" };
  } catch (err: any) {
    console.error("Delete Order Error:", err);
    return { success: false, error: err.message };
  }
}

export async function submitOrderToLab(formData: FormData) {
  try {
    await requireRole([
      "SALES",
      "SALES_REP",
      "SALES_MANAGER",
      "MANAGER",
      "DEPARTMENT_MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
    ]);

    const id = parseInt(formData.get("id") as string);

    const checkOrder = await prisma.order.findUnique({ where: { id } });
    if (!checkOrder) throw new Error("Order not found");
    if (checkOrder.status !== "DRAFT")
      throw new Error("Order is already submitted or processed.");

    const order = await prisma.order.update({
      where: { id },
      data: { status: "PENDING_APPROVAL" },
    });

    await logEvent({
      action: "SUBMIT_TO_LAB",
      entity: "Order",
      entityId: id,
      newStatus: "PENDING_APPROVAL",
      details: `Order ${order.orderNumber} sent to Lab/Management for approval.`,
    });

    revalidatePath("/orders");
    revalidatePath("/system/lab/approvals");
    return { success: true, message: "Order submitted to Lab and locked" };
  } catch (err: any) {
    console.error("Submit Order Error:", err);
    return { success: false, error: err.message };
  }
}
