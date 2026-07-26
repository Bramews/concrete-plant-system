"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { RoleType } from "@/lib/types/auth";

// -- Initial Permissions --
const CAN_EDIT_LAB = [
  "LAB_TECH",
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_APPROVE_LAB = [
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_DELETE_LAB = ["LAB_MANAGER", "MANAGER", "SYSTEM_OWNER"];

function checkPermission(
  role: RoleType,
  action: "EDIT" | "APPROVE" | "DELETE",
) {
  let allowed = CAN_EDIT_LAB;
  if (action === "APPROVE") allowed = CAN_APPROVE_LAB;
  if (action === "DELETE") allowed = CAN_DELETE_LAB;

  const roleName =
    typeof role === "string" ? role : (role as { name: string }).name;

  if (!allowed.includes(roleName)) {
    throw new Error("غير مصرح لك بالقيام بهذا الإجراء في المختبر");
  }
}

// -- Sieve Analysis Mutations --

export async function addSieveAnalysis(data: {
  materialId: number;
  readings: Record<string, number>;
  totalWeight: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role = user.role;
  checkPermission(role, "EDIT");

  const analysis = await prisma.sieveAnalysis.create({
    data: {
      materialId: data.materialId,
      readings: JSON.stringify(data.readings),
      totalWeight: data.totalWeight,
      zone: "Zone II", // Mock Result
      status: "PENDING",
    },
  });

  revalidatePath("/system/lab");
  return analysis;
}

export async function approveSieveAnalysis(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  checkPermission(user.role, "APPROVE");

  await prisma.sieveAnalysis.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
    },
  });
  revalidatePath("/system/lab");
}

// -- Order Mutations --

export async function approveOrder(id: number, details?: string) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  checkPermission(user.role, "APPROVE");

  await prisma.$transaction(async (tx) => {
    await tx.labApproval.create({
      data: {
        orderId: id,
        userId: user.id,
        details: details || "",
        status: "APPROVED",
      },
    });
    // --- Auto-generate Invoice on Lab Approval ---
    const orderForInvoice = await tx.order.findUnique({
      where: { id },
      include: { mixDesign: true },
    });
    if (orderForInvoice) {
      const unitPrice = orderForInvoice.mixDesign?.concretePrice || 0;
      const pumpPrice = orderForInvoice.mixDesign?.pumpPrice || 0;
      const laborPrice = orderForInvoice.mixDesign?.laborPrice || 0;
      const amount =
        (unitPrice + pumpPrice + laborPrice) * orderForInvoice.volume;
      const invoiceId = `INV-ORD-${id}-${Date.now()}`;
      await tx.invoice.create({
        data: {
          id: invoiceId,
          companyId: user.companyId!,
          orderId: id,
          amount,
          currency: "IQD",
          status: "PENDING",
          type: "ORDER",
          creatorName: "النظام - موافقة المختبر",
        },
      });
    }
    // ----------------------------------------------

    await tx.order.update({
      where: {
        id,
        companyId: user.companyId,
      },
      data: { status: "LAB_APPROVED" },
    });
  });

  revalidatePath("/system/lab/approvals");
}

// -- Mix Design Mutations --
export async function createMixDesign(data: any) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("No Company");
  checkPermission(user.role, "EDIT");
  try {
    const mix = await prisma.mixDesign.create({
      data: {
        companyId: user.companyId,
        ...data,
        calculations: data.calculations
          ? JSON.stringify(data.calculations)
          : undefined,
        trialInfo: data.trialInfo ? JSON.stringify(data.trialInfo) : undefined,
        labResults: data.labResults
          ? JSON.stringify(data.labResults)
          : undefined,
        moistureData: data.moistureData
          ? JSON.stringify(data.moistureData)
          : undefined,
        strengthResults: data.strengthResults
          ? JSON.stringify(data.strengthResults)
          : undefined,
        trialVolumeData: data.trialVolumeData
          ? JSON.stringify(data.trialVolumeData)
          : undefined,
        status: "DRAFT",
        components: data.components
          ? {
              create: data.components.map((c: any) => ({
                ...c,
              })),
            }
          : undefined,
      },
    });
    revalidatePath("/system/lab");
    revalidatePath("/system/lab/mix-designs");
    return mix;
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002")
      throw new Error("DUPLICATE_MIX_CODE");
    throw e;
  }
}
export async function updateMixDesign(id: number, data: any) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("No Company");
  checkPermission(user.role, "EDIT");
  const existing = await prisma.mixDesign.findUnique({ where: { id } });
  if (existing?.status !== "DRAFT") {
    throw new Error("Cannot edit approved mix design");
  }
  const updated = await prisma.mixDesign.update({
    where: { id },
    data: {
      ...data,
      calculations: data.calculations
        ? JSON.stringify(data.calculations)
        : undefined,
      // ... other fields
    },
  });
  if (data.components) {
    await prisma.mixComponent.deleteMany({ where: { mixDesignId: id } });
    for (const c of data.components) {
      await prisma.mixComponent.create({
        data: { mixDesignId: id, ...c },
      });
    }
  }
  revalidatePath("/system/lab");
  revalidatePath("/system/lab/mix-designs");
  return updated;
}
export async function archiveMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");
  checkPermission(user.role, "DELETE");
  await prisma.mixDesign.update({
    where: { id, companyId: user.companyId },
    data: {
      status: "ARCHIVED",
      deletedAt: new Date(),
      isCurrent: false,
    },
  });
  revalidatePath("/system/lab/mix-designs");
}
export async function restoreMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");
  checkPermission(user.role, "EDIT");
  await prisma.mixDesign.update({
    where: { id, companyId: user.companyId },
    data: {
      status: "DRAFT",
      deletedAt: null,
      isCurrent: true,
    },
  });
  revalidatePath("/system/lab/mix-designs");
}
export async function freezeMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");
  checkPermission(user.role, "EDIT");
  await prisma.mixDesign.update({
    where: { id, companyId: user.companyId },
    data: { isFrozen: true },
  });
  revalidatePath("/system/lab/mix-designs");
}
export async function unfreezeMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");
  checkPermission(user.role, "EDIT");
  await prisma.mixDesign.update({
    where: { id, companyId: user.companyId },
    data: { isFrozen: false },
  });
  revalidatePath("/system/lab/mix-designs");
}
export async function deleteMixDesignPermanently(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");
  checkPermission(user.role, "DELETE");
  const mix = await prisma.mixDesign.findUnique({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { orders: true } } },
  });
  if (!mix) throw new Error("Max not found");
  if (mix._count.orders > 0) throw new Error("HAS_ORDERS");
  await prisma.mixComponent.deleteMany({ where: { mixDesignId: id } });
  await prisma.mixDesign.delete({ where: { id, companyId: user.companyId } });
  revalidatePath("/system/lab/mix-designs");
}
export async function approveMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");
  checkPermission(user.role, "APPROVE");
  await prisma.mixDesign.update({
    where: { id, companyId: user.companyId },
    data: { status: "APPROVED" },
  });
  revalidatePath("/system/lab");
  revalidatePath("/system/lab/mix-designs");
}
export async function addCubeResult(data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  checkPermission(user.role, "EDIT");
  // simplified calc logic if needed or import from lib
  const test = await prisma.cubeTest.create({
    data: { ...data, status: "PENDING" },
  });
  revalidatePath("/system/lab");
  return test;
}
