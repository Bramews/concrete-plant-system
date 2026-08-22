"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getSession } from "@/lib/auth";
import { logEvent } from "@/lib/logger";

/**
 * Creates an order with a customer that may or may not exist.
 * If the customer name matches an existing one → use it.
 * Otherwise → create a new customer record on the fly.
 */
export async function createOrderWithCustomer(formData: FormData) {
  try {
    await requireRole([
      "SALES",
      "SALES_REP",
      "SALES_MANAGER",
      "MANAGER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "SYSTEM_OWNER",
    ]);
    const sessionData = await getSession();
    const companyId = sessionData?.companyId;
    if (!companyId)
      throw new Error("لم يتم العثور على الشركة. تأكد من تسجيل الدخول.");

    const customerName = (formData.get("customerName") as string)?.trim();
    const customerPhone =
      (formData.get("customerPhone") as string)?.trim() || null;
    const projectName = (formData.get("projectName") as string)?.trim() || null;
    const siteLocation =
      (formData.get("siteLocation") as string)?.trim() || null;
    const mixDesignId = parseInt(formData.get("mixDesignId") as string);
    const quantity = parseFloat(formData.get("quantity") as string);
    const date = new Date(formData.get("date") as string);
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!customerName) throw new Error("اسم العميل مطلوب");
    if (!mixDesignId) throw new Error("يجب اختيار خلطة");
    if (!quantity || quantity <= 0)
      throw new Error("الكمية يجب أن تكون أكبر من صفر");

    // Upsert customer: find by name+companyId OR create
    let customer = await prisma.customer.findFirst({
      where: { companyId, name: customerName, deletedAt: null },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId,
          name: customerName,
          phone: customerPhone,
        },
      });
    }

    // Optionally upsert project
    let projectId: number | null = null;
    if (projectName) {
      let project = await prisma.project.findFirst({
        where: { companyId, name: projectName, deletedAt: null },
      });
      if (!project) {
        project = await prisma.project.create({
          data: { companyId, name: projectName, location: siteLocation },
        });
      }
      projectId = project.id;
    }

    // Verify mix design
    const mix = await prisma.mixDesign.findFirst({
      where: { id: mixDesignId, companyId, deletedAt: null },
    });
    if (!mix) throw new Error("الخلطة المحددة غير موجودة");

    // Check Customer Credit Status & Enforcement
    let initialStatus = "DRAFT";
    let creditWarning = "";
    const estimatedOrderValue = quantity * (mix.concretePrice || 250);

    const { checkCustomerCreditStatus } = await import("@/app/actions/finance");
    const creditCheck = await checkCustomerCreditStatus(
      companyId,
      customer.id,
      estimatedOrderValue,
    );

    if (!creditCheck.isAllowed) {
      initialStatus = "PENDING_FINANCIAL_APPROVAL";
      creditWarning = creditCheck.reason || "تم تعليق الطلبية بانتظار موافقة الإدارة المالية بسبب سقف الائتمان.";
    }

    const orderNumber = `ORD-${Date.now()}`;

    const finalNotes = creditWarning
      ? `${notes ? `${notes}\n` : ""}[تنبيه مالي: ${creditWarning}]`
      : notes;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        companyId,
        customerId: customer.id,
        projectId,
        mixDesignId,
        volume: quantity,
        date,
        status: initialStatus,
        notes: finalNotes,
      },
    });

    await logEvent({
      action: initialStatus === "PENDING_FINANCIAL_APPROVAL" ? "FINANCIAL_HOLD" : "CREATE",
      entity: "Order",
      entityId: order.id,
      newStatus: initialStatus,
      details: `طلب ${orderNumber} للعميل "${customerName}" بحجم ${quantity} م³ - الحالة: ${initialStatus}`,
    });

    revalidatePath("/system/orders");
    revalidatePath("/system/sales/orders");
    revalidatePath("/system/accountant/customers");

    return {
      success: true,
      id: order.id,
      orderNumber,
      isFinancialHold: initialStatus === "PENDING_FINANCIAL_APPROVAL",
      message: creditWarning || undefined,
    };
  } catch (err: unknown) {
    console.error("Create Order Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "خطأ غير متوقع",
    };
  }
}
