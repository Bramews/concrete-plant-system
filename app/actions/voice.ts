"use server";

import { getCurrentUser, requirePermission } from "@/lib/auth";
import { triggerPhysicalAlarm } from "@/app/actions/webhooks";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/ratelimit";
import { evaluate } from "mathjs";
import {
  addLocalVoiceLog,
  getLocalVoiceLogs,
  getLocalVoiceContext,
  saveLocalVoiceContext,
  VoiceContextState,
  VoiceLogEntry,
  learnCommandPattern,
  getLearnedCommand,
} from "@/lib/voice/context";

/**
 * Strips markdown code blocks wrapper from JSON replies.
 */
function cleanJsonString(str: string) {
  let clean = str.trim();
  if (clean.startsWith("```")) {
    // Remove starting ```json or ```
    clean = clean.replace(/^```[a-zA-Z]*\n?/, "");
    // Remove ending ```
    clean = clean.replace(/```$/, "");
  }
  return clean.trim();
}

/**
 * Returns default dashboard path based on the user's role.
 */
function getDashboardPathByRole(role: string): string {
  if (role === "SYSTEM_OWNER") return "/admin";
  if (
    role === "MANAGER" ||
    role === "COMPANY_ADMIN" ||
    role === "DEPARTMENT_MANAGER"
  ) {
    return "/system/manager/dashboard";
  }
  if (
    role === "LAB_MANAGER" ||
    role === "LAB_TECH" ||
    role === "LAB_ENGINEER"
  ) {
    return "/system/lab";
  }
  if (role === "OPERATOR") return "/system/operator";
  if (role === "SALES") return "/system/sales";
  if (role === "ACCOUNTANT") return "/system/accountant";
  if (role === "SAFETY") return "/system/safety";
  if (role === "GUARD") return "/system/guard";

  return "/system";
}

/**
 * Helper to verify user permissions for a specific classified system action.
 */
async function verifyActionPermission(
  action: string,
  role: string,
  params: any,
): Promise<boolean> {
  // SYSTEM_OWNER has global bypass
  if (role === "SYSTEM_OWNER") return true;
  try {
    switch (action) {
      case "CREATE_ORDER":
        await requirePermission("ORDERS_CREATE");
        break;
      case "NAVIGATE": {
        const target = params.target || "dashboard";
        if (target === "orders") await requirePermission("ORDERS_READ");
        else if (target === "materials")
          await requirePermission("INVENTORY_READ");
        else if (target === "logistics") await requirePermission("FLEET_READ");
        else if (
          target === "lab" ||
          target === "tools" ||
          target === "calculator" ||
          target === "converter" ||
          target === "maturity" ||
          target === "moisture" ||
          target === "costs"
        ) {
          if (
            ![
              "LAB_TECH",
              "LAB_ENGINEER",
              "LAB_MANAGER",
              "MANAGER",
              "COMPANY_ADMIN",
              "DEPARTMENT_MANAGER",
              "SYSTEM_OWNER",
            ].includes(role)
          ) {
            return false;
          }
        }
        break;
      }
      case "TRIGGER_ALARM":
      case "STOP_PLANT":
      case "UPDATE_SENSOR":
        // Only managers, owners, and operators can control machinery/sensors
        if (
          ![
            "MANAGER",
            "COMPANY_ADMIN",
            "DEPARTMENT_MANAGER",
            "OPERATOR",
          ].includes(role)
        ) {
          return false;
        }
        break;
      case "LOCKDOWN_NETWORK":
        // Only managers, admins and owners can perform network lockdowns
        if (!["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"].includes(role)) {
          return false;
        }
        break;
      case "GET_METRICS":
        await requirePermission("REPORTS_READ");
        break;
      case "RECORD_CUBE_RESULT":
        await requirePermission("LAB_TESTS_UPDATE");
        break;
      case "CALCULATE":
        if (
          ![
            "LAB_TECH",
            "LAB_ENGINEER",
            "LAB_MANAGER",
            "MANAGER",
            "COMPANY_ADMIN",
            "DEPARTMENT_MANAGER",
            "SYSTEM_OWNER",
          ].includes(role)
        ) {
          return false;
        }
        break;
      case "TRACK_TRUCK":
        await requirePermission("FLEET_READ");
        break;
      default:
        break;
    }
    return true;
  } catch (err) {
    console.warn(
      `Permission verification failed for action: ${action} under role: ${role}`,
      err,
    );
    return false;
  }
}
/**
 * Executes a structured internal action classified by Gemini.
 */
async function executeClassifiedAction(
  parsed: { action: string; params?: any },
  companyId: number,
  user: any,
): Promise<{
  success: boolean;
  response: string;
  orderNumber?: string;
  isAction?: boolean;
  clientAction?: any;
}> {
  const { action, params = {} } = parsed;
  // 1. Verify user permissions for this action (voice assistant boundaries)
  const hasPerm = await verifyActionPermission(action, user.role, params);
  if (!hasPerm) {
    await prisma.auditLog.create({
      data: {
        action: "VOICE_PERMISSION_DENIED",
        details: `محاولة تنفيذ أمر صوتي "${action}" بدون صلاحية. المعاملات: ${JSON.stringify(params)}`,
        entity: "VoiceAssistant",
        entityId: action,
        userId: user.id,
        companyId,
        role: user.role,
        newStatus: "DENIED",
        timestamp: new Date(),
      },
    });
    return {
      success: false,
      response: "عذراً، لا تمتلك الصلاحيات الكافية لتنفيذ هذا الإجراء الصوتي.",
    };
  }
  switch (action) {
    case "TRIGGER_ALARM":
      await triggerPhysicalAlarm(companyId, "SYSTEM_ERROR");
      return { success: true, response: "تم تشغيل جرس الإنذار." };
    case "STOP_PLANT": {
      await prisma.auditLog.create({
        data: {
          action: "VOICE_STOP_PLANT",
          details: `طلب إيقاف طارئ للمحطة عبر الأمر الصوتي من ${user.name}`,
          entity: "Plant",
          entityId: String(companyId),
          userId: user.id,
          companyId,
          role: user.role,
          newStatus: "EMERGENCY_STOP",
          timestamp: new Date(),
        },
      });
      await triggerPhysicalAlarm(companyId, "EMERGENCY_STOP");
      return {
        success: true,
        response:
          "تم إرسال أمر الإيقاف الطارئ وإخطار المدير المسؤول وتشغيل صفارة الإنذار فوراً.",
      };
    }
    case "LOCKDOWN_NETWORK": {
      await prisma.networkHubSetting.upsert({
        where: { companyId },
        create: {
          companyId,
          localAccessEnabled: false,
          globalAccessEnabled: false,
        },
        update: {
          localAccessEnabled: false,
          globalAccessEnabled: false,
        },
      });
      await prisma.auditLog.create({
        data: {
          action: "VOICE_LOCKDOWN_NETWORK",
          details: `تم تفعيل حالة الإغلاق الطارئ للشبكة بأمر صوتي من ${user.name}`,
          entity: "Network",
          entityId: String(companyId),
          userId: user.id,
          companyId,
          role: user.role,
          newStatus: "LOCKDOWN",
          timestamp: new Date(),
        },
      });
      await triggerPhysicalAlarm(companyId, "EMERGENCY_STOP");
      const { sseEmitter } = await import("@/lib/network/emitter");
      sseEmitter.emit("broadcast", {
        type: "EVENT",
        companyId,
        event: "KICK_DEVICE",
        data: { deviceUuid: "ALL" },
        timestamp: new Date().toISOString(),
      });
      return {
        success: true,
        response:
          "تم تفعيل حالة الإغلاق الطارئ للشبكة بنجاح. تم قطع جميع الاتصالات وحظر الأجهزة الخارجية والداخلية وتشغيل جرس الإنذار فوراً.",
        isAction: true,
        clientAction: {
          type: "REFRESH",
        },
      };
    }
    case "CREATE_ORDER": {
      try {
        const { enforceSubscription } = await import("@/lib/subscriptions");
        const { enforceLimit } = await import("@/lib/enforcement");
        await enforceSubscription(companyId);
        const decision = await enforceLimit(companyId, "ORDERS", 1);
        if (!decision.allowed) {
          return {
            success: false,
            response: `عذراً، ${decision.reason || "تم تجاوز الحد المسموح من الطلبيات."}`,
          };
        }
      } catch (subErr: unknown) {
        return {
          success: false,
          response: `عذراً، ${(subErr as Error).message || "الاشتراك منتهي أو معلق."}`,
        };
      }
      const customerName = params.customer;
      const volume = parseFloat(params.quantity);
      const mixDesignCode = params.mix;
      if (!customerName || isNaN(volume) || volume <= 0 || !mixDesignCode) {
        return {
          success: false,
          response: "يرجى تحديد اسم العميل والكمية المطلوبة ورمز الخلطة.",
        };
      }
      // Find the Mix Design for this company
      const mix = await prisma.mixDesign.findFirst({
        where: {
          companyId,
          deletedAt: null,
          status: "APPROVED",
          OR: [
            { code: { contains: mixDesignCode } },
            { name: { contains: mixDesignCode } },
          ],
        },
      });
      if (!mix) {
        return {
          success: false,
          response: `الخلطة المطلوبة "${mixDesignCode}" غير موجودة في قاعدة البيانات.`,
        };
      }
      // Upsert Customer
      let customer = await prisma.customer.findFirst({
        where: { companyId, name: customerName, deletedAt: null },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            companyId,
            name: customerName,
          },
        });
      }
      // Create Draft Order
      const orderNumber = `ORD-V-${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          orderNumber,
          companyId,
          customerId: customer.id,
          mixDesignId: mix.id,
          volume,
          date: new Date(),
          status: "DRAFT",
          createdById: user.id,
          creatorName: user.name,
        },
      });
      // Log Event
      await logEvent({
        action: "CREATE",
        entity: "Order",
        entityId: order.id,
        newStatus: "DRAFT",
        details: `طلب صوتي مسودة رقم ${orderNumber} للعميل "${customerName}" بحجم ${volume} م³ خلطة ${mix.code}`,
      });
      revalidatePath("/system/orders");
      revalidatePath("/system/sales/orders");
      return {
        success: true,
        response: `تم تسجيل طلب العميل "${customerName}" بكمية ${volume} متر مكعب خلطة ${mix.code}. رقم الطلب: ${orderNumber}.`,
        orderNumber,
        isAction: true,
      };
    }
    case "NAVIGATE": {
      const target = params.target || "dashboard";
      let path = "/system";
      if (target === "dashboard") {
        path = getDashboardPathByRole(user.role);
      } else {
        const paths: Record<string, string> = {
          orders: "/system/orders",
          materials: "/system/operator/material-status",
          logistics: "/system/logistics",
          settings: "/system/settings/profile",
          lab: "/system/lab",
          mix_designs: "/system/lab/mix-designs",
          tools: "/system/lab/tools",
          calculator: "/system/lab/tools?tab=calculator",
          converter: "/system/lab/tools?tab=converter",
          maturity: "/system/lab/tools?tab=maturity",
          moisture: "/system/lab/tools?tab=aggregates",
          costs: "/system/lab/tools?tab=costs",
        };
        path = paths[target] || "/system";
      }
      const targetNames: Record<string, string> = {
        dashboard: "لوحة التحكم الرئيسية",
        orders: "صفحة الطلبات",
        materials: "مراقبة المواد والصوامع",
        logistics: "تتبع أسطول النقل",
        settings: "إعدادات الملف الشخصي",
        lab: "صفحة المختبر",
        mix_designs: "تصاميم الخلطات",
        tools: "صفحة الأدوات",
        calculator: "الحاسبة الهندسية",
        converter: "محول الوحدات",
        maturity: "حساب نضج الخرسانة",
        moisture: "قياس الرطوبة والركام",
        costs: "حساب التكاليف المباشرة",
      };
      return {
        success: true,
        response: `جاري الانتقال إلى ${targetNames[target] || "الصفحة المطلوبة"}.`,
        clientAction: {
          type: "NAVIGATE",
          target: path,
        },
      };
    }
    case "GET_METRICS": {
      const moduleName = params.module || "GLOBAL";
      const metrics = await getVoiceMetrics(moduleName);
      return {
        success: metrics.success,
        response: metrics.text,
      };
    }
    case "TOGGLE_SIDEBAR":
      return {
        success: true,
        response: "جاري التحكم بالقائمة الجانبية.",
        clientAction: {
          type: "TOGGLE_SIDEBAR",
        },
      };
    case "REFRESH":
      return {
        success: true,
        response: "جاري تحديث البيانات اللحظية.",
        clientAction: {
          type: "REFRESH",
        },
      };
    case "RECORD_CUBE_RESULT": {
      const orderRef = params.orderRef || params.customer || params.orderNumber;
      const mpa = parseFloat(params.mpa || params.quantity);
      const age = parseInt(params.age || params.mix || "7");
      if (!orderRef || isNaN(mpa) || mpa <= 0) {
        return {
          success: false,
          response: "يرجى تحديد رقم الطلبية وقيمة فحص الكسر.",
        };
      }
      // Find the order
      const order = await prisma.order.findFirst({
        where: {
          companyId,
          OR: [
            { orderNumber: { contains: orderRef } },
            { orderNumber: orderRef },
          ],
        },
        include: {
          mixDesign: true,
        },
      });
      if (!order) {
        return {
          success: false,
          response: `الطلبية رقم "${orderRef}" غير مسجلة.`,
        };
      }
      // Find or create a CubeTest for this order and age
      let cubeTest = await prisma.cubeTest.findFirst({
        where: {
          companyId,
          orderId: order.id,
          age,
        },
      });
      // Target strength from MixDesign
      let targetStrength = 30;
      if (order.mixDesign?.strengthClass) {
        const match = order.mixDesign.strengthClass.match(/\d+/);
        if (match) targetStrength = parseInt(match[0]);
      } else if (order.mixDesign?.grade) {
        const match = order.mixDesign.grade.match(/\d+/);
        if (match) targetStrength = parseInt(match[0]);
      }
      const resultStatus = mpa >= targetStrength ? "PASS" : "FAIL";
      if (cubeTest) {
        cubeTest = await prisma.cubeTest.update({
          where: { id: cubeTest.id },
          data: {
            mpa,
            result: resultStatus,
            status: "APPROVED",
            approverName: user.name,
            approvedById: user.id,
          },
        });
      } else {
        cubeTest = await prisma.cubeTest.create({
          data: {
            companyId,
            orderId: order.id,
            sampleDate: new Date(),
            age,
            mpa,
            result: resultStatus,
            status: "APPROVED",
            creatorName: user.name,
            approverName: user.name,
            approvedById: user.id,
          },
        });
      }
      // Revalidate paths
      revalidatePath("/system/lab");
      revalidatePath("/system/lab/cube-results");
      return {
        success: true,
        response: `تم تسجيل نتيجة الكسر للطلبية ${order.orderNumber} بقيمة ${mpa} ميجا باسكال (الحد المطلوب: ${targetStrength} MPa). النتيجة: ${resultStatus === "PASS" ? "مطابقة ✓" : "غير مطابقة ✗"}.`,
        isAction: true,
      };
    }
    case "TRACK_TRUCK": {
      const truckNumber =
        params.customer || params.target || params.truckNumber;
      if (!truckNumber) {
        return {
          success: false,
          response: "يرجى تحديد رقم الشاحنة أو اسم السائق.",
        };
      }
      return {
        success: true,
        response: `جاري تتبع الشاحنة رقم ${truckNumber}.`,
        clientAction: {
          type: "TRACK_TRUCK",
          truckNumber,
        },
      };
    }
    case "UPDATE_SENSOR": {
      const sensorName = params.sensorName || params.customer;
      const value = params.value || params.quantity;
      if (!sensorName || value === undefined || value === null) {
        return {
          success: false,
          response: "يرجى تحديد اسم الحساس وقيمة الضبط.",
        };
      }
      // Log to AuditLog for audit trail
      await prisma.auditLog.create({
        data: {
          action: "VOICE_SENSOR_UPDATE",
          details: `تم تحديث الحساس: ${sensorName} إلى قيمة: ${value} عبر التحكم الصوتي`,
          entity: "Sensor",
          entityId: String(sensorName),
          userId: user.id,
          companyId,
          role: user.role,
          newStatus: "SUCCESS",
          timestamp: new Date(),
        },
      });
      return {
        success: true,
        response: `تم تحديث الحساس ${sensorName} إلى القيمة ${value}.`,
      };
    }
    case "CALCULATE": {
      const expression = params.expression;
      if (!expression) {
        return { success: false, response: "يرجى تحديد العملية الحسابية." };
      }
      try {
        // mathjs is completely safe - it doesn't execute code, only parses math expressions
        const result = evaluate(expression);
        if (typeof result !== "number" || !isFinite(result)) {
          return {
            success: false,
            response: "العملية الحسابية تنتج قيمة غير صالحة.",
          };
        }
        return {
          success: true,
          response: `ناتج العملية هو: ${result}.`,
          clientAction: {
            type: "NAVIGATE",
            target: `/system/lab/tools?tab=calculator&input=${encodeURIComponent(expression)}&result=${encodeURIComponent(result)}`,
          },
        };
      } catch (err) {
        return { success: false, response: "صيغة رياضية غير صحيحة." };
      }
    }
    default:
      return {
        success: false,
        response: "عذراً، لم أستطع تحديد الإجراء الداخلي المطلوب.",
      };
  }
}
/**
 * Smarter Arabic/English mathematical expression extractor.
 * Converts words like "زائد", "ناقص", "ضرب", "تقسيم" and Arabic numbers to symbols.
 */
function parseArabicMathExpression(command: string): string | null {
  let text = command
    .toLowerCase()
    .trim()
    .replace(/[.?!،؟\s]+$/, "")
    .trim();
  // Replace Arabic digits with English digits
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  for (let i = 0; i < 10; i++) {
    text = text.replaceAll(arabicDigits[i], String(i));
  }
  // Replace word numbers with digits
  const wordNumbers: Record<string, string> = {
    صفر: "0",
    واحد: "1",
    اثنين: "2",
    إثنين: "2",
    ثلاثة: "3",
    ثلاثه: "3",
    اربعة: "4",
    أربعة: "4",
    اربعه: "4",
    أربعه: "4",
    خمسة: "5",
    خمسه: "5",
    ستة: "6",
    سته: "6",
    سبعة: "7",
    سبعه: "7",
    ثمانية: "8",
    ثمانيه: "8",
    تسعة: "9",
    تسعه: "9",
    عشرة: "10",
    عشره: "10",
  };
  for (const [word, num] of Object.entries(wordNumbers)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "g"), num);
  }
  // Replace operations words with symbols
  text = text.replace(/\b(?:زائد|جمع|وزد|مضافا\s+إليه|مضافاً\s+إليه)\b/g, "+");
  text = text.replace(/\b(?:ناقص|طرح|مطروحا\s+منه|مطروحاً\s+منه)\b/g, "-");
  text = text.replace(/\b(?:ضرب|في|مضروبا\s+في|مضروباً\s+في)\b/g, "*");
  text = text.replace(
    /\b(?:تقسيم|قسمة|على|مقسوما\s+على|مقسوماً\s+على)\b/g,
    "/",
  );
  text = text.replace(/\s+و\s+/g, " + ");
  // Extract contiguous mathematical expression
  const mathRegex = /([0-9]+(?:\s*[+\-*/()]\s*[0-9]+)+)/g;
  const matches = text.match(mathRegex);
  if (matches && matches.length > 0) {
    return matches.reduce((a, b) => (a.length > b.length ? a : b)).trim();
  }
  const simpleMathRegex = /[0-9+\-*/().\s]{3,}/g;
  const simpleMatches = text.match(simpleMathRegex);
  if (simpleMatches) {
    for (const m of simpleMatches) {
      const clean = m.trim();
      if (/[0-9]/.test(clean) && /[+\-*/]/.test(clean)) {
        return clean.replace(/^[+\-*/()]+|[+\-*/()]+$/g, "").trim();
      }
    }
  }
  return null;
}
/**
 * Main command processor that runs on the server.
 * Handles database operations like order creation, metric queries, and alarms.
 */
export async function processVoiceCommand(command: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, response: "الرجاء تسجيل الدخول أولاً" };
    }
    const companyId = user.companyId;
    if (!companyId) {
      return { success: false, response: "المستخدم الحالي غير مرتبط بشركة." };
    }
    // Rate Limiting: 10 commands per minute
    const rl = await checkRateLimit(`voice_${user.id}`, 10, 60);
    if (!rl.allowed) {
      return {
        success: false,
        response: "يرجى الانتظار قليلاً قبل إرسال أمر جديد.",
      };
    }
    const cleanCmd = command
      .toLowerCase()
      .trim()
      .replace(/[.?!،؟\s]+$/, "")
      .trim();
    // 1. Check system-wide Voice Assistant setting
    const systemVoiceSetting = await prisma.systemSetting.findUnique({
      where: { key: "voice_assistant_enabled" },
    });
    if (systemVoiceSetting && systemVoiceSetting.value === "false") {
      return {
        success: false,
        response:
          "عذراً، تم تعطيل المساعد الصوتي على مستوى النظام بالكامل من قبل مسؤول النظام.",
      };
    }
    // 2. Check company-specific Voice Assistant setting
    const companyVoiceSetting = await prisma.companySetting.findUnique({
      where: {
        companyId_key: {
          companyId,
          key: "voice_assistant_enabled",
        },
      },
    });
    if (companyVoiceSetting && companyVoiceSetting.value === "false") {
      return {
        success: false,
        response:
          "عذراً، المساعد الصوتي غير مفعل لشركتكم حالياً. يرجى التواصل مع مسؤول النظام للتفعيل.",
      };
    }
    // 2.5. Check Local Self-Learning Offline Cache (Offline-First self-contained execution)
    const learnedCommand = getLearnedCommand(command);
    if (learnedCommand) {
      if (learnedCommand.responseText) {
        return { success: true, response: learnedCommand.responseText };
      } else if (learnedCommand.action) {
        const actionResult = await executeClassifiedAction(
          learnedCommand,
          companyId,
          user,
        );
        return actionResult;
      }
    }
    // 2.7. Run Local Offline Checks First (Offline-First Priority)
    let fallbackAction: { action: string; params?: any } | null = null;
    // Smarter calculation extraction
    const parsedMathExpr = parseArabicMathExpression(command);
    if (parsedMathExpr) {
      fallbackAction = {
        action: "CALCULATE",
        params: {
          expression: parsedMathExpr,
        },
      };
    } else if (
      cleanCmd.includes("شغل جهاز الانذار") ||
      cleanCmd.includes("انذار") ||
      cleanCmd.includes("تنبيه") ||
      cleanCmd.includes("alarm")
    ) {
      fallbackAction = { action: "TRIGGER_ALARM", params: {} };
    } else if (
      cleanCmd.includes("ايقاف المحطة") ||
      cleanCmd.includes("وقف المحطة") ||
      cleanCmd.includes("stop plant")
    ) {
      fallbackAction = { action: "STOP_PLANT", params: {} };
    } else if (
      cleanCmd.includes("إغلاق الشبكة") ||
      cleanCmd.includes("أغلق الشبكة") ||
      cleanCmd.includes("اغلاق الشبكة") ||
      cleanCmd.includes("اغلق الشبكة") ||
      cleanCmd.includes("حالة الطوارئ") ||
      cleanCmd.includes("lockdown network")
    ) {
      fallbackAction = { action: "LOCKDOWN_NETWORK", params: {} };
    } else if (
      cleanCmd.includes("الرئيسية") ||
      cleanCmd.includes("لوحة التحكم") ||
      cleanCmd.includes("الداشبورد") ||
      cleanCmd.includes("dashboard")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "dashboard" } };
    } else if (
      cleanCmd.includes("الطلبات") ||
      cleanCmd.includes("صفحة الطلبات") ||
      cleanCmd.includes("orders")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "orders" } };
    } else if (
      cleanCmd.includes("المواد") ||
      cleanCmd.includes("الصوامع") ||
      cleanCmd.includes("materials")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "materials" } };
    } else if (
      cleanCmd.includes("المختبر") ||
      cleanCmd.includes("صفحة المختبر") ||
      cleanCmd.includes("lab")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "lab" } };
    } else if (
      cleanCmd.includes("تصاميم الخلطات") ||
      cleanCmd.includes("تصاميم الخلطه") ||
      cleanCmd.includes("خلطات") ||
      cleanCmd.includes("mix designs") ||
      cleanCmd.includes("mixes")
    ) {
      fallbackAction = {
        action: "NAVIGATE",
        params: { target: "mix_designs" },
      };
    } else if (
      cleanCmd.includes("الأسطول") ||
      cleanCmd.includes("السيارات") ||
      cleanCmd.includes("لوجستيات") ||
      cleanCmd.includes("logistics")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "logistics" } };
    } else if (
      cleanCmd.includes("الملف الشخصي") ||
      cleanCmd.includes("الإعدادات") ||
      cleanCmd.includes("settings")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "settings" } };
    } else if (
      cleanCmd.includes("الحاسبة") ||
      cleanCmd.includes("حاسبة") ||
      cleanCmd.includes("calculator")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "calculator" } };
    } else if (
      cleanCmd.includes("محول") ||
      cleanCmd.includes("التحويل") ||
      cleanCmd.includes("converter")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "converter" } };
    } else if (
      cleanCmd.includes("النضج") ||
      cleanCmd.includes("نضوج") ||
      cleanCmd.includes("maturity")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "maturity" } };
    } else if (
      cleanCmd.includes("الرطوبة") ||
      cleanCmd.includes("رطوبة") ||
      cleanCmd.includes("moisture")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "moisture" } };
    } else if (
      cleanCmd.includes("التكاليف") ||
      cleanCmd.includes("الكلفة") ||
      cleanCmd.includes("تكاليف") ||
      cleanCmd.includes("costs")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "costs" } };
    } else if (
      cleanCmd.includes("الادوات") ||
      cleanCmd.includes("الأدوات") ||
      cleanCmd.includes("tools")
    ) {
      fallbackAction = { action: "NAVIGATE", params: { target: "tools" } };
    } else {
      // 1. CREATE_ORDER Pattern Match (Using (.+?) to capture compound names)
      const orderPatternAr =
        /(?:انشئ طلب|طلب جديد|إنشاء طلب)\s+(?:للعميل|عميل)\s+(.+?)\s+(?:بكمية|كمية|حجم|متر)\s+(\d+(?:\.\d+)?)\s+(?:خلطة|خلطه|بخلطة)\s+([^\s]+)/i;
      const orderPatternEn =
        /(?:create order|new order|create draft order)\s+(?:for)\s+([^\s]+)\s+(?:with quantity|quantity|volume|qty)?\s+(\d+(?:\.\d+)?)\s+(?:mix|mix design)\s+([^\s]+)/i;
      const orderMatch =
        command.match(orderPatternAr) || command.match(orderPatternEn);
      // 2. RECORD_CUBE_RESULT Pattern Match
      const cubePattern =
        /(?:سجل نتيجة|تسجيل نتيجة|نتيجة كسر|كسر مكعب|فحص كسر)\s+(?:للطلب|طلبية|طلب|مكعب)\s+([^\s]+)\s+(?:بقيمة|قيمة|قوة|بنتيجة)\s+(\d+(?:\.\d+)?)/i;
      const cubeMatch = command.match(cubePattern);
      // 3. TRACK_TRUCK Pattern Match
      const trackPattern =
        /(?:تتبع الشاحنة|تتبع شاحنة|تتبع سيارة|تتبع)\s+([^\s]+)/i;
      const trackMatch = command.match(trackPattern);
      // 4. UPDATE_SENSOR Pattern Match
      const sensorPattern =
        /(?:ضبط حساس|ضبط|حساس|تعديل حساس)\s+([^\s]+)\s+(?:على|بقيمة|إلى|الى)\s+(\d+(?:\.\d+)?)/i;
      const sensorMatch = command.match(sensorPattern);
      // 5. GET_METRICS Check
      const isMetrics =
        cleanCmd.includes("وضع") ||
        cleanCmd.includes("تقرير") ||
        cleanCmd.includes("مؤشرات") ||
        cleanCmd.includes("كم");
      // 6. LOCKDOWN_NETWORK Check
      const isLockdown =
        cleanCmd.includes("إغلاق الشبكة") ||
        cleanCmd.includes("اغلاق الشبكة") ||
        cleanCmd.includes("حظر الشبكة") ||
        cleanCmd.includes("تفعيل الطوارئ") ||
        cleanCmd.includes("lockdown");

      if (orderMatch) {
        fallbackAction = {
          action: "CREATE_ORDER",
          params: {
            customer: orderMatch[1],
            quantity: parseFloat(orderMatch[2]),
            mix: orderMatch[3],
          },
        };
      } else if (isLockdown) {
        fallbackAction = {
          action: "LOCKDOWN_NETWORK",
          params: {},
        };
      } else if (cubeMatch) {
        fallbackAction = {
          action: "RECORD_CUBE_RESULT",
          params: {
            orderRef: cubeMatch[1],
            mpa: parseFloat(cubeMatch[2]),
          },
        };
      } else if (trackMatch) {
        fallbackAction = {
          action: "TRACK_TRUCK",
          params: {
            truckNumber: trackMatch[1],
          },
        };
      } else if (sensorMatch) {
        fallbackAction = {
          action: "UPDATE_SENSOR",
          params: {
            sensorName: sensorMatch[1],
            value: parseFloat(sensorMatch[2]),
          },
        };
      } else if (isMetrics) {
        let moduleName = "GLOBAL";
        if (
          cleanCmd.includes("مختبر") ||
          cleanCmd.includes("فحص") ||
          cleanCmd.includes("lab")
        ) {
          moduleName = "LAB";
        } else if (
          cleanCmd.includes("مالية") ||
          cleanCmd.includes("حسابات") ||
          cleanCmd.includes("finance")
        ) {
          moduleName = "FINANCE";
        }
        fallbackAction = {
          action: "GET_METRICS",
          params: { module: moduleName },
        };
      }
    }
    if (fallbackAction) {
      const actionResult = await executeClassifiedAction(
        fallbackAction,
        companyId,
        user,
      );
      if (actionResult.success) {
        learnCommandPattern(
          command,
          actionResult.response,
          true,
          fallbackAction,
        );
      }
      return actionResult;
    }
    // Fetch current system stats/counts for this company as context for Gemini
    let statsContext = "";
    try {
      const mixDesignsCount = await prisma.mixDesign.count({
        where: { companyId, deletedAt: null },
      });
      const activeOrdersCount = await prisma.order.count({
        where: { companyId, NOT: { status: "COMPLETED" } },
      });
      const customersCount = await prisma.customer.count({
        where: { companyId, deletedAt: null },
      });
      const pendingCubesCount = await prisma.cubeTest.count({
        where: { companyId, status: "PENDING" },
      });
      const approvedCubesCount = await prisma.cubeTest.count({
        where: { companyId, status: "APPROVED" },
      });
      const totalSieveCount = await prisma.sieveAnalysis.count({
        where: { companyId },
      });
      statsContext = `
معلومات سياقية لحظية عن المحطة والبيانات الحالية في قاعدة البيانات لشركة المستخدم:
- عدد تصاميم الخلطات (Mix Designs) المتوفرة حالياً في النظام: ${mixDesignsCount}
- عدد الطلبيات النشطة (غير المكتملة): ${activeOrdersCount}
- عدد العملاء المسجلين: ${customersCount}
- عدد عينات فحص مكعبات الخرسانة بانتظار الفحص (المعلقة): ${pendingCubesCount}
- عدد عينات فحص مكعبات الخرسانة المعتمدة: ${approvedCubesCount}
- إجمالي عدد تحاليل المنخل (Sieve Analysis) المسجلة: ${totalSieveCount}
الرجاء استخدام هذه الإحصائيات الفورية للإجابة بدقة بالغة عندما يسألك المستخدم أي سؤال عن الأعداد أو كم عدد الخلطات/الطلبات/العملاء/الفحوصات المتوفرة حالياً.
ملاحظة هامة جداً: الأسئلة المباشرة عن الإحصائيات والأرقام المذكورة أعلاه (مثل: "كم خلطة لدينا؟" أو "كم عميل مسجل؟" أو "كم طلب نشط؟") يجب الإجابة عنها مباشرة بنص عادي مستعيناً بالمعلومات المذكورة أعلاه (مثال: "لدينا حالياً ${mixDesignsCount} تصاميم خلطات متوفرة في النظام")، ولا تعتبرها فعلاً داخلياً ولا تقم بإخراج كود JSON لهذه الأسئلة الإحصائية الإجابة عنها بالنص العادي مباشرة.
`;
    } catch (statsErr) {
      console.error(
        "Failed to gather system stats for voice assistant context:",
        statsErr,
      );
    }
    // 3. Smart Classification to Gemini (AI Agent Brain)
    let geminiKey = process.env.GEMINI_API_KEY;
    const dbKeySetting = await prisma.systemSetting.findUnique({
      where: { key: "gemini_api_key" },
    });
    if (dbKeySetting?.value) {
      geminiKey = dbKeySetting.value;
    }
    // Fetch current model setting with fallback
    const modelSetting = await prisma.systemSetting.findUnique({
      where: { key: "gemini_model" },
    });
    const geminiModel = modelSetting?.value || "gemini-2.0-flash";
    let geminiFailed = false;
    let geminiErrorMsg = "";
    if (geminiKey && geminiKey.trim() !== "") {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `أنت العقل المدبر ومساعد الذكاء الاصطناعي لنظام إدارة محطة خرسانية (Concrete Plant System).
تحذير حاسم وقاطع: يُمنع منعاً باتاً، وتحت أي ظرف من الظروف، استخدام أي ألقاب ترحيبية أو ودية أو ألقاب مناداة للمستخدم مثل "يا طيب"، "يا صديقي"، "باشمهندس"، "مهندس"، "المهندس"، "أستاذ"، أو أي لقب تفخيم أو تقريب مشابه. خاطب المستخدم بصيغة مباشرة خالية تماماً من هذه العبارات.
قم بتحليل الأمر الصوتي التالي للمستخدم: "${command}"
وحدد ما إذا كان يمثل طلباً لإجراء فعل داخلي في النظام (Internal System Action) أم مجرد سؤال/ترحيب عام (General Query/Greeting).
${statsContext}
إذا كان الأمر يمثل فعلاً داخلياً في النظام، يجب أن تكون استجابتك عبارة عن كود JSON فقط ولا شيء غيره بالصيغة التالية:
{
  "action": "CREATE_ORDER" | "NAVIGATE" | "TRIGGER_ALARM" | "STOP_PLANT" | "GET_METRICS" | "TOGGLE_SIDEBAR" | "REFRESH" | "RECORD_CUBE_RESULT" | "TRACK_TRUCK" | "UPDATE_SENSOR" | "CALCULATE" | "LOCKDOWN_NETWORK",
  "params": {
    "customer": "اسم العميل (للطلبيات الجديدة فقط)",
    "quantity": "الكمية بالمتر المكعب (للطلبيات الجديدة فقط)",
    "mix": "رمز الخلطة (للطلبيات الجديدة فقط)",
    "orderRef": "رقم الطلبية أو مرجعها (لفحوصات المختبر)",
    "mpa": "قيمة قوة الضغط بالميجا باسكال (لفحوصات المختبر)",
    "age": "عمر الفحص بالأيام: 7 أو 28 أو 14 (لفحوصات المختبر)",
    "sensorName": "اسم الحساس المراد ضبطه",
    "value": "القيمة الرقمية للحساس",
    "target": "اسم الصفحة للتنقل",
    "module": "القسم للاستعلام",
    "expression": "العملية الحسابية"
  }
}
أمثلة للأفعال الداخلية:
- "سجل نتيجة فحص المكعب للطلب 123 بقيمة 35 ميجا" -> {"action": "RECORD_CUBE_RESULT", "params": {"orderRef": "123", "mpa": 35, "age": 7}}
- "عرض شاحنة رقم 55 على الخريطة" أو "تتبع سيارة 55" -> {"action": "TRACK_TRUCK", "params": {"truckNumber": "55"}}
- "ضبط درجة حرارة خلاط المياه على 22 درجة" -> {"action": "UPDATE_SENSOR", "params": {"sensorName": "درجة حرارة خلاط المياه", "value": 22}}
- "انشئ طلب للعميل أحمد بكمية 50 خلطة C35" -> {"action": "CREATE_ORDER", "params": {"customer": "أحمد", "quantity": 50, "mix": "C35"}}
- "افتح صفحة الطلبات" أو "اذهب للرئيسية" أو "وريني المختبر" -> {"action": "NAVIGATE", "params": {"target": "orders" | "dashboard" | "lab"}}
- "افتح الأدوات" أو "انتقل للأدوات" -> {"action": "NAVIGATE", "params": {"target": "tools"}}
- "افتح الحاسبة" أو "اذهب للحاسبة" -> {"action": "NAVIGATE", "params": {"target": "calculator"}}
- "احسب 5 + 5" أو "اجمع 5 مع 5 واستخرج الناتج" -> {"action": "CALCULATE", "params": {"expression": "5 + 5"}}
- "شغل الإنذار" أو "فعل التنبيه" -> {"action": "TRIGGER_ALARM", "params": {}}
- "وقف المحطة" أو "إيقاف الطوارئ" -> {"action": "STOP_PLANT", "params": {}}
- "إغلاق الشبكة" أو "تفعيل حالة الطوارئ" أو "إغلاق الطوارئ" -> {"action": "LOCKDOWN_NETWORK", "params": {}}
- "كيف وضع المختبر" أو "تقرير المالية" أو "كم الإنتاج اليوم" -> {"action": "GET_METRICS", "params": {"module": "LAB" | "FINANCE" | "GLOBAL"}}
- "إخفاء القائمة" أو "تصغير الشاشة الجانبية" -> {"action": "TOGGLE_SIDEBAR", "params": {}}
- "تحديث البيانات" أو "حدث الصفحة" -> {"action": "REFRESH", "params": {}}
إذا كان الأمر مجرد ترحيب عام أو سؤال خارجي غير متعلق بإجراءات النظام المباشرة (مثل: "مساء الخير"، "كيف حالك"، "أهلاً بك")، فأجب عليه مباشرة وبشكل طبيعي جداً ومفهوم ومباشر. تجنب الجمود تماماً، وكن ودوداً ومنطقياً ومهذباً للغاية.
تنبيه نهائي صارم: يُمنع منعاً باتاً مناداة المستخدم بـ "يا طيب" أو "يا صديقي" أو "باشمهندس" أو "مهندس" أو "المهندس" أو أي ألقاب أو صفات مشابهة. لا تستخدم صيغة JSON أبداً في هذه الحالة، بل رد بنص عادي مباشر باللغة العربية الفصحى الودودة والواضحة والخالية من المصطلحات الأجنبية والرموز لتبسيط قراءتها صوتياً للمستخدم، ولا تتجاوز سطرين).`,
                    },
                  ],
                },
              ],
            }),
          },
        );
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const rawReply =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const reply = cleanJsonString(rawReply);
          if (reply.startsWith("{") && reply.endsWith("}")) {
            try {
              const parsed = JSON.parse(reply);
              if (parsed.action) {
                const actionResult = await executeClassifiedAction(
                  parsed,
                  companyId,
                  user,
                );
                if (actionResult.success) {
                  learnCommandPattern(
                    command,
                    actionResult.response,
                    true,
                    parsed,
                  );
                }
                return actionResult;
              }
            } catch (jsonErr) {
              console.error(
                "Failed to parse Gemini classification JSON:",
                jsonErr,
                "Reply was:",
                reply,
              );
            }
          }
          if (rawReply.trim() !== "") {
            const finalReply = rawReply.trim();
            // تعلّم فقط الردود النصية الإيجابية
            const isPositiveReply =
              !finalReply.includes("عذراً") &&
              !finalReply.includes("لا أستطيع") &&
              !finalReply.includes("خطأ") &&
              !finalReply.includes("فشل");
            if (isPositiveReply) {
              learnCommandPattern(command, finalReply, true, {
                responseText: finalReply,
              });
            }
            return { success: true, response: finalReply };
          }
        } else {
          const errData = await geminiRes.json().catch(() => ({}));
          console.error("Gemini API Error status:", geminiRes.status, errData);
          geminiFailed = true;
          if (
            geminiRes.status === 400 ||
            geminiRes.status === 403 ||
            geminiRes.status === 401
          ) {
            geminiErrorMsg =
              "عذراً، مفتاح الذكاء الاصطناعي (Gemini API Key) المخزن غير صالح أو منتهي الصلاحية.";
          } else {
            geminiErrorMsg = `عذراً، خادم Gemini API أرجع خطأ برقم (${geminiRes.status}).`;
          }
        }
      } catch (geminiError: unknown) {
        console.error("Gemini API call failed:", geminiError);
        geminiFailed = true;
        geminiErrorMsg =
          "عذراً، فشل الاتصال بخوادم الذكاء الاصطناعي (تحقق من اتصال الإنترنت).";
      }
    } else if (!geminiKey || geminiKey.trim() === "") {
      geminiFailed = true;
      geminiErrorMsg =
        "عذراً، مفتاح الذكاء الاصطناعي (Gemini API Key) غير مهيأ في الإعدادات.";
    }
    if (geminiFailed) {
      return {
        success: false,
        response:
          geminiErrorMsg ||
          "عذراً، اتصال الإنترنت غير مستقر أو مقطوع حالياً، ولم يتم برمجة هذا الأمر مسبقاً للتشغيل دون اتصال.",
      };
    }
    return {
      success: true,
      response:
        "تم استلام الأمر، ولكن لا يوجد إجراء مبرمج له حالياً أو انقطع الاتصال بالذكاء الاصطناعي.",
    };
  } catch (error: unknown) {
    console.error("Voice command error:", error);
    return {
      success: false,
      response: "حدث خطأ غير متوقع أثناء معالجة طلبك الصوتي.",
    };
  }
}
/**
 * Logs a voice command to local timeline JSON log file.
 */
export async function saveVoiceLogAction(
  command: string,
  response: string,
  success: boolean,
  characterId: string,
  language: string,
) {
  try {
    addLocalVoiceLog({
      command,
      response,
      success,
      characterId,
      language,
    });
    // Save to Database AuditLog for tenant usage tracking
    const user = await getCurrentUser();
    if (user && user.companyId) {
      await prisma.auditLog.create({
        data: {
          action: "VOICE_COMMAND",
          details: `أمر صوتي: "${command}" | الرد: "${response}" | الشخصية: ${characterId}`,
          entity: "VoiceAssistant",
          entityId: characterId,
          userId: user.id,
          companyId: user.companyId,
          role: user.role,
          newStatus: success ? "SUCCESS" : "FAILED",
          timestamp: new Date(),
        },
      });
    }
    return { success: true };
  } catch (err) {
    console.error("Failed to save voice log action:", err);
    return { success: false };
  }
}
/**
 * Retrieves last 100 local voice logs.
 */
export async function getVoiceLogsAction() {
  try {
    const logs = getLocalVoiceLogs();
    // Sort descending by timestamp (newest first)
    return {
      success: true,
      logs: logs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    };
  } catch (err) {
    console.error("Failed to fetch voice logs action:", err);
    return { success: false, logs: [] as VoiceLogEntry[] };
  }
}
/**
 * Fetches voice context config.
 */
export async function getVoiceContextAction() {
  try {
    const context = getLocalVoiceContext();
    return { success: true, context };
  } catch (err) {
    console.error("Failed to read voice context action:", err);
    return { success: false, context: null };
  }
}
/**
 * Saves/updates voice context config.
 */
export async function saveVoiceContextAction(
  state: Partial<VoiceContextState>,
) {
  try {
    const ok = saveLocalVoiceContext(state);
    return { success: ok };
  } catch (err) {
    console.error("Failed to save voice context action:", err);
    return { success: false };
  }
}
/**
 * Standard voice report queries for specific dashboard contexts.
 */
export async function getVoiceMetrics(module: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return {
        success: false,
        text: "لم يتم العثور على صلاحيات الشركة للمستخدم الحالي.",
      };
    }
    const companyId = user.companyId;
    if (module === "LAB") {
      const pendingCubes = await prisma.cubeTest.count({
        where: { companyId, status: "PENDING" },
      });
      const approvedCubes = await prisma.cubeTest.count({
        where: { companyId, status: "APPROVED" },
      });
      const totalSieve = await prisma.sieveAnalysis.count({
        where: { companyId },
      });
      return {
        success: true,
        text: `تقرير المختبر: ${pendingCubes} عينات معلقة، ${approvedCubes} عينات معتمدة، ${totalSieve} تحليل منخلي.`,
      };
    } else if (module === "FINANCE") {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: { companyId, NOT: { status: "PAID" } },
        select: { amount: true },
      });
      const unpaidCount = unpaidInvoices.length;
      const unpaidSum = unpaidInvoices.reduce(
        (sum, inv) => sum + inv.amount,
        0,
      );
      const paidInvoices = await prisma.invoice.count({
        where: { companyId, status: "PAID" },
      });
      return {
        success: true,
        text: `ملخص التقرير المالي: ${unpaidCount} فواتير غير مدفوعة بقيمة ${unpaidSum.toLocaleString()}، و ${paidInvoices} فواتير مدفوعة.`,
      };
    } else if (module === "GLOBAL") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const batches = await prisma.batch.findMany({
        where: {
          companyId,
          createdAt: { gte: startOfToday },
        },
        select: { quantity: true },
      });
      const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
      const batchCount = batches.length;
      const activeOrders = await prisma.order.count({
        where: {
          companyId,
          status: { in: ["PRODUCTION", "LAB_APPROVED"] },
        },
      });
      return {
        success: true,
        text: `تقرير الإنتاج اليومي: تم إنتاج ${totalQuantity.toLocaleString()} متر مكعب عبر ${batchCount} خلطة، وهناك ${activeOrders} طلبيات نشطة.`,
      };
    }
    return { success: false, text: "المقطع الصوتي غير معروف." };
  } catch (error: unknown) {
    console.error("Voice metrics error:", error);
    return {
      success: false,
      text: "حدث خطأ غير متوقع أثناء إعداد التقرير الصوتي.",
    };
  }
}
// evaluateMathExpression has been replaced with mathjs evaluate
