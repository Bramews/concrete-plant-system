import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export async function hasPermission(
  userId: number,
  resource: string,
  action: string,
): Promise<boolean> {
  // 1. Fetch User with Roles & Permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      memberships: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return false;

  // 2. Normalize Requested Permission
  // We expect resource="users", action="create"
  // DB stores resource="users", action="create"

  // 3. Check System Roles (UserRole)
  const systemPermissions = user.userRoles.flatMap(
    (ur: any) =>
      ur.role?.rolePermissions?.map((rp: any) => rp.permission) || [],
  );

  // 4. Check Company Roles (Membership)
  const companyPermissions = user.memberships.flatMap(
    (m: any) => m.role?.rolePermissions?.map((rp: any) => rp.permission) || [],
  );

  const allPermissions = [...systemPermissions, ...companyPermissions];

  // 5. Super Admin Check
  const isSystemOwner = user.userRoles.some(
    (ur: any) => ur.role?.name === "SYSTEM_OWNER",
  );
  if (isSystemOwner) return true;

  // 6. Verification
  return allPermissions.some(
    (p) => p.resource === resource && p.action === action,
  );
}

export async function requirePermission(
  userId: number,
  resource: string,
  action: string,
) {
  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission ${resource}.${action}`);
  }
}
