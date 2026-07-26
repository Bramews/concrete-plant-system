"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { RoleType } from "@/lib/types/auth";

// -- Permissions --
const CAN_EDIT_LAB = [
  "LAB_TECH",
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "LAB_TECHNICIAN",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_APPROVE_LAB = [
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "MANAGER",
  "SYSTEM_OWNER",
];

function checkPermission(role: RoleType, action: "EDIT" | "APPROVE") {
  let allowed = CAN_EDIT_LAB;
  if (action === "APPROVE") allowed = CAN_APPROVE_LAB;

  const roleName =
    typeof role === "string" ? role : (role as { name: string }).name;

  if (!allowed.includes(roleName)) {
    throw new Error("غير مصرح لك بالقيام بهذا الإجراء في المختبر");
  }
}

interface MixComponentInput {
  materialId?: number;
  materialName?: string;
  amount?: number;
  quantity?: number;
  unit?: string;
}

export async function createMixDesign(
  data: Record<string, unknown> & { components?: MixComponentInput[] },
) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "EDIT");

  const { components, ...mixData } = data;

  const mix = await prisma.mixDesign.create({
    data: {
      ...mixData,
      companyId: user.companyId,
      creatorName: user.name,
      version: 1,
      isCurrent: true,
      status: "DRAFT",
      MixComponent: {
        create: (components || []).map((c: MixComponentInput) => ({
          materialId: c.materialId,
          materialName: c.materialName || "Unknown",
          quantity: c.amount || c.quantity || 0,
          unit: c.unit || "kg",
        })),
      },
    } as any,
  });

  revalidatePath("/system/lab/mix-designs");
  return mix;
}

export async function updateMixDesign(
  id: number,
  data: Record<string, unknown> & { components?: MixComponentInput[] },
) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "EDIT");

  const { components, ...mixData } = data;

  await prisma.$transaction(async (tx) => {
    await tx.mixDesign.update({
      where: { id, companyId: user.companyId },
      data: {
        ...mixData,
        updatedAt: new Date(),
      },
    });

    if (components) {
      await tx.mixComponent.deleteMany({ where: { mixDesignId: id } });
      await Promise.all(
        components.map((c: MixComponentInput) =>
          tx.mixComponent.create({
            data: {
              mixDesignId: id,
              materialId: c.materialId,
              materialName: c.materialName || "Unknown",
              quantity: c.amount || c.quantity || 0,
              unit: c.unit || "kg",
            },
          }),
        ),
      );
    }
  });

  revalidatePath("/system/lab/mix-designs");
}

export async function approveMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "APPROVE");

  await prisma.mixDesign.update({
    where: { id, companyId: user.companyId },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approverName: user.name,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/system/lab/mix-designs");
}

export async function createMixDesignRevision(
  id: number,
  note: string,
  newName?: string,
  newCode?: string,
) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "EDIT");

  const oldMix = await prisma.mixDesign.findUnique({
    where: { id },
    include: { MixComponent: true },
  });

  if (!oldMix) throw new Error("Original mix not found");

  await prisma.mixDesign.update({
    where: { id },
    data: { isCurrent: false },
  });

  const newMix = await prisma.mixDesign.create({
    data: {
      name: newName || oldMix.name,
      code: newCode || oldMix.code,
      strengthClass: oldMix.strengthClass,
      targetSlump: oldMix.targetSlump,
      targetWC: oldMix.targetWC,
      details: oldMix.details,
      version: (oldMix.version || 1) + 1,
      parentMixId: oldMix.id,
      companyId: user.companyId,
      creatorName: user.name,
      status: "DRAFT",
      isCurrent: true,
      changeNote: note,
      MixComponent: {
        create: oldMix.MixComponent.map((c) => ({
          materialId: c.materialId,
          materialName: c.materialName,
          quantity: c.quantity,
          unit: c.unit,
        })),
      },
    },
  });

  revalidatePath("/system/lab/mix-designs");
  return newMix;
}
