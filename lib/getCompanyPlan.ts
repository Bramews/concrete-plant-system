import { prisma } from "@/lib/prisma";

export type PlanDetails = {
  plan: {
    key: string;
    name: string;
  };
  limits: {
    maxUsers: number;
    maxStorage: number;
    maxOrders: number;
    maxProjects: number;
  };
  features: string[];
};

export async function getCompanyPlan(
  companyId: number,
): Promise<PlanDetails | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  if (!company?.subscription || !company.subscription.plan) {
    return null; // Implies logic should handle Read-Only mode
  }

  const { plan } = company.subscription;
  let features: string[] = [];
  try {
    features = JSON.parse(plan.features);
  } catch (e) {
    features = [];
  }

  return {
    plan: {
      key: plan.key,
      name: plan.name,
    },
    limits: {
      maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage,
      maxOrders: plan.maxOrders,
      maxProjects: plan.maxProjects,
    },
    features,
  };
}
