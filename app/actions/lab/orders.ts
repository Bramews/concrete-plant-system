"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { RoleType } from "@/lib/types/auth";

// -- Permissions --
const CAN_APPROVE_LAB = [
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "MANAGER",
  "SYSTEM_OWNER",
];

function checkPermission(role: RoleType, action: "APPROVE") {
  const roleName =
    typeof role === "string" ? role : (role as { name: string }).name;

  if (!CAN_APPROVE_LAB.includes(roleName)) {
    throw new Error("غير مصرح لك بالقيام بهذا الإجراء في المختبر");
  }
}

export async function approveOrder(id: number, details?: string) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "APPROVE");

  await prisma.$transaction(
    async (tx) => {
      await tx.labApproval.create({
        data: {
          orderId: id,
          userId: user.id,
          details: details || "",
          status: "APPROVED",
        },
      });

      await tx.order.update({
        where: {
          id,
          companyId: user.companyId,
        },
        data: { status: "LAB_APPROVED" },
      });
    },
    { timeout: 20000 },
  );

  revalidatePath("/system/lab/approvals");
}
