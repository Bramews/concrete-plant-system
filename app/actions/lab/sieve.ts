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

export async function addSieveAnalysis(data: {
  materialId: number;
  readings: Record<string, number>;
  totalWeight: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "EDIT");

  const analysis = await prisma.sieveAnalysis.create({
    data: {
      materialId: data.materialId,
      readings: JSON.stringify(data.readings),
      totalWeight: data.totalWeight,
      zone: "Zone II", // Mock Result
      status: "PENDING",
      creatorName: user.name,
    },
  });

  revalidatePath("/system/lab");
  return analysis;
}

export async function approveSieveAnalysis(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "APPROVE");

  await prisma.sieveAnalysis.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approverName: user.name,
    },
  });
  revalidatePath("/system/lab");
}
