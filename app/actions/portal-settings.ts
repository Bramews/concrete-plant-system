"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * مفاتيح إعدادات البوابة — تُحفظ في CompanySetting
 * portal_enabled: "true" | "false"          — تفعيل البوابة كاملاً
 * portal_show_orders: "true" | "false"      — إظهار الطلبات
 * portal_show_lab: "true" | "false"         — إظهار نتائج المختبر
 * portal_show_invoices: "true" | "false"    — إظهار الفواتير
 * portal_show_tracking: "true" | "false"    — إظهار موقع الشاحنة
 * portal_show_project_progress: "true" | "false" — إظهار نسبة إنجاز المشروع
 * portal_custom_message_ar: نص               — رسالة ترحيب بالعربي
 * portal_custom_message_en: نص               — رسالة ترحيب بالإنجليزي
 * portal_require_login: "true" | "false"    — هل يتطلب تسجيل دخول أم رابط عام
 */

export async function getPortalSettings(): Promise<Record<string, string>> {
  const user = await getCurrentUser();
  if (!user?.companyId) return {};

  const settings = await prisma.companySetting.findMany({
    where: {
      companyId: user.companyId,
      key: { startsWith: "portal_" },
    },
  });

  const result: Record<string, string> = {
    portal_enabled: "true",
    portal_show_orders: "true",
    portal_show_lab: "true",
    portal_show_invoices: "true",
    portal_show_tracking: "false",
    portal_show_project_progress: "true",
    portal_custom_message_ar: "",
    portal_custom_message_en: "",
    portal_require_login: "true",
  };

  for (const s of settings) {
    result[s.key] = s.value;
  }

  return result;
}

export async function savePortalSettings(formData: FormData) {
  await requireRole(["COMPANY_ADMIN", "MANAGER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false };

  const keys = [
    "portal_enabled",
    "portal_show_orders",
    "portal_show_lab",
    "portal_show_invoices",
    "portal_show_tracking",
    "portal_show_project_progress",
    "portal_custom_message_ar",
    "portal_custom_message_en",
    "portal_require_login",
  ];

  for (const key of keys) {
    const value = formData.get(key) as string;
    if (value !== null) {
      await prisma.companySetting.upsert({
        where: { companyId_key: { companyId: user.companyId!, key } },
        create: { companyId: user.companyId!, key, value },
        update: { value },
      });
    }
  }

  revalidatePath("/system/manager/settings");
  revalidatePath("/system/portal");
  return { success: true };
}

/**
 * إنشاء رابط عام للعميل (بدون كلمة مرور — GuestLink)
 * يرتبط بـ orderId أو customerId
 */
export async function createGuestPortalLink(params: {
  orderId?: number;
  customerId?: number;
  expiresInDays?: number;
}) {
  await requireRole([
    "COMPANY_ADMIN",
    "MANAGER",
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
  ]);
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false };

  const crypto = await import("crypto");
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(
    Date.now() + (params.expiresInDays || 30) * 24 * 60 * 60 * 1000,
  );

  await prisma.guestLink.create({
    data: {
      token,
      companyId: user.companyId,
      expiresAt,
      allowedOrderId: params.orderId,
      notes: `Created by user ${user.id}`,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    success: true,
    link: `${baseUrl}/portal/guest/${token}`,
    expiresAt,
  };
}
