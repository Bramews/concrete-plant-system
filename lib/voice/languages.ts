/**
 * Central voice language and character configuration for Concrete Plant System
 */

export interface VoiceCharacter {
  id: string;
  nameAr: string;
  nameEn: string;
  greetingAr: string;
  greetingEn: string;
  tone: "technical" | "friendly" | "robotic";
  voiceRate: number; // Speed of speaking
  voicePitch: number; // Pitch of speaking
}

export interface VoiceMessages {
  offline: string;
  error: string;
  notUnderstood: string;
  micClosed: string;
  micKeepOpen: string;
  orderCreated: string;
  orderFailed: string;
  processing: string;
}

export interface LanguageConfig {
  code: string;
  recognitionLang: string;
  synthesisLang: string;
  messages: VoiceMessages;
}

export const VOICE_CHARACTERS: Record<string, VoiceCharacter> = {
  saleh: {
    id: "saleh",
    nameAr: "المهندس صالح",
    nameEn: "Engineer Saleh",
    greetingAr: "نظام الخلاطة والصوامع جاهز لاستقبال أمرك.",
    greetingEn:
      "Welcome, the mixing and silo systems are ready for your command.",
    tone: "technical",
    voiceRate: 0.95,
    voicePitch: 0.85,
  },
  sarah: {
    id: "sarah",
    nameAr: "المشرفة سارة",
    nameEn: "Supervisor Sarah",
    greetingAr:
      "مرحباً بك، أنا سارة. سأساعدك في تتبع حركة الأسطول والطلبيات اليوم.",
    greetingEn:
      "Hello, I am Sarah. I will help you track fleet logistics and orders today.",
    tone: "friendly",
    voiceRate: 1.05,
    voicePitch: 1.1,
  },
  steel_core: {
    id: "steel_core",
    nameAr: "العميل الفولاذي",
    nameEn: "Steel-Core AI",
    greetingAr: "تم تنشيط الوحدة. في انتظار الإدخال الصوتي للمحطة.",
    greetingEn: "System online. Awaiting voice input.",
    tone: "robotic",
    voiceRate: 0.85,
    voicePitch: 0.6,
  },
  antigravity: {
    id: "antigravity",
    nameAr: "أنتيجرافتي (ذكي ورسمي)",
    nameEn: "Antigravity (Intelligent & Formal)",
    greetingAr:
      "مرحباً، أنا المساعد الصوتي أنتيجرافتي. الأنظمة جاهزة لاستقبال الأوامر والتحليلات.",
    greetingEn:
      "Hello! I am Antigravity, your intelligent assistant. System is ready to accept commands and analytics.",
    tone: "technical",
    voiceRate: 1.0,
    voicePitch: 1.0,
  },
};

export const VOICE_LANGUAGES: Record<string, LanguageConfig> = {
  ar: {
    code: "ar",
    recognitionLang: "ar-SA",
    synthesisLang: "ar-SA",
    messages: {
      offline: "انقطع الاتصال بالشبكة. يرجى التحقق من الاتصال بالإنترنت.",
      error: "حدث خطأ أثناء معالجة الطلب.",
      notUnderstood:
        "أمر غير مفهوم. يرجى استخدام كلمات مثل صوامع، أو الإنتاج، أو الطلبيات.",
      micClosed: "تم تنفيذ الطلب، تم إغلاق الميكروفون.",
      micKeepOpen: "الميكروفون نشط، بانتظار الأمر.",
      orderCreated: "تم إنشاء الطلب بنجاح برقم {num}.",
      orderFailed: "تعذر إنشاء الطلب: {err}.",
      processing: "جاري معالجة الطلب...",
    },
  },
  en: {
    code: "en",
    recognitionLang: "en-US",
    synthesisLang: "en-US",
    messages: {
      offline:
        "Internet connection is disconnected. Please check your network and try again.",
      error: "Sorry, an error occurred while processing your request.",
      notUnderstood:
        "Command not recognized. Try using words like: silos, logistics, or today's production.",
      micClosed: "Task completed, microphone closed.",
      micKeepOpen: "Awaiting your next command...",
      orderCreated: "Order created successfully with number {num}.",
      orderFailed: "Order creation failed: {err}.",
      processing: "Processing...",
    },
  },
};

export function getVoiceMessage(
  lang: string,
  key: keyof VoiceMessages,
  replacements?: Record<string, string>,
): string {
  const config = VOICE_LANGUAGES[lang] || VOICE_LANGUAGES.ar;
  let text = config.messages[key] || VOICE_LANGUAGES.ar.messages[key];
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}
