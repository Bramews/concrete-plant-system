import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// 1. Get Global Feature Status
export const getGlobalFeature = unstable_cache(
  async (featureId: string) => {
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    });
    return feature;
  },
  ["global_feature"],
  { tags: ["features"] },
);

// 2. Check if Company has Feature (via Plan or Direct Override)
export async function hasFeature(companyId: number, featureId: string) {
  // A. Check Global Switch
  const feature = await getGlobalFeature(featureId);
  if (!feature) return false; // Feature doesn't exist
  if (!feature.globalEnabled) return false; // Kill switch active

  // B. Check Company Override
  const companyFeature = await prisma.companyFeature.findFirst({
    // We should probably rely on 'key' matching 'id'.
    where: { companyId, key: featureId, enabled: true },
  });

  if (companyFeature) return true; // Direct enable

  // C. Check Plan Feature
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { planId: true },
  });

  if (!subscription) return false;

  const planFeature = await prisma.planFeature.findUnique({
    where: {
      planId_featureId: {
        planId: subscription.planId,
        featureId,
      },
    },
  });

  // If found in plan, check if it has a limit or just enabled?
  // Existence in PlanFeature means enabled for that plan.
  return !!planFeature;
}

// 3. Get Feature Limit (e.g. Max Users)
export async function getFeatureLimit(
  companyId: number,
  featureId: string,
): Promise<number> {
  // A. Company Override
  const companyFeature = await prisma.companyFeature.findFirst({
    where: { companyId, key: featureId, enabled: true },
  });

  // If company specific override exists, does it store limit?
  // Schema: CompanyFeature has `tier` string? Maybe add `limit` int?
  // For now return -1 (unlimited) or parse tier?
  // Let's assume no company-level specific numeric limits for now, just on/off.

  // B. Plan Limit
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { planId: true },
  });

  if (!subscription) return 0;

  const planFeature = await prisma.planFeature.findUnique({
    where: {
      planId_featureId: {
        planId: subscription.planId,
        featureId,
      },
    },
  });

  if (planFeature && planFeature.limit !== null) {
    return planFeature.limit;
  }

  if (planFeature) return Infinity; // Enabled but no limit

  return 0; // Not enabled
}
