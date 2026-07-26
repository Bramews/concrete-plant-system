"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * توليد رابط تتبع للسائق عند إنشاء تذكرة تسليم
 * يُستدعى تلقائياً بعد createBatch في production.ts
 */
export async function generateTrackingToken(ticketId: number): Promise<string> {
  const token = crypto.randomBytes(16).toString("hex");

  await prisma.deliveryTicket.update({
    where: { id: ticketId },
    data: { trackingToken: token },
  });

  return token;
}

/**
 * حفظ إعدادات نظام التتبع الخارجي للشركة
 * يُستدعى من صفحة إعدادات الشركة
 * الحقول المقبولة في settings:
 *   tracking_provider: "NONE" | "SAMSARA" | "WIALON" | "CUSTOM"
 *   tracking_api_url: رابط API التتبع الخارجي
 *   tracking_api_key: مفتاح API التتبع الخارجي
 *   tracking_enabled: "true" | "false"
 */
export async function saveTrackingSettings(formData: FormData) {
  await requireRole(["COMPANY_ADMIN", "MANAGER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "NOT_AUTHENTICATED" };

  const provider = formData.get("tracking_provider") as string;
  const apiUrl = formData.get("tracking_api_url") as string;
  const apiKey = formData.get("tracking_api_key") as string;
  const enabled = formData.get("tracking_enabled") === "true";

  const upsertSetting = async (key: string, value: string) => {
    await prisma.companySetting.upsert({
      where: { companyId_key: { companyId: user.companyId!, key } },
      create: { companyId: user.companyId!, key, value },
      update: { value },
    });
  };

  await upsertSetting("tracking_provider", provider || "NONE");
  await upsertSetting("tracking_api_url", apiUrl || "");
  await upsertSetting("tracking_api_key", apiKey || "");
  await upsertSetting("tracking_enabled", enabled ? "true" : "false");

  revalidatePath("/system/manager/settings");
  return { success: true };
}

/**
 * جلب كل الشاحنات النشطة مع مواقعها
 */
export async function getActiveTracking() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, data: [] };

  const tickets = await prisma.deliveryTicket.findMany({
    where: {
      companyId: user.companyId,
      status: "DISPATCHED",
    },
    select: {
      id: true,
      ticketNumber: true,
      truckNumber: true,
      driverName: true,
      currentLat: true,
      currentLng: true,
      lastLocationAt: true,
      destinationLat: true,
      destinationLng: true,
      destinationLabel: true,
      trackingToken: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { success: true, data: tickets };
}

/**
 * إرسال رابط التتبع للسائق عبر SMS أو واجهة النظام
 * حالياً: يُرجع الرابط فقط (SMS تحتاج مزوّد خارجي)
 */
export async function getDriverTrackingLink(ticketId: number): Promise<{
  success: boolean;
  link?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "NOT_AUTHENTICATED" };

  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: ticketId },
    include: { order: true },
  });

  if (!ticket) return { success: false, error: "TICKET_NOT_FOUND" };
  if (ticket.order.companyId !== user.companyId)
    return { success: false, error: "ACCESS_DENIED" };

  let token = ticket.trackingToken;
  if (!token) {
    token = await generateTrackingToken(ticketId);
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return { success: true, link: `${baseUrl}/track/${token}` };
}
