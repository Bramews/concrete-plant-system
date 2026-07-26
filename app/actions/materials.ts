"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createMaterial(data: {
  name: string;
  code?: string;
  unit: string;
  initialStock?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return { success: false, error: "غير مصرح لك بالقيام بهذا الإجراء" };
    }

    const material = await prisma.material.create({
      data: {
        name: data.name,
        code: data.code,
        unit: data.unit,
        stock: data.initialStock || 0,
        companyId: user.companyId,
      },
    });

    revalidatePath("/system/manager/materials");
    return { success: true, data: material };
  } catch (error: unknown) {
    console.error("[createMaterial] Error:", error);
    if ((error as { code?: string }).code === "P2002")
      return { success: false, error: "اسم المادة أو الكود موجود مسبقاً" };
    return {
      success: false,
      error: "فشل في إضافة المادة، يرجى المحاولة مرة أخرى",
    };
  }
}

export async function updateMaterial(
  id: number,
  data: { name?: string; code?: string; unit?: string; status?: string },
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return { success: false, error: "غير مصرح لك بالقيام بهذا الإجراء" };
    }

    const { name, code, unit, status } = data;
    const sanitizedData = { name, code, unit, status };

    const material = await prisma.material.update({
      where: { id, companyId: user.companyId },
      data: sanitizedData,
    });

    revalidatePath("/system/manager/materials");
    return { success: true, data: material };
  } catch (error: unknown) {
    console.error("[updateMaterial] Error:", error);
    if ((error as { code?: string }).code === "P2025")
      return {
        success: false,
        error: "لم يتم العثور على المادة المطلوبة أو لا تملك صلاحية تعديلها",
      };
    if ((error as { code?: string }).code === "P2002")
      return {
        success: false,
        error: "هذا الاسم أو الكود مستخدم بالفعل لمادة أخرى",
      };
    return { success: false, error: "فشل في تحديث بيانات المادة" };
  }
}

export async function deleteMaterial(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return { success: false, error: "غير مصرح لك بالقيام بهذا الإجراء" };
    }

    const usageCount = await prisma.mixComponent.count({
      where: { materialId: id },
    });
    const sieveCount = await prisma.sieveAnalysis.count({
      where: { materialId: id },
    });

    if (usageCount > 0 || sieveCount > 0) {
      return {
        success: false,
        error: "لا يمكن حذف المادة لأنها مستخدمة في خلطات أو فحوصات سابقة",
      };
    }

    await prisma.material.delete({
      where: { id, companyId: user.companyId },
    });

    revalidatePath("/system/manager/materials");
    return { success: true };
  } catch (error: unknown) {
    console.error("[deleteMaterial] Error:", error);
    if ((error as { code?: string }).code === "P2025")
      return { success: false, error: "المادة غير موجودة بالفعل" };
    return { success: false, error: "فشل في حذف المادة" };
  }
}
