"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "site-photos");

/**
 * رفع صورة موقع مرتبطة بطلب معين
 * تُخزَّن في public/uploads/site-photos/
 * المعرّف scope = "ORDER:${orderId}"
 */
export async function uploadSitePhoto(formData: FormData) {
  await requireRole([
    "OPERATOR",
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
  ]);

  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "NOT_AUTHENTICATED" };

  const file = formData.get("file") as File | null;
  const orderId = formData.get("orderId") as string | null;
  const description = formData.get("description") as string | null;

  if (!file || !orderId) return { success: false, error: "MISSING_FIELDS" };

  // التحقق من نوع الملف
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "INVALID_FILE_TYPE" };
  }

  // التحقق من الحجم (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "FILE_TOO_LARGE" };
  }

  const parsedOrderId = parseInt(orderId);
  if (isNaN(parsedOrderId)) {
    return { success: false, error: "INVALID_ORDER_ID" };
  }

  // التأكد من أن الطلب ينتمي للشركة
  const order = await prisma.order.findFirst({
    where: { id: parsedOrderId, companyId: user.companyId },
  });
  if (!order) return { success: false, error: "ORDER_NOT_FOUND" };

  // إنشاء مجلد الرفع إذا لم يكن موجوداً
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // حفظ الملف
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `order_${orderId}_${timestamp}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/site-photos/${filename}`;

  // حفظ في قاعدة البيانات
  await prisma.localFileShare.create({
    data: {
      companyId: user.companyId,
      fileName: description || file.name,
      fileUrl,
      sizeBytes: file.size,
      uploadedById: user.id,
      creatorName: user.name,
      visibility: "MANAGERS",
      scope: `ORDER:${orderId}`,
    },
  });

  revalidatePath(`/system/orders/${orderId}`);
  return { success: true, fileUrl };
}

/**
 * جلب كل صور طلب معين
 */
export async function getOrderSitePhotos(orderId: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, photos: [] };

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId: user.companyId },
  });
  if (!order) return { success: false, photos: [] };

  const photos = await prisma.localFileShare.findMany({
    where: {
      companyId: user.companyId,
      scope: `ORDER:${orderId}`,
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, photos };
}

/**
 * حذف صورة
 */
export async function deleteSitePhoto(photoId: number) {
  await requireRole(["MANAGER", "COMPANY_ADMIN"]);
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false };

  const photo = await prisma.localFileShare.findFirst({
    where: { id: photoId, companyId: user.companyId },
  });
  if (!photo) return { success: false, error: "NOT_FOUND" };

  // حذف الملف من القرص
  try {
    const filePath = path.join(process.cwd(), "public", photo.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}

  await prisma.localFileShare.delete({ where: { id: photoId } });
  return { success: true };
}
