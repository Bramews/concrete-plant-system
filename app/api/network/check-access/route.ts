import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSubdomain, resolveCompanyFromSubdomain } from "@/lib/subdomain";

function isLocalHostOrIP(host: string): boolean {
  if (!host) return true;
  const cleanHost = host.split(":")[0].toLowerCase();

  if (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "::1" ||
    cleanHost.endsWith(".local")
  ) {
    return true;
  }

  // Check Private IP ranges:
  // 192.168.x.x
  // 10.x.x.x
  // 172.16.x.x - 172.31.x.x
  const ipParts = cleanHost.split(".");
  if (ipParts.length === 4) {
    const p0 = parseInt(ipParts[0], 10);
    const p1 = parseInt(ipParts[1], 10);
    if (p0 === 192 && p1 === 168) return true;
    if (p0 === 10) return true;
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const {
      deviceUuid,
      companyId,
      host,
      pathname,
      guestToken,
      ipAddress,
      userAgent,
      userId,
      locationCountry,
    } = await request.json();

    // 1. Determine Connection Type (LOCAL / GLOBAL)
    const isLocal = isLocalHostOrIP(host);
    const connectionType = isLocal ? "LOCAL" : "GLOBAL";

    // 2. Resolve Company ID
    let resolvedCompanyId = companyId ? Number(companyId) : null;
    if (!resolvedCompanyId && host) {
      const subdomain = extractSubdomain(host);
      if (subdomain) {
        resolvedCompanyId = await resolveCompanyFromSubdomain(subdomain);
      }
      // If still not resolved and it's localhost (dev), fall back to the first company in DB
      if (!resolvedCompanyId && isLocal) {
        const firstCompany = await prisma.company.findFirst({
          select: { id: true },
        });
        if (firstCompany) {
          resolvedCompanyId = firstCompany.id;
        }
      }
    }

    // Helper to log access
    const logAccess = async (allowed: boolean, blockReason?: string) => {
      const isApiRequest = pathname?.startsWith("/api");
      if (!isApiRequest && resolvedCompanyId) {
        let nameToLog = "زائر غير معروف";
        let userRole = "زائر";
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: {
              name: true,
              username: true,
              memberships: {
                include: {
                  role: true,
                },
              },
            },
          });
          if (dbUser) {
            nameToLog = dbUser.name || dbUser.username;
            userRole =
              dbUser.memberships?.[0]?.role?.displayName ||
              dbUser.memberships?.[0]?.role?.name ||
              "مستخدم";
          }
        } else if (guestToken) {
          nameToLog = "ضيف مؤقت (رابط خارجي)";
          userRole = "رابط خارجي للضيوف";
        } else if (deviceUuid) {
          const device = await prisma.connectedDevice.findUnique({
            where: { deviceUuid },
            select: { name: true },
          });
          if (device) {
            nameToLog = device.name || nameToLog;
          }
        }

        // Get approximate country/location from headers
        let location = "غير معروف";
        if (isLocal) {
          location = "الشبكة الداخلية (Local)";
        } else if (locationCountry) {
          location =
            locationCountry === "IQ"
              ? "العراق (IQ)"
              : `دولي (${locationCountry})`;
        } else {
          location = "شبكة خارجية (Internet)";
        }

        const browser = cleanUserAgent(userAgent);
        const reasonDetails = JSON.stringify({
          pathname,
          userAgent,
          browser,
          location,
          deviceUuid,
          userRole,
          blockReason: blockReason || null,
        });

        await prisma.networkAccessLog.create({
          data: {
            companyId: resolvedCompanyId,
            username: nameToLog,
            ipAddress: ipAddress || "127.0.0.1",
            connectionType,
            status: allowed ? "SUCCESS" : "FAILED",
            reason: reasonDetails,
          },
        });
      }
    };

    if (!resolvedCompanyId) {
      return NextResponse.json({ allowed: true });
    }

    // 3. Fetch Network settings
    let settings = await prisma.networkHubSetting.findUnique({
      where: { companyId: resolvedCompanyId },
    });

    if (!settings) {
      settings = await prisma.networkHubSetting.create({
        data: {
          companyId: resolvedCompanyId,
          localAccessEnabled: true,
          globalAccessEnabled: false,
          startHour: "06:00",
          endHour: "18:00",
          scheduleEnabled: false,
        },
      });
    }

    // 4. Check Device Blacklist/Whitelist
    let isWhitelisted = false;
    let isReadOnly = false;

    if (deviceUuid) {
      const device = await prisma.connectedDevice.findUnique({
        where: { deviceUuid },
      });

      if (device) {
        if (device.isBlacklisted) {
          await logAccess(false, `Device Blacklisted: ${deviceUuid}`);
          return NextResponse.json({
            allowed: false,
            reason: "DEVICE_BLACKLISTED",
            reasonAr: "هذا الجهاز محظور من الوصول إلى النظام الموحد للمحطة.",
          });
        }

        isWhitelisted = device.isWhitelisted;
        isReadOnly = device.isReadOnly;

        // Update active stats
        await prisma.connectedDevice.update({
          where: { deviceUuid },
          data: {
            lastActive: new Date(),
            ipAddress: ipAddress || device.ipAddress,
            userAgent: userAgent || device.userAgent,
            userId: userId ? Number(userId) : device.userId,
            connectionType,
          },
        });
      } else {
        // Auto register new device
        let deviceType = "DESKTOP";
        if (userAgent) {
          const ua = userAgent.toLowerCase();
          if (
            ua.includes("mobi") ||
            ua.includes("android") ||
            ua.includes("iphone")
          ) {
            deviceType = "MOBILE";
          } else if (ua.includes("tablet") || ua.includes("ipad")) {
            deviceType = "TABLET";
          }
        }

        await prisma.connectedDevice.create({
          data: {
            deviceUuid,
            companyId: resolvedCompanyId,
            name: isLocal
              ? `جهاز محلي (${cleanUserAgent(userAgent)})`
              : `جهاز خارجي (${cleanUserAgent(userAgent)})`,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            connectionType,
            deviceType,
            userId: userId ? Number(userId) : null,
          },
        });
      }
    }

    // Whitelisted devices bypass all accessibility constraints
    if (isWhitelisted) {
      await logAccess(true);
      return NextResponse.json({ allowed: true, isReadOnly });
    }

    // 5. Guest Token Verification
    if (guestToken) {
      const guestLink = await prisma.guestLink.findUnique({
        where: { token: guestToken },
      });

      if (
        guestLink &&
        new Date() < guestLink.expiresAt &&
        guestLink.companyId === resolvedCompanyId
      ) {
        await logAccess(true);
        return NextResponse.json({
          allowed: true,
          isReadOnly: true,
          guestInfo: {
            allowedOrderId: guestLink.allowedOrderId,
            allowedMixId: guestLink.allowedMixId,
          },
        });
      }
    }

    // 6. Global/Local disablement check
    if (!isLocal && !settings.globalAccessEnabled) {
      await logAccess(false, "GLOBAL_ACCESS_DISABLED");
      return NextResponse.json({
        allowed: false,
        reason: "GLOBAL_ACCESS_DISABLED",
        reasonAr: "الوصول الخارجي (عبر الإنترنت) معطل حالياً من قبل الإدارة.",
      });
    }

    if (isLocal && !settings.localAccessEnabled) {
      await logAccess(false, "LOCAL_ACCESS_DISABLED");
      return NextResponse.json({
        allowed: false,
        reason: "LOCAL_ACCESS_DISABLED",
        reasonAr: "الوصول المحلي (الشبكة الداخلية) معطل حالياً من قبل الإدارة.",
      });
    }

    // 7. Working Hours Schedule Check
    if (settings.scheduleEnabled) {
      const serverTime = new Date();
      const currentHours = serverTime.getHours();
      const currentMinutes = serverTime.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      const [startH, startM] = settings.startHour.split(":").map(Number);
      const [endH, endM] = settings.endHour.split(":").map(Number);

      const startTotalMinutes = startH * 60 + (startM || 0);
      const endTotalMinutes = endH * 60 + (endM || 0);

      const isOutside =
        startTotalMinutes < endTotalMinutes
          ? currentTotalMinutes < startTotalMinutes ||
            currentTotalMinutes > endTotalMinutes
          : currentTotalMinutes < startTotalMinutes &&
            currentTotalMinutes > endTotalMinutes;

      if (isOutside) {
        await logAccess(false, "OUTSIDE_SCHEDULE");
        return NextResponse.json({
          allowed: false,
          reason: "OUTSIDE_SCHEDULE",
          reasonAr: `النظام مغلق حالياً. ساعات العمل المسموح بها من ${settings.startHour} إلى ${settings.endHour}.`,
        });
      }
    }

    await logAccess(true);
    return NextResponse.json({ allowed: true, isReadOnly });
  } catch (error: unknown) {
    console.error("Check access endpoint error:", error);
    return NextResponse.json({
      allowed: true,
      error: (error as Error).message,
    });
  }
}

function cleanUserAgent(ua?: string): string {
  if (!ua) return "غير معروف";
  if (ua.includes("Chrome")) return "Google Chrome";
  if (ua.includes("Firefox")) return "Mozilla Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari";
  if (ua.includes("Edge")) return "Microsoft Edge";
  return ua.slice(0, 20);
}
