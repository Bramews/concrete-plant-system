"use server";

import { getSession } from "@/lib/auth";
import { canAccessFeature, Feature } from "@/lib/saas/license";
import { getCompanyMetrics } from "@/lib/reporting/core";

export async function getExecutiveSummary() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    if (!session.companyId) {
      throw new Error(
        "No company context found. Please access via your company subdomain.",
      );
    }

    // Commercial Check: Advanced Reporting is Premium
    const access = await canAccessFeature(
      session.companyId,
      Feature.ADVANCED_REPORTING,
    );
    if (!access.allowed) {
      throw new Error(access.error); // "Feature available in PREMIUM plan only"
    }

    // Fetch Metrics
    const metrics = await getCompanyMetrics(session.companyId);

    // AI-Enhanced Summary (If safe) - We can simulate a "Business Insight" here
    // In a real app, this might call the AI engine to summarize the numbers.
    const insight =
      metrics.totalRevenue > 100000
        ? "Strong revenue performance. Consider reinvesting in fleet."
        : "Revenue signals need for increased sales activity.";

    return {
      success: true,
      data: {
        metrics,
        trends: metrics.trends,
        insight,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Executive Report Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
