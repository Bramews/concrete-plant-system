import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Atomic Inventory Deduction
 * Uses DB Transactions to ensure thread safety and prevent negative stock.
 */
export async function deductInventoryAtomically(
  materials: { materialId: number; quantity: number }[],
) {
  return await prisma.$transaction(async (tx) => {
    for (const item of materials) {
      const material = await tx.material.findUnique({
        where: { id: item.materialId },
      });

      if (!material || material.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${material?.name || "Unknown Material"}`,
        );
      }

      await tx.material.update({
        where: { id: item.materialId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });
}
