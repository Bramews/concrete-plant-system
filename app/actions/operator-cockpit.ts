"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. Equipment Actions
// ==========================================

export async function getEquipmentList() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("غير مصرح لك");
    const companyId = user.companyId as number;

    const list = await prisma.equipment.findMany({
      where: { companyId },
      include: {
        maintenanceLogs: {
          orderBy: { date: "desc" },
          take: 5,
        },
        faultLogs: {
          orderBy: { reportedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: list };
  } catch (error: unknown) {
    console.error("getEquipmentList failed:", error);
    return {
      success: false,
      error: (error as Error).message || "فشل جلب المعدات",
    };
  }
}

export async function addEquipment(formData: FormData) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
    const user = await getCurrentUser();
    const companyId = user?.companyId as number;

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const serialNumber = (formData.get("serialNumber") as string) || null;
    const hoursRun = parseFloat((formData.get("hoursRun") as string) || "0");

    if (!name || !type) {
      throw new Error("الاسم والنوع مطلوبان");
    }

    const newItem = await prisma.equipment.create({
      data: {
        companyId,
        name,
        type,
        serialNumber,
        hoursRun,
        status: "ACTIVE",
      },
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: newItem };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل إضافة المعدة",
    };
  }
}

export async function updateEquipmentStatus(
  equipmentId: number,
  status: string,
) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

    const updated = await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status },
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: updated };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل تحديث الحالة",
    };
  }
}

// ==========================================
// 2. Maintenance Actions
// ==========================================

export async function addMaintenanceLog(formData: FormData) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

    const equipmentId = parseInt(formData.get("equipmentId") as string);
    const description = formData.get("description") as string;
    const type = formData.get("type") as string; // ROUTINE, REPAIR, OVERHAUL
    const cost = parseFloat((formData.get("cost") as string) || "0");
    const technician = (formData.get("technician") as string) || null;
    const dateInput = formData.get("date") as string;
    const date = dateInput ? new Date(dateInput) : new Date();

    if (!equipmentId || !description || !type) {
      throw new Error("جميع الحقول المطلوبة يجب ملؤها");
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        equipmentId,
        description,
        type,
        cost,
        date,
        technician,
      },
    });

    // Update equipment next maintenance date (e.g. + 3 months or + 100 hours)
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + 3);

    await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        lastMaintenance: date,
        nextMaintenance,
        status: "ACTIVE", // Reset status to active after maintenance
      },
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: log };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل تسجيل الصيانة",
    };
  }
}

// ==========================================
// 3. Fault Actions
// ==========================================

export async function reportFault(formData: FormData) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
    const user = await getCurrentUser();
    const companyId = user?.companyId as number;
    const reportedBy = user?.name || "عامل التشغيل";

    const equipmentId = parseInt(formData.get("equipmentId") as string);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const severity = parseInt((formData.get("severity") as string) || "1");

    if (!equipmentId || !title || !description) {
      throw new Error("البيانات الأساسية للبلاغ ناقصة");
    }

    // Start Transaction
    const result = await prisma.$transaction(async (tx) => {
      const fault = await tx.faultLog.create({
        data: {
          companyId,
          equipmentId,
          title,
          description,
          severity,
          reportedBy,
          status: "PENDING",
        },
      });

      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: "FAULTY" },
      });

      return fault;
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل تسجيل البلاغ",
    };
  }
}

export async function resolveFault(formData: FormData) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

    const faultId = parseInt(formData.get("faultId") as string);
    const solution = formData.get("solution") as string;
    const cost = parseFloat((formData.get("cost") as string) || "0");

    if (!faultId || !solution) {
      throw new Error("الحل مطلوب لإغلاق البلاغ");
    }

    const fault = await prisma.faultLog.findUnique({
      where: { id: faultId },
    });

    if (!fault) throw new Error("البلاغ غير موجود");

    const result = await prisma.$transaction(async (tx) => {
      const updatedFault = await tx.faultLog.update({
        where: { id: faultId },
        data: {
          status: "RESOLVED",
          solution,
          cost,
          resolvedAt: new Date(),
        },
      });

      // Create maintenance log entry automatically
      await tx.maintenanceLog.create({
        data: {
          equipmentId: fault.equipmentId,
          description: `إصلاح عطل: ${fault.title}. الحل: ${solution}`,
          type: "REPAIR",
          cost,
          date: new Date(),
          technician: "صيانة داخلية",
        },
      });

      // Update equipment status
      await tx.equipment.update({
        where: { id: fault.equipmentId },
        data: {
          status: "ACTIVE",
          lastMaintenance: new Date(),
        },
      });

      return updatedFault;
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل إغلاق البلاغ",
    };
  }
}

// ==========================================
// 4. Spare Parts Actions
// ==========================================

export async function getSparePartsList() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("غير مصرح لك");
    const companyId = user.companyId as number;

    const list = await prisma.sparePart.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });

    return { success: true, data: list };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل جلب قطع الغيار",
    };
  }
}

export async function addSparePart(formData: FormData) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
    const user = await getCurrentUser();
    const companyId = user?.companyId as number;

    const name = formData.get("name") as string;
    const code = (formData.get("code") as string) || null;
    const quantity = parseFloat((formData.get("quantity") as string) || "0");
    const reorderPoint = parseFloat(
      (formData.get("reorderPoint") as string) || "0",
    );
    const unit = (formData.get("unit") as string) || "pcs";
    const price = parseFloat((formData.get("price") as string) || "0");
    const supplier = (formData.get("supplier") as string) || null;
    const supplierPhone = (formData.get("supplierPhone") as string) || null;

    if (!name) throw new Error("اسم القطعة مطلوب");

    const newItem = await prisma.sparePart.create({
      data: {
        companyId,
        name,
        code,
        quantity,
        reorderPoint,
        unit,
        price,
        supplier,
        supplierPhone,
      },
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: newItem };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل إضافة قطعة الغيار",
    };
  }
}

export async function adjustSparePartStock(partId: number, adjustment: number) {
  try {
    await requireRole(["OPERATOR", "MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

    const part = await prisma.sparePart.findUnique({
      where: { id: partId },
    });

    if (!part) throw new Error("القطعة غير موجودة");

    const newQty = Math.max(0, part.quantity + adjustment);

    const updated = await prisma.sparePart.update({
      where: { id: partId },
      data: { quantity: newQty },
    });

    revalidatePath("/system/operator/cockpit");
    return { success: true, data: updated };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "فشل تعديل المخزون",
    };
  }
}
