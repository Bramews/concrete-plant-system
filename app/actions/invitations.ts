"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { appendTunnelLog } from "./tunnel";

export interface InvitationResult {
  success: boolean;
  error?: string;
  invitation?: {
    id: string;
    token: string;
    label: string;
    expiresAt: Date;
    tunnelUrl: string;
    viewCount: number;
    createdAt: Date;
  };
}

export async function createInvitation(
  label: string,
  durationHours: number,
): Promise<InvitationResult> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }

  if (!label.trim()) {
    return { success: false, error: "اسم المقاول أو العميل مطلوب" };
  }

  try {
    const urlSetting = await prisma.systemSetting.findUnique({
      where: { key: "tunnel_active_url" },
    });
    const tunnelUrl = urlSetting?.value || "";

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const token = crypto.randomUUID();

    const invitation = await prisma.tunnelInvitation.create({
      data: {
        token,
        label,
        expiresAt,
        tunnelUrl,
      },
    });

    await appendTunnelLog(
      `تم إنشاء دعوة مؤقتة للعميل: ${label} (صالحة لـ ${durationHours} ساعة)`,
    );
    revalidatePath("/admin/settings/system");

    return {
      success: true,
      invitation,
    };
  } catch (error: unknown) {
    console.error("Failed to create invitation:", error);
    return {
      success: false,
      error: (error as Error).message || "فشل إنشاء الدعوة",
    };
  }
}

export async function listInvitations() {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return [];
  }

  try {
    const invitations = await prisma.tunnelInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return invitations;
  } catch (error) {
    console.error("Failed to list invitations:", error);
    return [];
  }
}

export async function revokeInvitation(id: string): Promise<InvitationResult> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }

  try {
    const deleted = await prisma.tunnelInvitation.delete({
      where: { id },
    });

    await appendTunnelLog(`تم إلغاء دعوة العميل: ${deleted.label}`);
    revalidatePath("/admin/settings/system");

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to revoke invitation:", error);
    return {
      success: false,
      error: (error as Error).message || "فشل إلغاء الدعوة",
    };
  }
}

export async function getCustomers() {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return [];
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return customers;
  } catch (error) {
    console.error("Failed to get customers:", error);
    return [];
  }
}
