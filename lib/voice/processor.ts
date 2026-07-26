/**
 * Voice Command Processor for Concrete Plant System
 */

import { getVoiceMetrics } from "@/app/actions/voice";

export type VoiceIntent = {
  command: string;
  action: () => void | Promise<void>;
  feedback: string;
  isQuery?: boolean;
};

export class VoiceProcessor {
  private static intents: VoiceIntent[] = [
    {
      command: "الرئيسية",
      action: () => (window.location.href = "/system/manager/dashboard"),
      feedback: "جاري الانتقال للوحة التحكم الرئيسية",
    },
    {
      command: "المواد",
      action: () => (window.location.href = "/system/operator/material-status"),
      feedback: "جاري فتح مراقبة الصوامع",
    },
    {
      command: "الطلبات",
      action: () => (window.location.href = "/system/orders"),
      feedback: "جاري عرض طلبات الزبائن",
    },
    {
      command: "اللوجستية",
      action: () => (window.location.href = "/system/logistics"),
      feedback: "جاري فتح تتبع الأسطول",
    },
    {
      command: "تصاميم الخلطات",
      action: () => (window.location.href = "/system/lab/mix-designs"),
      feedback: "جاري فتح تصاميم الخلطات",
    },
    {
      command: "خلطات",
      action: () => (window.location.href = "/system/lab/mix-designs"),
      feedback: "جاري فتح تصاميم الخلطات",
    },
    {
      command: "تحديث",
      action: () => window.location.reload(),
      feedback: "جاري تحديث البيانات اللحظية",
    },
  ];

  static async process(
    transcript: string,
    pathname: string = "/",
  ): Promise<VoiceIntent | null> {
    const cleanTranscript = transcript.toLowerCase().trim();

    // 1. Module-Specific Intelligence (Context Awareness)
    if (
      pathname.includes("/system/lab") &&
      (cleanTranscript.includes("نتيجة") || cleanTranscript.includes("مكعب"))
    ) {
      const metrics = await getVoiceMetrics("LAB");
      return {
        command: "query",
        action: () => {},
        feedback: metrics.text,
        isQuery: true,
      };
    }

    if (
      pathname.includes("/system/accounting") &&
      (cleanTranscript.includes("رصيد") || cleanTranscript.includes("مالية"))
    ) {
      const metrics = await getVoiceMetrics("FINANCE");
      return {
        command: "query",
        action: () => {},
        feedback: metrics.text,
        isQuery: true,
      };
    }

    // 2. Global Intelligent Queries
    if (
      cleanTranscript.includes("إنتاج") ||
      cleanTranscript.includes("مخزون") ||
      cleanTranscript.includes("شاحن")
    ) {
      const metrics = await getVoiceMetrics("GLOBAL");
      return {
        command: "query",
        action: () => {},
        feedback: metrics.text,
        isQuery: true,
      };
    }

    // 3. Global UI Commands
    if (
      cleanTranscript.includes("إخفاء القائمة") ||
      cleanTranscript.includes("تصغير القائمة")
    ) {
      return {
        command: "ui",
        action: () => {
          const btn = document.querySelector(
            '[aria-label="Toggle Sidebar"]',
          ) as HTMLButtonElement;
          if (btn) btn.click();
        },
        feedback: "جاري إخفاء القائمة الجانبية",
      };
    }

    // 4. Navigation Intents
    const match = this.intents.find((intent) =>
      cleanTranscript.includes(intent.command),
    );

    return match || null;
  }
}
