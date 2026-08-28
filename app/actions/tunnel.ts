"use server";

import { spawn, execSync } from "child_process";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

export interface TunnelStatusResult {
  success: boolean;
  isActive: boolean;
  url: string;
  status: string;
  error?: string;
  scheduleEnabled?: boolean;
  scheduleStart?: string;
  scheduleStop?: string;
  scope?: string;
  tunnelToken?: string;
  tunnelCustomDomain?: string;
}

export interface TunnelActionResult {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

export interface LogEntry {
  event: string;
  timestamp: string;
}

// Symbol to prevent key clashes in global object
const globalSymbols = Symbol.for("neon.tunnelProcess");
const globalProcessMap = (global as any)[globalSymbols] || { process: null };
(global as any)[globalSymbols] = globalProcessMap;
// Check if cloudflared process is actually running in the OS
function isCloudflaredRunning() {
  try {
    const stdout = execSync('tasklist /fi "imagename eq cloudflared.exe"', {
      encoding: "utf8",
    });
    return stdout.toLowerCase().includes("cloudflared.exe");
  } catch (err) {
    return false;
  }
}
// Find active tunnel URL from the AI agent's task log files
function findActiveTunnelUrlFromLogs(): { url: string; time: number } | null {
  const baseDir = "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain";
  if (!fs.existsSync(baseDir)) return null;
  try {
    const conversations = fs.readdirSync(baseDir);
    const allMatches: { url: string; time: number }[] = [];
    for (const conv of conversations) {
      const taskDir = path.join(baseDir, conv, ".system_generated", "tasks");
      if (fs.existsSync(taskDir)) {
        const logs = fs.readdirSync(taskDir).filter((f) => f.endsWith(".log"));
        for (const file of logs) {
          const filePath = path.join(taskDir, file);
          try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, "utf8");
            const match = content.match(
              /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i,
            );
            if (match) {
              allMatches.push({ url: match[0], time: stats.mtime.getTime() });
            }
          } catch (e) {
            console.error("[النفق] خطأ في قراءة ملف سجل النفق:", e);
          }
        }
      }
    }
    if (allMatches.length > 0) {
      allMatches.sort((a, b) => b.time - a.time);
      return allMatches[0];
    }
  } catch (err) {
    console.error("Error finding tunnel URL from logs:", err);
  }
  return null;
}
export async function appendTunnelLog(event: string): Promise<void> {
  try {
    const logSetting = await prisma.systemSetting.findUnique({
      where: { key: "tunnel_log" },
    });
    let logs: LogEntry[] = [];
    if (logSetting?.value) {
      try {
        logs = JSON.parse(logSetting.value);
      } catch (e) {
        logs = [];
      }
    }
    // Newest first
    logs.unshift({ event, timestamp: new Date().toISOString() });
    // Keep only last 50
    logs = logs.slice(0, 50);
    await prisma.systemSetting.upsert({
      where: { key: "tunnel_log" },
      update: { value: JSON.stringify(logs) },
      create: { key: "tunnel_log", value: JSON.stringify(logs) },
    });
  } catch (err) {
    console.error("Failed to append tunnel log:", err);
  }
}
export async function getTunnelLog(): Promise<LogEntry[]> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return [];
  }
  try {
    const logSetting = await prisma.systemSetting.findUnique({
      where: { key: "tunnel_log" },
    });
    if (logSetting?.value) {
      return JSON.parse(logSetting.value) as LogEntry[];
    }
  } catch (err) {
    console.error("Failed to get tunnel log:", err);
  }
  return [];
}
export async function getTunnelStatus(): Promise<TunnelStatusResult> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return {
      success: false,
      isActive: false,
      url: "",
      status: "INACTIVE",
      error: "NOT_AUTHENTICATED",
    };
  }
  const processRunning = isCloudflaredRunning();
  const [
    statusSetting,
    urlSetting,
    schedStart,
    schedStop,
    schedEnabled,
    scopeSetting,
    tokenSetting,
    domainSetting,
  ] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "tunnel_status" } }),
    prisma.systemSetting.findUnique({ where: { key: "tunnel_active_url" } }),
    prisma.systemSetting.findUnique({
      where: { key: "tunnel_schedule_start" },
    }),
    prisma.systemSetting.findUnique({ where: { key: "tunnel_schedule_stop" } }),
    prisma.systemSetting.findUnique({
      where: { key: "tunnel_schedule_enabled" },
    }),
    prisma.systemSetting.findUnique({ where: { key: "tunnel_scope" } }),
    prisma.systemSetting.findUnique({ where: { key: "tunnel_token" } }),
    prisma.systemSetting.findUnique({ where: { key: "tunnel_custom_domain" } }),
  ]);
  let status = statusSetting?.value || "INACTIVE";
  let url = urlSetting?.value || "";
  // Schedule Check
  const now = new Date();
  const currentStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (schedEnabled?.value === "true" && schedStart?.value && schedStop?.value) {
    const isInside =
      currentStr >= schedStart.value && currentStr <= schedStop.value;
    if (isInside && !processRunning && status === "INACTIVE") {
      await appendTunnelLog("الجدولة التلقائية: بدء تشغيل نفق البث");
      startTunnel(scopeSetting?.value || "FULL").catch((err) =>
        console.error("Auto-start tunnel failed:", err),
      );
      status = "STARTING";
    } else if (
      !isInside &&
      processRunning &&
      (status === "ACTIVE" || status === "STARTING")
    ) {
      await appendTunnelLog(
        "الجدولة التلقائية: إيقاف تشغيل نفق البث (خارج الموعد)",
      );
      stopTunnel().catch((err) =>
        console.error("Auto-stop tunnel failed:", err),
      );
      status = "INACTIVE";
      url = "";
    }
  }
  // If running in OS but database says otherwise, synchronize with reality
  if (processRunning && status !== "STARTING") {
    status = "ACTIVE";
    const logInfo = findActiveTunnelUrlFromLogs();
    if (logInfo) {
      const dbUrlUpdatedAt = urlSetting?.updatedAt
        ? new Date(urlSetting.updatedAt).getTime()
        : 0;
      if (!url || logInfo.time > dbUrlUpdatedAt) {
        url = logInfo.url;
        await prisma.systemSetting.upsert({
          where: { key: "tunnel_active_url" },
          update: { value: url },
          create: { key: "tunnel_active_url", value: url },
        });
      }
    }
    if (
      statusSetting?.value !== "ACTIVE" &&
      statusSetting?.value !== "STARTING"
    ) {
      await prisma.systemSetting.upsert({
        where: { key: "tunnel_status" },
        update: { value: "ACTIVE" },
        create: { key: "tunnel_status", value: "ACTIVE" },
      });
    }
  } else if (!processRunning && status === "ACTIVE") {
    status = "INACTIVE";
    url = "";
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "tunnel_status" },
        update: { value: "INACTIVE" },
        create: { key: "tunnel_status", value: "INACTIVE" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_active_url" },
        update: { value: "" },
        create: { key: "tunnel_active_url", value: "" },
      }),
    ]);
  }
  return {
    success: true,
    isActive: processRunning,
    url,
    status,
    scheduleEnabled: schedEnabled?.value === "true",
    scheduleStart: schedStart?.value || "09:00",
    scheduleStop: schedStop?.value || "17:00",
    scope: scopeSetting?.value || "FULL",
    tunnelToken: tokenSetting?.value || "",
    tunnelCustomDomain: domainSetting?.value || "",
  };
}
export async function startTunnel(scope = "FULL"): Promise<TunnelActionResult> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }
  await appendTunnelLog(
    `بدء طلب تشغيل نفق البث بنطاق: ${scope === "FULL" ? "الوصول الكامل" : "مخصص لعميل"}`,
  );
  if (isCloudflaredRunning()) {
    const statusRes = await getTunnelStatus();
    await prisma.systemSetting.upsert({
      where: { key: "tunnel_scope" },
      update: { value: scope },
      create: { key: "tunnel_scope", value: scope },
    });
    return { success: true, url: statusRes.url };
  }
  try {
    const tokenSetting = await prisma.systemSetting.findUnique({
      where: { key: "tunnel_token" },
    });
    const domainSetting = await prisma.systemSetting.findUnique({
      where: { key: "tunnel_custom_domain" },
    });

    if (tokenSetting?.value) {
      // 1. Run Named Tunnel via Custom Token
      await Promise.all([
        prisma.systemSetting.upsert({
          where: { key: "tunnel_status" },
          update: { value: "STARTING" },
          create: { key: "tunnel_status", value: "STARTING" },
        }),
        prisma.systemSetting.upsert({
          where: { key: "tunnel_active_url" },
          update: { value: "" },
          create: { key: "tunnel_active_url", value: "" },
        }),
        prisma.systemSetting.upsert({
          where: { key: "tunnel_scope" },
          update: { value: scope },
          create: { key: "tunnel_scope", value: scope },
        }),
      ]);

      const child = spawn(
        "d:\\concrete-plant-system\\cloudflared.exe",
        ["tunnel", "run", "--token", tokenSetting.value],
        { detached: true },
      );
      globalProcessMap.process = child;

      let activeUrl = domainSetting?.value || "نفق مخصص نشط";
      if (
        activeUrl &&
        activeUrl !== "نفق مخصص نشط" &&
        !activeUrl.startsWith("http")
      ) {
        activeUrl = `https://${activeUrl}`;
      }

      await Promise.all([
        prisma.systemSetting.upsert({
          where: { key: "tunnel_active_url" },
          update: { value: activeUrl },
          create: { key: "tunnel_active_url", value: activeUrl },
        }),
        prisma.systemSetting.upsert({
          where: { key: "tunnel_status" },
          update: { value: "ACTIVE" },
          create: { key: "tunnel_status", value: "ACTIVE" },
        }),
        appendTunnelLog(`تم تشغيل النفق المخصص بنجاح بنطاق: ${activeUrl}`),
      ]);

      child.on("close", async () => {
        globalProcessMap.process = null;
        await Promise.all([
          prisma.systemSetting.upsert({
            where: { key: "tunnel_status" },
            update: { value: "INACTIVE" },
            create: { key: "tunnel_status", value: "INACTIVE" },
          }),
          prisma.systemSetting.upsert({
            where: { key: "tunnel_active_url" },
            update: { value: "" },
            create: { key: "tunnel_active_url", value: "" },
          }),
          appendTunnelLog("تم إغلاق نفق البث المخصص (عملية OS)"),
        ]);
      });

      revalidatePath("/admin/settings/system");
      return { success: true, url: activeUrl };
    }

    // 2. Run Quick Tunnel (Default)
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "tunnel_status" },
        update: { value: "STARTING" },
        create: { key: "tunnel_status", value: "STARTING" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_active_url" },
        update: { value: "" },
        create: { key: "tunnel_active_url", value: "" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_scope" },
        update: { value: scope },
        create: { key: "tunnel_scope", value: scope },
      }),
    ]);
    const child = spawn(
      "d:\\concrete-plant-system\\cloudflared.exe",
      ["--protocol", "http2", "tunnel", "--url", "http://127.0.0.1:3000"],
      { detached: true },
    );
    globalProcessMap.process = child;
    child.stderr.on("data", async (data) => {
      const output = data.toString();
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) {
        const url = match[0];
        await Promise.all([
          prisma.systemSetting.upsert({
            where: { key: "tunnel_active_url" },
            update: { value: url },
            create: { key: "tunnel_active_url", value: url },
          }),
          prisma.systemSetting.upsert({
            where: { key: "tunnel_status" },
            update: { value: "ACTIVE" },
            create: { key: "tunnel_status", value: "ACTIVE" },
          }),
          appendTunnelLog(`تم إنشاء رابط نفق البث بنجاح: ${url}`),
        ]);
      }
    });
    child.on("close", async () => {
      globalProcessMap.process = null;
      await Promise.all([
        prisma.systemSetting.upsert({
          where: { key: "tunnel_status" },
          update: { value: "INACTIVE" },
          create: { key: "tunnel_status", value: "INACTIVE" },
        }),
        prisma.systemSetting.upsert({
          where: { key: "tunnel_active_url" },
          update: { value: "" },
          create: { key: "tunnel_active_url", value: "" },
        }),
        appendTunnelLog("تم إغلاق نفق البث (عملية OS)"),
      ]);
    });
    // Wait up to 6 seconds for connection URL extraction
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const status = await prisma.systemSetting.findUnique({
        where: { key: "tunnel_status" },
      });
      if (status?.value === "ACTIVE") {
        const urlSetting = await prisma.systemSetting.findUnique({
          where: { key: "tunnel_active_url" },
        });
        revalidatePath("/admin/settings/system");
        return { success: true, url: urlSetting?.value || "" };
      }
    }
    return { success: true, url: "", message: "جاري توليد الرابط في الخلفية" };
  } catch (error: unknown) {
    console.error("Failed to start tunnel:", error);
    globalProcessMap.process = null;
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "tunnel_status" },
        update: { value: "INACTIVE" },
        create: { key: "tunnel_status", value: "INACTIVE" },
      }),
      appendTunnelLog(
        `فشل تشغيل نفق البث: ${(error as Error).message || "خطأ غير معروف"}`,
      ),
    ]);
    return {
      success: false,
      error: (error as Error).message || "فشل تشغيل النفق",
    };
  }
}
export async function stopTunnel(): Promise<TunnelActionResult> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }
  await appendTunnelLog("طلب إيقاف تشغيل نفق البث");
  try {
    // Kill all cloudflared processes running in the OS to guarantee complete stop
    if (process.platform === "win32") {
      try {
        execSync("taskkill /f /im cloudflared.exe");
      } catch (e) {
        console.error("[النفق] لم يتم العثور على عملية cloudflared لإيقافها على Windows:", e);
      }
    } else {
      try {
        execSync("killall cloudflared");
      } catch (e) {
        console.error("[النفق] لم يتم العثور على عملية cloudflared لإيقافها على Linux/Mac:", e);
      }
    }
    globalProcessMap.process = null;
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "tunnel_status" },
        update: { value: "INACTIVE" },
        create: { key: "tunnel_status", value: "INACTIVE" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_active_url" },
        update: { value: "" },
        create: { key: "tunnel_active_url", value: "" },
      }),
      appendTunnelLog("تم إيقاف تشغيل نفق البث بنجاح"),
    ]);
    revalidatePath("/admin/settings/system");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to stop tunnel:", error);
    await appendTunnelLog(
      `فشل إيقاف تشغيل نفق البث: ${(error as Error).message}`,
    );
    return {
      success: false,
      error: (error as Error).message || "فشل إيقاف النفق",
    };
  }
}
export async function saveTunnelSchedule(
  start: string,
  stop: string,
  enabled: boolean,
): Promise<TunnelActionResult> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }
  try {
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "tunnel_schedule_start" },
        update: { value: start },
        create: { key: "tunnel_schedule_start", value: start },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_schedule_stop" },
        update: { value: stop },
        create: { key: "tunnel_schedule_stop", value: stop },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_schedule_enabled" },
        update: { value: enabled ? "true" : "false" },
        create: {
          key: "tunnel_schedule_enabled",
          value: enabled ? "true" : "false",
        },
      }),
    ]);
    await appendTunnelLog(
      `تم تحديث جدول تشغيل النفق: ${enabled ? "مفعّل" : "معطّل"} (${start} - ${stop})`,
    );
    revalidatePath("/admin/settings/system");
    return { success: true };
  } catch (error: unknown) {
    await appendTunnelLog(
      `فشل تحديث جدول تشغيل النفق: ${(error as Error).message}`,
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function getNetworkAccessLogs() {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return [];
  }
  try {
    const logs = await prisma.networkAccessLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 40,
    });
    return logs;
  } catch (err) {
    console.error("Failed to get network access logs:", err);
    return [];
  }
}

export async function saveCustomTunnelSettings(token: string, domain: string) {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }
  try {
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: "tunnel_token" },
        update: { value: token },
        create: { key: "tunnel_token", value: token },
      }),
      prisma.systemSetting.upsert({
        where: { key: "tunnel_custom_domain" },
        update: { value: domain },
        create: { key: "tunnel_custom_domain", value: domain },
      }),
    ]);
    revalidatePath("/admin/settings/system");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getActiveDevices() {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return [];
  }
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const devices = await prisma.connectedDevice.findMany({
      where: {
        lastActive: { gte: twoMinutesAgo },
      },
      orderBy: { lastActive: "desc" },
    });

    const userIds = devices
      .map((d) => d.userId)
      .filter((id): id is number => id !== null);
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              name: true,
              username: true,
              memberships: {
                include: {
                  role: true,
                },
              },
            },
          })
        : [];

    const mapped = devices.map((device) => {
      const user = users.find((u) => u.id === device.userId);
      const roleName =
        user?.memberships?.[0]?.role?.displayName ||
        user?.memberships?.[0]?.role?.name ||
        "زائر";
      return {
        ...device,
        username:
          user?.name || user?.username || device.name || "زائر غير معروف",
        roleName,
      };
    });

    return mapped;
  } catch (err) {
    console.error("Failed to get active devices:", err);
    return [];
  }
}
