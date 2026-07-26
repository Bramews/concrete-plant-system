import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

export type AlertSeverity = "INFO" | "WARN" | "CRITICAL";

export async function emitAlert(params: {
  companyId: number;
  metric: "USERS" | "ORDERS" | "STORAGE_MB" | "PROJECTS";
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
}) {
  // 1. Create Alert in DB
  // Uses 'category' instead of 'action' and 'message' instead of 'details' to align with existing Schema
  await prisma.systemAlert.create({
    data: {
      companyId: params.companyId,
      category: "USAGE_ALERT",
      message: params.message,
      severity: params.severity,
      metric: params.metric,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });

  // 2. Audit Log (Redundancy & Unified Log)
  await logEvent({
    action: `ALERT_${params.severity}`,
    entity: "SystemAlert",
    entityId: params.companyId,
    details: `${params.metric}: ${params.message}`,
  });
}
