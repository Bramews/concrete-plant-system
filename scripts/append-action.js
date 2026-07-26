const fs = require("fs");
const path = require("path");

const filePath = path.join(
  "d:\\concrete-plant-system\\app\\actions\\user-management.ts",
);

const codeToAppend = `
export async function toggleUserStatus(userId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const actor = await getAuditActor();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { error: "User not found." };

    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    // Update User Status
    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "USER_STATUS_TOGGLE",
        details: \`Changed account status for user \${userId} to \${newStatus}\`,
        entity: "User",
        entityId: userId,
        companyId: user.companyId || undefined,
        prevStatus: user.status,
        newStatus: newStatus,
        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role as string,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/users");
    return { success: true, newStatus };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { error: "Failed to toggle user status." };
  }
}
`;

fs.appendFileSync(filePath, codeToAppend);
console.log("Appended toggleUserStatus to user-management.ts");
