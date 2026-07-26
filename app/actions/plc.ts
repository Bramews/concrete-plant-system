"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPlcSettings() {
  const user = await getCurrentUser();
  if (!user?.companyId) return null;

  let settings = await prisma.plcSetting.findUnique({
    where: { companyId: user.companyId },
  });

  if (!settings) {
    settings = await prisma.plcSetting.create({
      data: {
        companyId: user.companyId,
        autoMode: true,
        moistureOffset: 0.0,
        tolerancePercent: 2.0,
        customButtons: JSON.stringify([
          {
            id: "flush_water",
            label: "غسيل مائي للخلّاط",
            color: "blue",
            action: "FLUSH",
            pinNumber: 1,
          },
          {
            id: "add_admixture",
            label: "ضخ إضافات فائقة",
            color: "purple",
            action: "INJECT_ADMIXTURE",
            pinNumber: 2,
          },
          {
            id: "vibrate_silo",
            label: "هزاز السايلو",
            color: "amber",
            action: "VIBRATE_SILO",
            pinNumber: 3,
          },
          {
            id: "air_compressor",
            label: "كمبريسور الهواء",
            color: "cyan",
            action: "AIR_COMPRESSOR",
            pinNumber: 4,
          },
          {
            id: "vibrate_hopper",
            label: "هزاز القوامع والحصى",
            color: "emerald",
            action: "VIBRATE_HOPPER",
            pinNumber: 5,
          },
        ]),
        customSensors: JSON.stringify([
          {
            id: "fly_ash_silo",
            name: "سايلو الفلاي آش (Fly Ash)",
            targetKg: 50,
            actualKg: 0,
            unit: "kg",
            pinNumber: 101,
          },
          {
            id: "ice_doser",
            name: "مغذّي الثلج (Ice Doser)",
            targetKg: 20,
            actualKg: 0,
            unit: "kg",
            pinNumber: 102,
          },
        ]),
      },
    });
  }

  return settings;
}

export async function updatePlcSettings(data: {
  autoMode?: boolean;
  moistureOffset?: number;
  tolerancePercent?: number;
  customButtons?: string;
  customSensors?: string;
  orderId?: number;
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const currentSettings = await getPlcSettings();
  if (!currentSettings) throw new Error("Settings not found");

  const isModeSwitching =
    data.autoMode !== undefined && data.autoMode !== currentSettings.autoMode;

  const updated = await prisma.plcSetting.update({
    where: { companyId: user.companyId },
    data: {
      autoMode:
        data.autoMode !== undefined ? data.autoMode : currentSettings.autoMode,
      moistureOffset:
        data.moistureOffset !== undefined
          ? data.moistureOffset
          : currentSettings.moistureOffset,
      tolerancePercent:
        data.tolerancePercent !== undefined
          ? data.tolerancePercent
          : currentSettings.tolerancePercent,
      customButtons:
        data.customButtons !== undefined
          ? data.customButtons
          : currentSettings.customButtons,
      customSensors:
        data.customSensors !== undefined
          ? data.customSensors
          : currentSettings.customSensors,
    },
  });

  // Log Mode Switch or Moisture Offset change in Audit Log for Order Reports
  if (isModeSwitching || data.moistureOffset !== undefined) {
    const actionText = isModeSwitching
      ? `تحويل نمط التشغيل إلى [${data.autoMode ? "أوتوماتيكي آلي" : "يدوي Manual Override"}]`
      : `تعديل نسبة تعويض الرطوبة المائية إلى [${data.moistureOffset}%]`;

    await prisma.auditLog.create({
      data: {
        action: "PLC_MODE_SWITCH",
        details: `${actionText}. المشغل: ${user.name || user.username}.`,
        entity: "Order",
        entityId: String(data.orderId || 0),
        companyId: user.companyId,
        userId: user.id,
        role:
          typeof user.role === "string"
            ? user.role
            : (user.role as any)?.name || "OPERATOR",
        timestamp: new Date(),
      },
    });
  }

  revalidatePath("/system/operator/cockpit");
  return updated;
}

export async function sendPlcSignal(data: {
  pinNumber: number | string;
  actionName: string;
  state: "ON" | "OFF" | "PULSE";
  orderId?: number;
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  // Log hardware signal dispatch in Audit Log
  await prisma.auditLog.create({
    data: {
      action: "PLC_HARDWARE_SIGNAL",
      details: `إرسال إشارة هاردوير إلى الـ PLC | المخرج/الـ Pin: [${data.pinNumber}] | الإجراء: [${data.actionName}] | الحالة: [${data.state}]. المشغل: ${user.name || user.username}.`,
      entity: "PlcSetting",
      entityId: String(user.companyId),
      companyId: user.companyId,
      userId: user.id,
      role:
        typeof user.role === "string"
          ? user.role
          : (user.role as any)?.name || "OPERATOR",
      timestamp: new Date(),
    },
  });

  return {
    success: true,
    pinNumber: data.pinNumber,
    state: data.state,
    timestamp: new Date().toISOString(),
  };
}

export async function scanAndConnectPlcHardware(brandCode?: string) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const { autoDiscoverUniversalPlc, SUPPORTED_PLC_BRANDS } = await import(
    "@/lib/plc/universal-discovery"
  );
  const discoveredDevices = await autoDiscoverUniversalPlc();

  const selectedDevice = brandCode
    ? discoveredDevices.find((d) => d.brand === brandCode) ||
      discoveredDevices[0]
    : discoveredDevices[0];

  const updatedSettings = await prisma.plcSetting.update({
    where: { companyId: user.companyId },
    data: {
      discoveredBrand: selectedDevice.brandName,
      detectedIp: selectedDevice.ip,
      detectedPort: selectedDevice.port,
      activeProtocol: selectedDevice.protocol,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "PLC_AUTO_DISCOVERY",
      details: `تم الكشف عن جهاز الـ PLC المباشر لـ [${selectedDevice.brandName}] على عنوان الـ IP [${selectedDevice.ip}:${selectedDevice.port}] ببروتوكول [${selectedDevice.protocol}].`,
      entity: "PlcSetting",
      entityId: String(user.companyId),
      companyId: user.companyId,
      userId: user.id,
      role:
        typeof user.role === "string"
          ? user.role
          : (user.role as any)?.name || "OPERATOR",
      timestamp: new Date(),
    },
  });

  revalidatePath("/system/operator/cockpit");

  return {
    success: true,
    device: selectedDevice,
    settings: updatedSettings,
    allDiscovered: discoveredDevices,
    supportedBrands: SUPPORTED_PLC_BRANDS,
  };
}
