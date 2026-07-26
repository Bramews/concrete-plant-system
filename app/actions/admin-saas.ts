"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// =======================
// SYSTEM OWNER ONLY
// =======================

export async function getSystemStats() {
  await requireRole(["SYSTEM_OWNER"]);

  const totalCompanies = await prisma.company.count({
    where: { status: { not: "DELETED" } },
  });
  const activeCompanies = await prisma.company.count({
    where: { status: "ACTIVE" },
  });
  const totalUsers = await prisma.user.count();
  const premiumCompanies = await prisma.license.count({
    where: { type: "PREMIUM" },
  });

  return {
    totalCompanies,
    activeCompanies,
    totalUsers,
    premiumCompanies,
  };
}

export async function getAllCompanies() {
  await requireRole(["SYSTEM_OWNER"]);

  return await prisma.company.findMany({
    where: {},
    include: {
      license: true,
      subscription: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleCompanyStatus(companyId: number, status: string) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { status },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: `COMPANY_${status}`,
        details: `Company ID ${companyId} status changed to ${status}`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1, // Assuming system owner has ID 1 or we'd fetch current user
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/companies");
    return { success: true, message: `Company status updated to ${status}` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCompany(companyId: number) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  try {
    // Audit Log BEFORE deletion just in case
    await prisma.auditLog.create({
      data: {
        action: "COMPANY_DELETE",
        details: `Company ID ${companyId} deleted`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    // Unified Professional Soft Delete
    await prisma.company.delete({
      where: { id: companyId },
    });

    revalidatePath("/admin/companies");
    return { success: true, message: "Company deleted successfully" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCompanyLicense(
  companyId: number,
  type: string,
  maxUsers: number,
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  try {
    await prisma.license.update({
      where: { companyId },
      data: {
        type,
        maxUsers,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "LICENSE_UPDATE",
        details: `Company ID ${companyId} license updated to ${type} (Max Users: ${maxUsers})`,
        entity: "License",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/licenses");
    revalidatePath("/admin/companies");
    return { success: true, message: "License updated successfully" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getGlobalUsers() {
  await requireRole(["SYSTEM_OWNER"]);

  return await prisma.user.findMany({
    include: {
      company: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit for performance
  });
}
export async function createCompany(data: {
  name: string;
  domain: string;
  status: string;
  licenseType: string;
  maxUsers: number;
}) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: data.name,
          slug: data.domain.toLowerCase().replace(/\s+/g, "-"), // Use domain as slug base
          status: data.status,
        },
      });

      // Create associated domain record
      await tx.domain.create({
        data: {
          companyId: newCompany.id,
          domain: data.domain,
          status: "ACTIVE",
          verified: true,
        },
      });

      await tx.license.create({
        data: {
          companyId: newCompany.id,
          type: data.licenseType,
          maxUsers: data.maxUsers,
          modules: "all", // Required field in schema
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        },
      });

      return newCompany;
    });

    await prisma.auditLog.create({
      data: {
        action: "COMPANY_CREATE",
        details: `Created new company: ${data.name} (Domain: ${data.domain})`,
        entity: "Company",
        entityId: String(company.id),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/companies");
    return { success: true, companyId: company.id };
  } catch (error) {
    console.error("Create Company Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
