"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  RoleName,
} from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export type PermissionSource = "DB" | "DEFAULT" | "NONE";

export type PermissionState = {
  granted: boolean;
  source: PermissionSource;
};

// Use string as key since Role enum is gone and we use DB roles
export type RolePermissionMatrix = Record<
  string,
  Record<string, PermissionState>
>;

export async function getPermissionMatrix(): Promise<RolePermissionMatrix> {
  await requireRole(["SYSTEM_OWNER"]);

  // Fetch all roles from DB
  // For System Owner, show only system-level and sovereign roles (SYSTEM_OWNER, COMPANY_ADMIN)
  const rolesData = await prisma.role.findMany({
    where: {
      OR: [{ isSystem: true }, { isSovereign: true }],
    },
  });
  const roleNames = rolesData.map((r) => r.name);

  // Fetch all permissions from DB
  const dbPermissions = await prisma.rolePermission.findMany({
    include: { role: true },
  });

  const matrix: RolePermissionMatrix = {};

  roleNames.forEach((roleName) => {
    matrix[roleName] = {};
    PERMISSIONS.forEach((perm) => {
      // 1. Check DB
      const dbEntry = dbPermissions.find(
        (p) => p.role.name === roleName && p.permissionId === perm,
      );

      if (dbEntry) {
        matrix[roleName][perm] = { granted: true, source: "DB" };
        return;
      }

      // 2. Check Defaults
      // Cast roleName to RoleName to check defaults if it matches known roles
      const defaults = ROLE_DEFAULT_PERMISSIONS[roleName as RoleName];
      if (defaults && defaults.includes(perm)) {
        matrix[roleName][perm] = { granted: true, source: "DEFAULT" };
        return;
      }

      // 3. None
      matrix[roleName][perm] = { granted: false, source: "NONE" };
    });
  });

  return matrix;
}

export async function togglePermission(
  roleName: string,
  permissionId: string,
  grant: boolean,
) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // 1. Find Role
    // Roles are either global (companyId: null) or company-specific.
    // Given the current context of getPermissionMatrix, we are likely dealing with global roles or system roles.
    const roleRecord = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!roleRecord) {
      throw new Error(`Role ${roleName} not found`);
    }

    const { id: roleId } = roleRecord;

    if (grant) {
      // Explicitly Grant (Upsert to DB)
      // Compound unique key: roleId_permissionId
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        create: { roleId, permissionId },
        update: {},
      });
    } else {
      // Revoke (Delete from DB)
      await prisma.rolePermission.deleteMany({
        where: { roleId, permissionId },
      });
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        action: grant ? "PERMISSION_GRANT" : "PERMISSION_REVOKE",
        details: `${roleName} -> ${permissionId}`,
        entity: "Permission",
        entityId: "0",
        userId: 1, // Fallback ID if strictly server action without session context.
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/permissions");
    return { success: true };
  } catch (error) {
    console.error("Toggle permission error:", error);
    return { error: "Failed to toggle permission." };
  }
}
