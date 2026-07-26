import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [lockdownSetting, scopeSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "system_lockdown" } }),
      prisma.systemSetting.findUnique({ where: { key: "tunnel_scope" } }),
    ]);

    return NextResponse.json({
      isLockdown: lockdownSetting?.value === "true",
      scope: scopeSetting?.value || "FULL",
    });
  } catch (error) {
    console.error("Governance check endpoint error:", error);
    return NextResponse.json({ isLockdown: false, scope: "FULL" });
  }
}
