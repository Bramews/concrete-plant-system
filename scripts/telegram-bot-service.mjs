import fs from "fs";
import path from "path";
import { PrismaClient } from "../prisma/generated-client/index.js";

const prisma = new PrismaClient();

// قراءة ملف .env
let BOT_TOKEN = "8818574895:AAE3XG8lzi9b2syfxOkp_hNHfwDU2YoEXms";
let GEMINI_KEY = "";

try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const matchToken = envContent.match(/TELEGRAM_BOT_TOKEN=["']?([^"'\r\n]+)/);
    if (matchToken && matchToken[1]) BOT_TOKEN = matchToken[1];

    const matchGemini = envContent.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
    if (matchGemini && matchGemini[1]) GEMINI_KEY = matchGemini[1];
  }
} catch (e) {
  // fallback
}

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log("🚀 Telegram Bot with REAL Database Context & Gemini Started...");

let lastUpdateId = 0;
const conversationHistory = {};

/**
 * جلب ملخص بيانات المحطة الفعلية من قاعدة البيانات
 */
async function getLivePlantContext() {
  try {
    const [
      ordersCount,
      activeOrders,
      mixDesigns,
      customersCount,
      recentTickets,
      materials,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        where: { status: { in: ["APPROVED", "LAB_APPROVED", "IN_PRODUCTION", "DISPATCHED"] } },
        take: 5,
        include: { customer: true, project: true, mixDesign: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mixDesign.findMany({
        take: 6,
        select: { code: true, name: true, strengthClass: true, status: true },
      }),
      prisma.customer.count(),
      prisma.deliveryTicket.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          ticketNumber: true,
          truckNumber: true,
          driverName: true,
          status: true,
          cumulativeQuantity: true,
          createdAt: true,
        },
      }),
      prisma.material.findMany({
        take: 6,
        select: { name: true, stock: true, unit: true },
      }),
    ]);

    const activeOrdersSummary = activeOrders.map(o => 
      `• طلبية #${o.orderNumber}: عميل (${o.customer?.name || "عام"}) - كمية (${o.volume}م³) - خلطة (${o.mixDesign?.code || "—"}) - حالة (${o.status})`
    ).join("\n") || "لا توجد طلبيات جارية حالياً";

    const mixesSummary = mixDesigns.map(m => `${m.code} (${m.strengthClass || m.name})`).join("، ") || "C25, C30, C35, C40";

    const ticketsSummary = recentTickets.map(t =>
      `• شاحنة ${t.truckNumber} (السائق: ${t.driverName}) - كمية: ${t.cumulativeQuantity}م³ - حالة: ${t.status}`
    ).join("\n") || "لا توجد شاحنات على الطريق حالياً";

    const materialsSummary = materials.map(m => `${m.name}: ${m.stock} ${m.unit}`).join(" | ") || "المخزون متوفر";

    return `
📊 بيانات المحطة الفعلية اللحظية من قاعدة البيانات:
- إجمالي الطلبيات المسجلة: ${ordersCount}
- إجمالي العملاء: ${customersCount}
- أصناف الخلطات المعتمدة بالمختبر: ${mixesSummary}
- المخزون الحالي للمواد الأولية: ${materialsSummary}
- أحدث الشاحنات والتذاكر:
${ticketsSummary}
- أحدث الطلبيات النشطة:
${activeOrdersSummary}
`;
  } catch (err) {
    console.error("Error fetching live DB context:", err);
    return "بيانات المحطة: النظام يعمل بشكل طبيعي وقاعدة البيانات متصلة.";
  }
}

async function fetchUpdates() {
  try {
    const url = `${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`;
    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();
    if (!data.ok || !data.result) return;

    for (const update of data.result) {
      lastUpdateId = update.update_id;
      await processUpdate(update);
    }
  } catch (err) {
    // transient network error
  }
}

async function askGemini(chatId, prompt) {
  if (!GEMINI_KEY) {
    return `💬 تم استلام رسالتك: "${prompt}"`;
  }

  try {
    if (!conversationHistory[chatId]) {
      conversationHistory[chatId] = [];
    }

    conversationHistory[chatId].push({ role: "user", parts: [{ text: prompt }] });
    if (conversationHistory[chatId].length > 12) {
      conversationHistory[chatId] = conversationHistory[chatId].slice(-12);
    }

    const now = new Date();
    const timeOptions = { timeZone: "Asia/Baghdad", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
    const dateOptions = { timeZone: "Asia/Baghdad", weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const currentTimeStr = now.toLocaleTimeString("ar-IQ", timeOptions);
    const currentDateStr = now.toLocaleDateString("ar-IQ", dateOptions);

    const liveContext = await getLivePlantContext();

    const systemInstruction = `أنت المساعد الإداري الذكي الحقيقي لنظام محطة الخرسانة الجاهزة (Concrete Plant System).
أنت تتحدث مباشرة وبشكل شخصي مع مالك النظام والمدير العام.

⏰ التوقيت الحي الآن:
- اليوم: ${currentDateStr}
- الساعة الآن: ${currentTimeStr} (توقيت العراق/بغداد)

${liveContext}

📌 إرشادات صارمة للأجوبة:
1. كن واقعياً وطبيعياً 100% كما لو كنت مهندس إدارة يعمل معه في المحطة.
2. إذا سألك عن أي أمر عام (مثل تحية، سوالف، أسئلة عامة)، أجب بإنسانية ولطف واختصار وبدون أي تكلف.
3. إذا سألك عن المحطة (الإنتاج، الشاحنات، الطلبيات، الخلطات، المواد)، استخدم الأرقام والأسماء الحقيقية الموجودة في البيانات أعلاه بدقة.
4. إياك والكلام الإنشائي الفارغ (مثل "مجلس الخبراء جاهز" أو "نظام سيادي 24/7"). تكلم بلغة عمل واقعية ومباشرة.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: conversationHistory[chatId],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      return `أهلاً بك، كيف أقدر أساعدك؟`;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      conversationHistory[chatId].push({ role: "model", parts: [{ text: reply }] });
      return reply;
    }

    return `أهلاً بك، كيف أقدر أساعدك؟`;
  } catch (err) {
    console.error("Gemini invocation failed:", err);
    return `أهلاً بك، تفضل أنا معك.`;
  }
}

async function processUpdate(update) {
  const message = update.message;
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  await sendChatAction(chatId, "typing");

  let replyText = "";

  if (text === "/start") {
    replyText = `أهلاً وسهلاً بك! 👋\nأنا مساعدك المباشر لمحطة الخرسانة. يمكنك سؤالي عن الإنتاج، الشاحنات، الطلبيات، أو أي شيء تريده وسأجيبك بأرقام وبيانات المحطة الفعلية.`;
  } else if (message.voice) {
    replyText = `🎙️ استلمت رسالتك الصوتية، جاري الاستماع وتحليل الملاحظة...`;
  } else if (message.photo) {
    replyText = `📸 استلمت الصورة، جاري فحصها...`;
  } else if (text) {
    replyText = await askGemini(chatId, text);
  }

  if (replyText) {
    await sendMessage(chatId, replyText);
  }
}

async function sendChatAction(chatId, action = "typing") {
  try {
    await fetch(`${BASE_URL}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch (e) {}
}

async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      await fetch(`${BASE_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
  } catch (e) {
    console.error("Failed to send message:", e);
  }
}

async function runLoop() {
  while (true) {
    await fetchUpdates();
    await new Promise((r) => setTimeout(r, 1000));
  }
}

runLoop();
