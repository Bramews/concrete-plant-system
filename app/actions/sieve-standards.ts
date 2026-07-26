"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSieveStandards() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  const categories = await prisma.sieveCategory.findMany({
    where: { companyId: user.companyId },
    include: {
      sieves: {
        orderBy: { order: "asc" },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    category:
      cat.name.includes("Sand") || cat.name.includes("رمل") ? "SAND" : "GRAVEL",
    sieves: JSON.stringify(
      cat.sieves.map((s) => ({
        size: s.size,
        min: s.minLimit ?? 0,
        max: s.maxLimit ?? 100,
      })),
    ),
  }));
}

export async function saveSieveStandard(data: {
  id?: string;
  name: string;
  category: string;
  sieves: { size: string; min: number; max: number }[];
}) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  const companyId = user.companyId;

  try {
    let categoryId = data.id;

    if (categoryId) {
      await prisma.sieveCategory.update({
        where: { id: categoryId },
        data: { name: data.name },
      });

      await prisma.sieveDefinition.deleteMany({
        where: { categoryId },
      });
    } else {
      categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await prisma.sieveCategory.create({
        data: {
          id: categoryId,
          companyId,
          name: data.name,
          isActive: true,
        },
      });
    }

    await prisma.$transaction(
      data.sieves.map((s, idx) =>
        prisma.sieveDefinition.create({
          data: {
            id: `${categoryId}_sieve_${idx}_${Date.now()}`,
            categoryId: categoryId!,
            size: s.size,
            minLimit: s.min,
            maxLimit: s.max,
            order: idx,
          },
        }),
      ),
    );

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error saving sieve standard:", error);
    return { success: false, error: "Failed to save sieve standard" };
  }
}

export async function deleteSieveStandard(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    await prisma.sieveCategory.delete({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sieve standard:", error);
    return { success: false, error: "Failed to delete sieve standard" };
  }
}
