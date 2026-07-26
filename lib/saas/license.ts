import { prisma } from "@/lib/prisma";

export enum Module {
  LAB = "LAB",
  SALES = "SALES",
  ACCOUNTS = "ACCOUNTS",
  DISPATCH = "DISPATCH",
  SECURITY = "SECURITY",
  FULL_SUITE = "FULL_SUITE",
}

export enum Feature {
  ADVANCED_REPORTING = "ADVANCED_REPORTING",
  AI_ASSISTANT = "AI_ASSISTANT",
  MULTI_TENANCY = "MULTI_TENANCY",
}

export async function checkLicense(companyId: number) {
  const license = (await prisma.license.findUnique({
    where: { companyId },
  })) as any;

  if (!license) {
    return { valid: false, error: "No license found" };
  }

  if (license.status && license.status !== "ACTIVE") {
    return { valid: false, error: "License is not active" };
  }

  const expirationDate = license.expiresAt || license.endDate;
  if (expirationDate && new Date() > new Date(expirationDate)) {
    return { valid: false, error: "License has expired" };
  }

  return { valid: true, license };
}

export async function hasModuleAccess(companyId: number, module: Module) {
  const check = await checkLicense(companyId);
  if (!check.valid || !check.license) return false;

  if ((check.license.modules || "").includes("FULL_SUITE")) return true;

  return (check.license.modules || "").split(",").includes(module);
}

export async function canAddUser(companyId: number) {
  const check = await checkLicense(companyId);
  if (!check.valid || !check.license)
    return { allowed: false, error: check.error };

  const userCount = await prisma.user.count({
    where: { companyId },
  });

  const maxUsers = check.license.maxUsers || 0;
  if (maxUsers > 0 && userCount >= maxUsers) {
    return {
      allowed: false,
      error: `License limit reached (${maxUsers} users)`,
    };
  }

  return { allowed: true };
}

export async function canAccessFeature(companyId: number, feature: Feature) {
  const check = await checkLicense(companyId);
  if (!check.valid || !check.license)
    return { allowed: false, error: check.error };

  // For now, allow all features to ACTIVE licenses
  // In a real scenario, this would check license.tier or license.features
  return { allowed: true };
}
