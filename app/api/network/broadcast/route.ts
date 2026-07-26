import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseEmitter } from "@/lib/network/emitter";
import { createHmac } from "crypto";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  const session = await getSession();
  const userId = session?.userId;

  // Pre-fetch user's read broadcast timestamps
  let dismissedSystemTime: string | null = null;
  let dismissedCompanyTime: string | null = null;

  if (userId) {
    try {
      const userSettings = await prisma.userSetting.findMany({
        where: {
          userId,
          key: {
            in: [
              "dismissed_system_broadcast_time",
              "dismissed_company_broadcast_time",
            ],
          },
        },
      });
      dismissedSystemTime =
        userSettings.find((s) => s.key === "dismissed_system_broadcast_time")
          ?.value || null;
      dismissedCompanyTime =
        userSettings.find((s) => s.key === "dismissed_company_broadcast_time")
          ?.value || null;
    } catch (err) {
      console.error("Error loading user broadcast settings:", err);
    }
  }

  // Check if client prefers SSE or JSON polling
  const isSse = request.headers.get("accept")?.includes("text/event-stream");

  if (!isSse) {
    let globalMsg = null;
    let companyMsg = null;

    try {
      const globalPolicy = await prisma.systemPolicy.findFirst({
        where: { key: "GLOBAL_SYSTEM_MESSAGE", active: true },
      });
      if (
        globalPolicy &&
        globalPolicy.value &&
        globalPolicy.updatedAt.toISOString() !== dismissedSystemTime
      ) {
        globalMsg = {
          message: globalPolicy.value,
          timestamp: globalPolicy.updatedAt.toISOString(),
          type: "SYSTEM",
        };
      }

      if (companyId) {
        const companySetting = await prisma.companySetting.findFirst({
          where: {
            companyId: Number(companyId),
            key: "COMPANY_BROADCAST_MESSAGE",
          },
        });
        if (
          companySetting &&
          companySetting.value &&
          companySetting.updatedAt.toISOString() !== dismissedCompanyTime
        ) {
          companyMsg = {
            message: companySetting.value,
            timestamp: companySetting.updatedAt.toISOString(),
            type: "COMPANY",
          };
        }
      }
    } catch (e) {
      console.error("Error in broadcast JSON poll:", e);
    }

    return NextResponse.json({
      activeMsg: globalMsg || companyMsg || null,
    });
  }

  const responseStream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(
        new TextEncoder().encode('data: {"type":"CONNECTED"}\n\n'),
      );

      // Fetch and send the latest active global system message (for newly connected / offline users)
      prisma.systemPolicy
        .findFirst({
          where: { key: "GLOBAL_SYSTEM_MESSAGE", active: true },
        })
        .then((policy) => {
          if (policy && policy.value) {
            const time = policy.updatedAt.toISOString();
            if (time !== dismissedSystemTime) {
              const payload = {
                type: "EVENT",
                event: "SYSTEM_BROADCAST",
                isGlobal: true,
                companyId: null,
                data: { message: policy.value },
                timestamp: time,
              };
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(payload)}\n\n`,
                ),
              );
            }
          }
        })
        .catch((err) => {
          console.error("Error sending initial system broadcast:", err);
        });

      // Fetch and send the latest active company system message (for newly connected / offline users of this company)
      if (companyId) {
        prisma.companySetting
          .findFirst({
            where: {
              companyId: Number(companyId),
              key: "COMPANY_BROADCAST_MESSAGE",
            },
          })
          .then((setting) => {
            if (setting && setting.value) {
              const time = setting.updatedAt.toISOString();
              if (time !== dismissedCompanyTime) {
                const payload = {
                  type: "EVENT",
                  event: "COMPANY_BROADCAST",
                  isGlobal: false,
                  companyId: Number(companyId),
                  data: { message: setting.value },
                  timestamp: time,
                };
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify(payload)}\n\n`,
                  ),
                );
              }
            }
          })
          .catch((err) => {
            console.error("Error sending initial company broadcast:", err);
          });
      }

      // Define listener function for this client
      const broadcastListener = (payload: Record<string, unknown>) => {
        try {
          // If it is a global message, deliver to all clients.
          // If it belongs to a company, ONLY deliver if the client's companyId strictly matches the message's companyId.
          const isGlobal =
            payload.companyId === undefined ||
            payload.companyId === null ||
            payload.isGlobal === true;
          if (
            isGlobal ||
            (companyId && Number(payload.companyId) === Number(companyId))
          ) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`),
            );
          }
        } catch {
          sseEmitter.off("broadcast", broadcastListener);
        }
      };

      // Register listener
      sseEmitter.on("broadcast", broadcastListener);

      // Keep-alive heartbeat every 20 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"HEARTBEAT"}\n\n'),
          );
        } catch {
          clearInterval(heartbeat);
          sseEmitter.off("broadcast", broadcastListener);
        }
      }, 20000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseEmitter.off("broadcast", broadcastListener);
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, event, data } = body;

    if (!companyId || !event) {
      return NextResponse.json(
        { success: false, error: "Missing companyId or event" },
        { status: 400 },
      );
    }

    const payload = {
      type: "EVENT",
      companyId: Number(companyId),
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // 1. Broadcast to all active browser SSE clients using shared Emitter
    sseEmitter.emit("broadcast", payload);

    // 2. Forward to physical webhooks (with HMAC SHA-256 Signature)
    const webhooks = await prisma.physicalWebhook.findMany({
      where: {
        companyId: Number(companyId),
        eventType: event,
        isEnabled: true,
      },
    });

    const webhookSecret =
      process.env.WEBHOOK_SECRET || "concrete_plant_secure_key";
    const signature = createHmac("sha256", webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const webhookPromises = webhooks.map(async (wh) => {
      try {
        await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(3000),
        });
      } catch (err: unknown) {
        console.error(
          `Physical Webhook failed for ${wh.url}:`,
          (err as Error).message,
        );
      }
    });

    // Fire webhooks concurrently
    Promise.all(webhookPromises);

    return NextResponse.json({
      success: true,
      webhooksTriggered: webhooks.length,
    });
  } catch (error: unknown) {
    console.error("Broadcast API error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
