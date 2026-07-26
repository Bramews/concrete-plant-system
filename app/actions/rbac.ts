"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRoles(companyId?: number) {
  return await prisma.role.findMany({
    where: {
      AND: [
        {
          OR: [
            { companyId: companyId || null }, // Specific company roles or System roles (if companyId is null)
            { isSystem: true }, // Always include system roles (templates)
          ],
        },
        {
          name: { not: "SYSTEM_OWNER" }, // Hide Sovereign Role from management lists
        },
      ],
    },
    include: {
      _count: {
        select: { memberships: true },
      },
      rolePermissions: {
        select: { permissionId: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getPermissions() {
  return await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
}

export async function getRolePermissions(roleId: number) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
  return role?.rolePermissions.map((p) => p.permission.id) || [];
}

import { getCurrentUser } from "@/lib/auth";

// ... existing imports

export async function updateRolePermissions(
  roleId: number,
  permissionIds: string[],
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if role belongs to user's company OR if user is System Owner
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found");

  const isSystemOwner =
    (user as any).role === "SYSTEM_OWNER" ||
    ((user as any).role as any)?.name === "SYSTEM_OWNER";

  if (role.isSystem && !isSystemOwner) {
    throw new Error("Only System Owner can modify System Roles");
  }

  if (role.companyId && role.companyId !== user.companyId && !isSystemOwner) {
    throw new Error("Cannot modify roles of another company");
  }

  // 1. Remove all existing permissions for this role
  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  // 2. Add new permissions
  const data = permissionIds.map((permId) => ({
    roleId,
    permissionId: permId,
  }));

  await prisma.$transaction(
    data.map((p) =>
      prisma.rolePermission.create({
        data: p,
      }),
    ),
  );

  revalidatePath("/admin/rbac");
  revalidatePath("/system/settings/rbac");
  return { success: true };
}

export async function createRole(
  name: string,
  displayName: string,
  description: string,
  companyId?: number,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const isSystemOwner =
    (user as any).role === "SYSTEM_OWNER" ||
    ((user as any).role as any)?.name === "SYSTEM_OWNER";

  // If trying to create a System Role (no companyId), must be System Owner
  if (!companyId && !isSystemOwner) {
    // If user is NOT system owner, they MUST provide their own companyId
    if (!user.companyId) throw new Error("Company ID required");
    companyId = user.companyId; // Force to their company
  }

  // If companyId IS provided, ensure it matches user's company (unless System Owner)
  if (companyId && companyId !== user.companyId && !isSystemOwner) {
    throw new Error("Cannot create role for another company");
  }

  await prisma.role.create({
    data: {
      name,
      displayName,
      description,
      isSystem: false, // User created roles are never "System" flags in the code sense, maybe? Or keep as false.
      companyId: companyId || null,
    },
  });
  revalidatePath("/admin/rbac");
  revalidatePath("/system/settings/rbac");
}

export async function updateRole(
  roleId: number,
  data: {
    name?: string;
    displayName?: string;
    description?: string;
    departmentId?: number | null;
    companyId?: number | null;
  },
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found");

  // Prevent editing sovereign roles
  if (role.isSovereign) {
    throw new Error("Cannot modify sovereign roles");
  }

  const isSystemOwner =
    (user as any).role === "SYSTEM_OWNER" ||
    ((user as any).role as any)?.name === "SYSTEM_OWNER";

  // Check permissions
  if (role.isSystem && !isSystemOwner) {
    throw new Error("Only System Owner can modify System Roles");
  }

  if (role.companyId && role.companyId !== user.companyId && !isSystemOwner) {
    throw new Error("Cannot modify roles of another company");
  }

  await prisma.role.update({
    where: { id: roleId },
    data,
  });

  revalidatePath("/admin/rbac");
  revalidatePath("/system/settings/rbac");
  return { success: true };
}

export async function deleteRole(roleId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { _count: { select: { memberships: true } } },
  });

  if (!role) throw new Error("Role not found");

  // Prevent deleting sovereign roles
  if (role.isSovereign) {
    throw new Error("Cannot delete sovereign roles");
  }

  // Prevent deleting roles with users
  if (role._count.memberships > 0) {
    throw new Error(
      `Cannot delete role with ${role._count.memberships} assigned user(s)`,
    );
  }

  const isSystemOwner =
    (user as any).role === "SYSTEM_OWNER" ||
    ((user as any).role as any)?.name === "SYSTEM_OWNER";

  if (role.isSystem && !isSystemOwner) {
    throw new Error("Only System Owner can delete System Roles");
  }

  if (role.companyId && role.companyId !== user.companyId && !isSystemOwner) {
    throw new Error("Cannot delete roles of another company");
  }

  await prisma.role.delete({ where: { id: roleId } });

  revalidatePath("/admin/rbac");
  revalidatePath("/system/settings/rbac");
  return { success: true };
}

export async function getDepartments() {
  return await prisma.department.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCompanies() {
  return await prisma.company.findMany({
    where: {
      status: { not: "DELETED" },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}
