"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";

export async function triggerPhysicalAlarm(
  companyId: number,
  eventType: "MIX_COMPLETED" | "SYSTEM_ERROR" | "EMERGENCY_STOP",
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  try {
    const webhooks = await prisma.physicalWebhook.findMany({
      where: {
        companyId,
        eventType,
        isEnabled: true,
      },
    });

    if (!webhooks || webhooks.length === 0)
      return { success: false, message: "No active webhooks for this event." };

    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }
        return true;
      }),
    );

    return { success: true, results };
  } catch (error: unknown) {
    console.error("triggerPhysicalAlarm error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getWebhooks(companyId: number) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  try {
    const webhooks = await prisma.physicalWebhook.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, webhooks };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createWebhook(
  companyId: number,
  data: { name: string; url: string; eventType: string },
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  try {
    const webhook = await prisma.physicalWebhook.create({
      data: {
        companyId,
        name: data.name,
        url: data.url,
        eventType: data.eventType,
        isEnabled: true,
      },
    });
    return { success: true, webhook };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleWebhook(id: number, isEnabled: boolean) {
  try {
    const webhook = await prisma.physicalWebhook.update({
      where: { id },
      data: { isEnabled },
    });
    return { success: true, webhook };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteWebhook(id: number) {
  try {
    await prisma.physicalWebhook.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
