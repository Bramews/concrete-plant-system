"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPlan(id: number) {
  await requireRole(["SYSTEM_OWNER"]);
  return await prisma.plan.findUnique({
    where: { id },
  });
}

export async function createPlan(data: {
  key: string;
  name: string;
  description: string;
  maxUsers: number;
  maxStorage: number;
  maxOrders: number;
  maxProjects: number;
  price: number;
  features: string[];
}) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const plan = await prisma.plan.create({
      data: {
        ...data,
        features: JSON.stringify(data.features),
      },
    });

    revalidatePath("/admin/plans");
    return { success: true, plan };
  } catch (error) {
    console.error("Create Plan Error:", error);
    return { success: false, error: "Failed to create plan" };
  }
}

export async function updatePlan(
  id: number,
  data: {
    name: string;
    description: string;
    maxUsers: number;
    maxStorage: number;
    maxOrders: number;
    maxProjects: number;
    price: number;
    features: string[];
  },
) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...data,
        features: JSON.stringify(data.features),
      },
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${id}`);
    return { success: true, plan };
  } catch (error) {
    console.error("Update Plan Error:", error);
    return { success: false, error: "Failed to update plan" };
  }
}

export async function deletePlan(id: number) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    await prisma.plan.delete({
      where: { id },
    });

    revalidatePath("/admin/plans");
    return { success: true };
  } catch (error) {
    console.error("Delete Plan Error:", error);
    return { success: false, error: "Failed to delete plan" };
  }
}
