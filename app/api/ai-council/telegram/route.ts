import { NextRequest, NextResponse } from "next/server";
import {
  handleTelegramWebhookUpdate,
  sendTelegramNotification,
} from "@/lib/ai-council/telegram-bot";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await handleTelegramWebhookUpdate(body);

    if (result && result.chatId && process.env.TELEGRAM_BOT_TOKEN) {
      await sendTelegramNotification(
        process.env.TELEGRAM_BOT_TOKEN,
        result.chatId.toString(),
        result.replyText,
        false,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error processing update:", error);
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ACTIVE",
    service: "Sovereign AI Council Telegram Webhook",
    timestamp: new Date().toISOString(),
  });
}
