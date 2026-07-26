import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId")
      ? Number(formData.get("companyId"))
      : 1;
    const senderName = (formData.get("senderName") as string) || "جهاز محلي";
    const scope = (formData.get("scope") as string) || "manager";
    const visibility = (formData.get("visibility") as string) || "EVERYONE";
    const targetUserIdStr = formData.get("targetUserId");
    const targetUserId = targetUserIdStr ? Number(targetUserIdStr) : null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure dir exists
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename to prevent directory traversal
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(uploadDir, safeFilename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeFilename}`;

    // Create DB record
    const share = await prisma.localFileShare.create({
      data: {
        companyId,
        scope,
        fileName: file.name,
        fileUrl,
        sizeBytes: file.size,
        creatorName: senderName,
        visibility,
        uploadedById: targetUserId,
      },
    });

    // Auto-cleanup files older than 7 days to preserve disk space
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const oldFiles = await prisma.localFileShare.findMany({
        where: {
          companyId,
          scope,
          createdAt: { lt: sevenDaysAgo },
        },
      });

      for (const oldFile of oldFiles) {
        try {
          const { unlink } = await import("fs/promises");
          const oldPath = join(process.cwd(), "public", oldFile.fileUrl);
          await unlink(oldPath);
        } catch (err) {
          // File might not exist physically
        }
      }

      await prisma.localFileShare.deleteMany({
        where: {
          companyId,
          scope,
          createdAt: { lt: sevenDaysAgo },
        },
      });
    } catch (cleanupErr) {
      console.error("Local file share cleanup error:", cleanupErr);
    }

    return NextResponse.json({ success: true, share });
  } catch (error: unknown) {
    console.error("Local file upload error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
