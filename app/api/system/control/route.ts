import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { getSession } from "@/lib/auth";
import { protectApiRoute } from "@/lib/api-protection";

export async function POST(request: NextRequest) {
  // 1. Server-side security check
  const check = await protectApiRoute(request, {
    requireAuth: true,
    allowedRoles: ["SYSTEM_OWNER"],
  });
  if (!check.allowed) return check.response!;

  const session = await getSession();

  if (!session || session.role !== "SYSTEM_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { action } = await request.json();

  try {
    switch (action) {
      case "shutdown":
        // Kill the Node process (Windows local dev)
        // taskkill /F /IM node.exe /T
        exec("taskkill /F /IM node.exe /T", (error) => {
          if (error) console.error("Shutdown error:", error);
        });
        return NextResponse.json({
          success: true,
          message: "System shutting down...",
        });

      case "restart":
        // Restart via PM2 or other manager
        exec("pm2 restart all", (error) => {
          if (error) console.error("Restart error:", error);
        });
        return NextResponse.json({
          success: true,
          message: "System restarting...",
        });

      case "clear-cache":
        // Force clean npm cache and next cache if possible
        exec("npm cache clean --force", (error) => {
          if (error) console.error("Cache clean error:", error);
        });
        return NextResponse.json({
          success: true,
          message: "Cache cleaned successfully",
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Command execution failed" },
      { status: 500 },
    );
  }
}
