// @ts-nocheck
/**
 * Aggregates all pending decisions into a unified queue with classification.
 */
export async function getDecisionQueue(
  status: "PENDING" | "IGNORED" | "RESOLVED" = "PENDING",
): Promise<DecisionItem[]> {
  let billingEvents: RawBillingEvent[] = [];
  try {
    billingEvents = await prisma.$queryRaw<RawBillingEvent[]>`
      SELECT 
        be.*, 
        s.id as sub_id, 
        c.name as company_name, 
        p.name as plan_name
      FROM BillingEvent be
      LEFT JOIN Subscription s ON be.subscriptionId = s.id
      LEFT JOIN Company c ON s.companyId = c.id
      LEFT JOIN SaaSPlan p ON s.planId = p.id
      WHERE be.status = ${status}
      ORDER BY be.timestamp DESC
    `;
  } catch (err) {
    console.error("RAW_QUERY_FALLBACK_ERR (DecisionQueue):", err);
  }

  const queue: DecisionItem[] = [];

  for (const event of billingEvents) {
    const ageInDays =
      (Date.now() - new Date(event.timestamp).getTime()) /
      (1000 * 60 * 60 * 24);
    const timeToRisk =
      event.eventType === "PAYMENT_FAILED"
        ? `${Math.max(0, Math.floor(7 - ageInDays))} days until suspension`
        : undefined;

    const metadata = (() => {
      try {
        return event.details ? JSON.parse(event.details) : {};
      } catch (e) {
        console.warn("FAILED_TO_PARSE_EVENT_DETAILS:", event.id, e);
        return { raw_details: event.details };
      }
    })();

    queue.push({
      id: event.id,
      type: "BILLING",
      category: DecisionCategory.FIN,
      severity: event.eventType === "PAYMENT_FAILED" ? "WARNING" : "INFO",
      context: `Billing for ${event.company_name || "Unknown Entity"}`,
      risk:
        event.eventType === "PAYMENT_FAILED"
          ? "Revenue loss risk."
          : "Administrative overhead.",
      impact: "Service lock pending.",
      timeToRisk,
      timestamp: new Date(event.timestamp),
      metadata,
    });
  }

  return queue;
}
