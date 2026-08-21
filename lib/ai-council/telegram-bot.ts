/**
 * 🤖 بوت التليغرام السيادي للتحكم عن بعد (Telegram Remote Command Bot)
 * Allows SYSTEM_OWNER to receive instant alerts, send voice notes, screenshots, and approve/rollback with inline buttons.
 */

export interface TelegramMessagePayload {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
  inlineKeyboard?: { text: string; callbackData: string }[][];
}

export interface TelegramUpdate {
  callback_query?: {
    data: string;
    message: {
      chat: {
        id: string | number;
      };
    };
  };
  message?: {
    text?: string;
    voice?: Record<string, unknown>;
    photo?: Record<string, unknown>[];
    chat: {
      id: string | number;
    };
  };
}

/**
 * Sends a rich message to the owner's Telegram channel/chat.
 */
export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  messageAr: string,
  includeActionButtons = true,
): Promise<{ success: boolean; error?: string }> {
  if (!botToken || !chatId) {
    return { success: false, error: "معرف البوت أو معرف المحادثة غير مكتمل." };
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const inline_keyboard = includeActionButtons
    ? [
        [
          {
            text: "✅ اعتماد ونشر التعديل",
            callback_data: "APPROVE_CURRENT_TASK",
          },
          {
            text: "↩️ تراجع فوري (Rollback)",
            callback_data: "ROLLBACK_LAST_CHECKPOINT",
          },
        ],
        [
          {
            text: "📊 تقرير حالة المجلس الـ 52",
            callback_data: "GET_COUNCIL_STATUS",
          },
          {
            text: "⏸️ إيقاف مؤقت للعمل التلقائي",
            callback_data: "TOGGLE_ENGINE_PAUSE",
          },
        ],
      ]
    : undefined;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageAr,
        parse_mode: "HTML",
        reply_markup: inline_keyboard ? { inline_keyboard } : undefined,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        success: false,
        error: `فشل إرسال تليغرام: ${err.slice(0, 100)}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "خطأ اتصال مع تليغرام";
    return { success: false, error: errorMsg };
  }
}

/**
 * Helper to process incoming Telegram Webhook updates.
 */
export async function handleTelegramWebhookUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    const data = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    return {
      action: data,
      chatId,
      replyText: `تم استلام الأمر: ${data} وجاري تنفيذه فوراً على النظام.`,
    };
  }

  if (update.message) {
    const text = update.message.text || "";
    const isVoice = !!update.message.voice;
    const isPhoto = !!update.message.photo;
    const chatId = update.message.chat.id;

    return {
      action: "INCOMING_MESSAGE",
      text,
      isVoice,
      isPhoto,
      chatId,
      replyText: isVoice
        ? "🎙️ تم استلام الملاحظة الصوتية، جاري تفريغها وتحليلها عبر مجلس الخبراء..."
        : isPhoto
          ? "📸 تم استلام صورة الشاشة، جاري فحص عناصر الـ UI/UX وكشف العيوب..."
          : `💬 تم استلام توجيهك: "${text}" وجاري مطابقته مع خارطة الطريق.`,
    };
  }

  return null;
}
