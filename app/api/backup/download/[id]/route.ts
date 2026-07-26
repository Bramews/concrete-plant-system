import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

import { protectApiRoute } from "@/lib/api-protection";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const check = await protectApiRoute(request, {
      requireAuth: true,
      allowedRoles: ["SYSTEM_OWNER"],
    });
    if (!check.allowed) return check.response!;
    const user = await getCurrentUser();
    if (!user || user.role !== "SYSTEM_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const backupId = parseInt(params.id, 10);
    if (isNaN(backupId)) {
      return new NextResponse("Invalid Backup ID", { status: 400 });
    }
    const backup = await prisma.backupRecord.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return new NextResponse("Backup not found", { status: 404 });
    }

    const filePath = path.join(process.cwd(), "backups", backup.filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File missing on disk", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${backup.filename}"`,
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
