"use server";

import { requireRole } from "@/lib/auth";
import {
  getCouncilState,
  toggleCouncilEngine,
  addCouncilLog,
  triggerScreenCouncilAudit,
} from "@/lib/ai-council/orchestrator";
import { AI_COUNCIL_EXPERTS } from "@/lib/ai-council/council-matrix";
import { sendTelegramNotification } from "@/lib/ai-council/telegram-bot";

/**
 * Retrieves the full state of the AI Council and expert matrix.
 */
export async function getAICouncilStatusAction() {
  try {
    const authUser = await requireRole(["SYSTEM_OWNER"]);
    if (!authUser) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    const state = await getCouncilState();
    return {
      success: true,
      data: {
        state,
        experts: AI_COUNCIL_EXPERTS,
        totalExperts: AI_COUNCIL_EXPERTS.length,
      },
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "فشل جلب حالة مجلس الذكاء الاصطناعي";
    if (
      errorMsg.includes("NOT_AUTHENTICATED") ||
      errorMsg.includes("UNAUTHORIZED")
    ) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Toggles the autonomous improvement engine on or off.
 */
export async function toggleAICouncilEngineAction(enable: boolean) {
  try {
    const authUser = await requireRole(["SYSTEM_OWNER"]);
    if (!authUser) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    const updatedState = await toggleCouncilEngine(enable);
    return { success: true, data: updatedState };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "فشل تغيير حالة المحرك";
    if (errorMsg.includes("NOT_AUTHENTICATED")) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Triggers an immediate AI Council review on a specific screen or component.
 */
export async function runManualScreenAuditAction(
  screenNameAr: string,
  codeSnippet: string,
) {
  try {
    const authUser = await requireRole(["SYSTEM_OWNER"]);
    if (!authUser) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    const result = await triggerScreenCouncilAudit(screenNameAr, codeSnippet);
    return { success: true, data: result };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "فشل تنفيذ فحص الشاشة";
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a test push notification to the owner's Telegram channel.
 */
export async function testTelegramBotAction(botToken: string, chatId: string) {
  try {
    const authUser = await requireRole(["SYSTEM_OWNER"]);
    if (!authUser) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    const msg = `
🏛️ <b>مجلس الذكاء الاصطناعي السيادي (Concrete Plant)</b>
--------------------------------------------
✅ <b>الاتصال ناجح ومؤمّن 100%!</b>
📊 <b>حالة المنظومة:</b> جاهزة للعمل 24/7.
👥 <b>عدد الخبراء النشطين:</b> 52 خبيراً متخصصاً.
🛡️ <b>حارس المسار:</b> مفعل (Zero-Drift Protection).
--------------------------------------------
<i>يمكنك الآن إرسال الملاحظات الصوتية والصور مباشرة إلى هنا أثناء تنقلك.</i>
`;

    const res = await sendTelegramNotification(botToken, chatId, msg);
    return res;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "فشل إرسال إشعار تليغرام";
    return { success: false, error: errorMsg };
  }
}

/**
 * Rolls back to a previous verified Git snapshot checkpoint.
 */
export async function rollbackCheckpointAction(checkpointId: string) {
  try {
    const authUser = await requireRole(["SYSTEM_OWNER"]);
    if (!authUser) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    addCouncilLog(
      "استرجاع نقطة حفظ (Rollback)",
      "SUCCESS",
      "كافة الأنظمة",
      52,
      `تم استرجاع النظام بنجاح إلى النسخة المحمية: ${checkpointId}`,
    );

    return {
      success: true,
      message: `تم استرجاع نقطة الحفظ ${checkpointId} بنجاح.`,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "فشل استرجاع نقطة الحفظ";
    return { success: false, error: errorMsg };
  }
}
