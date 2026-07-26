import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("=== تصحيح المستخدمين المعلقة ===");

    // 1. Find PENDING users
    const pendingUsers = await prisma.user.findMany({
      where: { status: "PENDING" },
      select: { id: true, username: true, email: true },
    });

    console.log(`وجدت ${pendingUsers.length} مستخدمين معلقين`);

    // 2. Update to ACTIVE
    const updateResult = await prisma.user.updateMany({
      where: { status: "PENDING" },
      data: { status: "ACTIVE" },
    });

    console.log(`تم تحديث ${updateResult.count} مستخدم`);

    // 3. Verify
    const stillPending = await prisma.user.count({
      where: { status: "PENDING" },
    });

    // 4. Get status summary
    const allStatuses = await prisma.user.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    return NextResponse.json({
      success: true,
      message: `تم تحديث ${updateResult.count} مستخدم من PENDING إلى ACTIVE`,
      details: {
        previouslyPending: pendingUsers,
        updatedCount: updateResult.count,
        stillPendingCount: stillPending,
        statusSummary: allStatuses.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("خطأ في تصحيح المستخدمين:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
