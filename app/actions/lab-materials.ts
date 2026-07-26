"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getLabMaterials() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const materials = await prisma.material.findMany({
      where: {
        companyId: user.companyId,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, materials };
  } catch (error) {
    console.error("Error fetching materials:", error);
    return { success: false, error: "Failed to fetch materials" };
  }
}

export async function createLabMaterial(data: {
  name: string;
  code?: string;
  unit: string;
}) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const material = await prisma.material.create({
      data: {
        ...data,
        companyId: user.companyId,
      },
    });

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true, data: material };
  } catch (error) {
    console.error("Error creating material:", error);
    return { success: false, error: "Failed to create material" };
  }
}
export async function updateLabMaterial(id: number, data: any) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");
  try {
    const updated = await prisma.material.update({
      where: { id, companyId: user.companyId },
      data,
    });
    revalidatePath("/system/lab/sieve-analysis");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating material:", error);
    return { success: false, error: "Failed to update material" };
  }
}
export async function saveLabMaterial(data: any) {
  if (data.id && typeof data.id === "number") {
    return updateLabMaterial(data.id, data);
  } else {
    return createLabMaterial(data);
  }
}
export async function deleteLabMaterial(id: number) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");
  try {
    // Soft delete or status update preferred
    await prisma.material.update({
      where: { id, companyId: user.companyId },
      data: { status: "DELETED", deletedAt: new Date() },
    });
    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting material:", error);
    return { success: false, error: "Failed to delete material" };
  }
}
