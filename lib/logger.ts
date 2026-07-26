import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";
import { notifyAdmins } from "./notifications";

export async function triggerAlert(
  severity: "INFO" | "WARNING" | "CRITICAL",
  message: string,
  correlationId?: string,
) {
  // Phase 3 Clause 2.1: Immediate alerts for failures/latency
  await prisma.systemAlert.create({
    data: { severity, message, correlationId },
  });

  if (severity === "CRITICAL") {
    await notifyAdmins(`[CRITICAL ALERT] ${message}`, correlationId);
  }

  console.error(`[ALERT][${severity}] ${message}`);
}

export async function saveMetric(
  metricName: string,
  value: number,
  details?: string,
) {
  // Phase 3 Clause 1.1: Trace system health and latency
  await prisma.systemMetric.create({
    data: { metricName, value, details },
  });
}

export async function logEvent({
  action,
  entity,
  entityId,
  prevStatus,
  newStatus,
  details,
  correlationId,
  requestId,
  startTime,
  userId: userIdOverride,
}: {
  action: string;
  entity: string;
  entityId: string | number;
  prevStatus?: string;
  newStatus?: string;
  details?: string;
  correlationId?: string;
  requestId?: string;
  startTime?: number;
  userId?: number;
}) {
  const user = await getCurrentUser();
  const userId = userIdOverride || user?.id || 1; // Fallback to system user if no session
  const role = user?.role || "OPERATOR";
  const durationMs = startTime ? Math.round(Date.now() - startTime) : undefined;

  // Record AuditLog
  await prisma.auditLog.create({
    data: {
      userId: userId,
      role,
      action,
      entity,
      entityId: entityId.toString(),
      prevStatus,
      newStatus,
      details,
      correlationId,
      requestId,
      durationMs,
    },
  });

  // Phase 3 Clause 1.2: Metrics for every critical operation
  if (durationMs !== undefined) {
    await saveMetric(`${action}_LATENCY`, durationMs, `${entity} ${entityId}`);

    // Phase 3 Clause 5.1/2.1: Alert on SLA violation (e.g. > 2s)
    if (durationMs > 2000) {
      await triggerAlert(
        "WARNING",
        `SLA Violation: ${action} on ${entity} ${entityId} took ${durationMs}ms`,
        correlationId,
      );
    }
  }

  // Phase 3 Clause 2.1: Alert on critical failures
  if (action.includes("FAILED") || action.includes("REJECTED")) {
    await triggerAlert(
      "CRITICAL",
      `Failure Event: ${action} on ${entity} ${entityId}. Details: ${details}`,
      correlationId,
    );
  }
}
