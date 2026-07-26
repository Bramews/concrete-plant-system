"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Fetch all sieve categories, their definitions, and all materials with their mappings.
 */
export async function getSieveSettings() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const categories = await prisma.sieveCategory.findMany({
      where: { companyId: user.companyId },
      include: {
        sieves: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const materials = await prisma.material.findMany({
      where: { companyId: user.companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sieveCategoryId: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: { categories, materials } };
  } catch (error) {
    console.error("Error fetching sieve settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

/**
 * Save (Create or Update) a Sieve Category.
 */
export async function saveSieveCategory(id: string | null, name: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    if (id) {
      await prisma.sieveCategory.update({
        where: { id, companyId: user.companyId },
        data: { name },
      });
    } else {
      await prisma.sieveCategory.create({
        data: {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name,
          companyId: user.companyId,
        },
      });
    }

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error saving sieve category:", error);
    return { success: false, error: "Failed to save category" };
  }
}

/**
 * Delete a Sieve Category.
 */
export async function deleteSieveCategory(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    await prisma.sieveCategory.delete({
      where: { id, companyId: user.companyId },
    });

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sieve category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

/**
 * Save (Create or Update) a Sieve Definition within a category.
 */
export async function saveSieveDefinition(
  categoryId: string,
  id: string | null,
  data: { size: string; minLimit?: number; maxLimit?: number; order?: number },
) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    // Verify that the category belongs to the user's company
    const category = await prisma.sieveCategory.findFirst({
      where: { id: categoryId, companyId: user.companyId },
    });
    if (!category) throw new Error("Access Denied");

    if (id) {
      // Verify that the definition belongs to the user's company
      const def = await prisma.sieveDefinition.findFirst({
        where: { id },
        include: { category: { select: { companyId: true } } },
      });
      if (!def || def.category.companyId !== user.companyId) {
        throw new Error("Access Denied");
      }

      await prisma.sieveDefinition.update({
        where: { id },
        data,
      });
    } else {
      await prisma.sieveDefinition.create({
        data: {
          id: `${categoryId}_sieve_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          ...data,
          categoryId,
        },
      });
    }

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error saving sieve definition:", error);
    return { success: false, error: "Failed to save sieve" };
  }
}

/**
 * Delete a Sieve Definition.
 */
export async function deleteSieveDefinition(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const def = await prisma.sieveDefinition.findFirst({
      where: { id },
      include: { category: { select: { companyId: true } } },
    });
    if (!def || def.category.companyId !== user.companyId) {
      throw new Error("Access Denied");
    }

    await prisma.sieveDefinition.delete({
      where: { id },
    });

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sieve definition:", error);
    return { success: false, error: "Failed to delete sieve" };
  }
}

/**
 * Update the Sieve Category mapping for a specific Material (Stock).
 */
export async function updateMaterialSieveMapping(
  materialId: number,
  categoryId: string | null,
) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    await prisma.material.update({
      where: { id: materialId, companyId: user.companyId },
      data: { sieveCategoryId: categoryId },
    });

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error updating material mapping:", error);
    return { success: false, error: "Failed to update mapping" };
  }
}

/**
 * Bulk updates a Sieve Category: Rename and manage its Sieve list (Add, Update, Delete).
 */
export async function bulkUpdateSieveCategory(
  categoryId: string,
  data: {
    name: string;
    sieves: {
      id?: string;
      size: string;
      minLimit: number;
      maxLimit: number;
      order: number;
    }[];
  },
) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Update the category name
      await tx.sieveCategory.update({
        where: { id: categoryId, companyId: user.companyId },
        data: { name: data.name },
      });

      // 2. Fetch current sieves
      const currentSieves = await tx.sieveDefinition.findMany({
        where: { categoryId },
      });

      const currentIds = currentSieves.map((s) => s.id);
      const incomingIds = data.sieves
        .map((s) => s.id)
        .filter(Boolean) as string[];

      // 3. Delete sieves not present in the new list
      const idsToDelete = currentIds.filter((id) => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await tx.sieveDefinition.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      // 4. Update existing sieves and Create new ones
      for (const sieveData of data.sieves) {
        if (sieveData.id) {
          // Update existing
          await tx.sieveDefinition.update({
            where: { id: sieveData.id },
            data: {
              size: sieveData.size,
              minLimit: sieveData.minLimit,
              maxLimit: sieveData.maxLimit,
              order: sieveData.order,
            },
          });
        } else {
          // Create new
          await tx.sieveDefinition.create({
            data: {
              id: `${categoryId}_sieve_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              size: sieveData.size,
              minLimit: sieveData.minLimit,
              maxLimit: sieveData.maxLimit,
              order: sieveData.order,
              categoryId,
            },
          });
        }
      }

      revalidatePath("/system/lab/sieve-analysis");
      return { success: true };
    });
  } catch (error) {
    console.error("Error bulk updating sieve category:", error);
    return { success: false, error: "Failed to perform bulk update" };
  }
}
