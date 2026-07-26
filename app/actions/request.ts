import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { checkIdempotency, saveIdempotency } from "@/lib/locks";
import { revalidatePath } from "next/cache";

const RequestSchema = z.object({
  type: z.enum(["PURCHASE", "MAINTENANCE", "SAFETY", "OTHER"]),
  details: z.string().min(10),
  requestId: z.string().min(1),
});

export async function createRequest(formData: FormData) {
  const startTime = Date.now();
  await requireRole([
    "OPERATOR",
    "LAB_TECH",
    "DISPATCHER",
    "ACCOUNTANT",
    "MANAGER",
  ]);

  const data = RequestSchema.parse({
    type: formData.get("type") as any,
    details: formData.get("details") as string,
    requestId: formData.get("requestId") as string,
  });

  const existing = await checkIdempotency(data.requestId);
  if (existing) return;

  try {
    const user = await getCurrentUser();
    if (!user?.companyId) throw new Error("Unauthorized");

    await prisma.request.create({
      data: {
        companyId: user.companyId, // Ensure schema has this! If not, we might fail.
        // If schema misses companyId, we are strictly dependent on requesterId link?
        // But for SAFETY, we should inject companyId.
        // If schema doesn't have it, we can't secure it easily without schema change.
        // Assuming we rely on requesterId -> User -> Company for now if schema fails.
        // But implementation plan says "Bind Request to Company".
        // Let's try adding it. If it fails, we know schema needs update.
        type: data.type,
        details: data.details,
        requesterId: user.id,
        status: "PENDING",
      },
    });

    await logEvent({
      action: "REQUEST_CREATED",
      entity: "Request",
      entityId: 0, // No ID yet for newly created
      requestId: data.requestId,
      startTime,
      details: `Created ${data.type} request.`,
    });

    await saveIdempotency(data.requestId, { success: true });
    revalidatePath("/requests");
  } catch (error: any) {
    throw new Error(`Request creation failure: ${error.message}`);
  }
}

export async function processRequest(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const requestId = parseInt(formData.get("id") as string);
  const action = formData.get("action") as string; // APPROVE or REJECT
  const note = formData.get("note") as string;
  const idempotencyId = formData.get("requestId") as string;

  const existing = await checkIdempotency(idempotencyId);
  if (existing) return;

  try {
    const user = await getCurrentUser();
    if (!user?.companyId) throw new Error("Unauthorized");

    const result = await prisma.request.updateMany({
      where: {
        id: requestId,
        companyId: user.companyId, // Security check
      },
      data: {
        status: action === "APPROVE" ? "PM_APPROVED" : "REJECTED",
        managerNote: note,
      },
    });

    if (result.count === 0)
      throw new Error("Request not found or access denied");

    await logEvent({
      action: `REQUEST_${action}`,
      entity: "Request",
      entityId: requestId,
      requestId: idempotencyId,
      startTime,
      details: `Request ${action.toLowerCase()}d by authority.`,
    });

    await saveIdempotency(idempotencyId, { success: true });
    revalidatePath("/requests");
  } catch (error: any) {
    throw new Error(`Request processing failure: ${error.message}`);
  }
}
