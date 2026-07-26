"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDeletedEntities() {
  const [deletedCompanies, deletedUsers] = await Promise.all([
    (prisma.company as any).findDeleted() as Promise<
      { id: number; name: string; deletedAt: Date | null }[]
    >,
    (prisma.user as any).findDeleted() as Promise<
      {
        id: number;
        username?: string | null;
        email: string;
        deletedAt: Date | null;
      }[]
    >,
  ]);

  return {
    companies: deletedCompanies,
    users: deletedUsers,
  };
}

export async function restoreEntity(model: "company" | "user", id: number) {
  try {
    if (model === "company") {
      await (prisma.company as any).restore(id);
    } else if (model === "user") {
      await (prisma.user as any).restore(id);
    }

    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    console.error(`Failed to restore ${model}:`, error);
    return { success: false, error: "فشلت عملية الاستعادة" };
  }
}

export async function getDeletedStats() {
  const [companyCount, userCount] = await Promise.all([
    prisma.company.count({
      where: { deletedAt: { not: null } },
    }),
    prisma.user.count({
      where: { deletedAt: { not: null } },
    }),
  ]);
  return {
    companies: companyCount,
    users: userCount,
    total: companyCount + userCount,
  };
}

export async function hardDeleteEntity(model: "company" | "user", id: number) {
  try {
    if (model === "company") {
      await prisma.$executeRawUnsafe(`DELETE FROM "Company" WHERE id = ${id}`);
    } else if (model === "user") {
      await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = ${id}`);
    }

    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    console.error(`Failed to hard delete ${model}:`, error);
    return { success: false, error: "فشلت عملية الحذف النهائي" };
  }
}

export async function emptyRecycleBin(model?: "company" | "user") {
  try {
    if (!model || model === "company") {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "Company" WHERE deletedAt IS NOT NULL`,
      );
    }
    if (!model || model === "user") {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "User" WHERE deletedAt IS NOT NULL`,
      );
    }

    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    console.error("Failed to empty recycle bin:", error);
    return { success: false, error: "فشل تفريغ سلة المهملات" };
  }
}
