"use server";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getSession } from "@/lib/auth";
import { hash } from "bcryptjs";

// Helper to determine audit actor
async function getAuditActor() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const isSystemOwner = session.role === "SYSTEM_OWNER";
  return {
    userId: isSystemOwner ? undefined : session.userId,
    systemOwnerId: isSystemOwner ? session.userId : undefined,
    role: session.role,
  };
}

// Helper to protect System Owner accounts from any administrative modification
async function ensureNotSystemOwner(userId: number) {
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (targetUser) {
    const isOwner = await prisma.systemOwner.findUnique({
      where: { email: targetUser.email },
    });
    if (
      isOwner ||
      targetUser.email === "ahmed@concrete.com" ||
      targetUser.email === "ahmed@neon.com"
    ) {
      throw new Error(
        "سماحيات مالك النظام محمية سيادياً ولا يمكن تعديلها أو تعطيلها عبر واجهات الإدارة العامة.",
      );
    }
  }
}

export async function inviteUser(
  email: string,
  companyId: number,
  roleId: number | string,
  name: string,
  username: string,
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
    const actor = await getAuditActor();

    // Validate Role
    let role;
    if (typeof roleId === "number") {
      role = await prisma.role.findUnique({
        where: { id: roleId },
      });
    } else {
      role = await prisma.role.findFirst({
        where: { name: roleId },
      });
    }
    if (!role) return { error: "Invalid Role" };
    const resolvedRoleId = role.id;

    // 1. Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      const hashedPassword = await hash("ChangeMe123!", 10); // Default password policy?
      user = await prisma.user.create({
        data: {
          email,
          username, // Unique username required
          name,
          password: hashedPassword,
          status: "ACTIVE",
          // Removed top-level role assignment as we use Memberships now
        },
      });
    }

    // 2. Check if membership exists
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });

    if (existingMembership) {
      if (!existingMembership.deletedAt) {
        return { error: "User is already a member of this company." };
      }

      // Restore
      await prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          deletedAt: null,
          roleId: resolvedRoleId,
          status: "ACTIVE",
        },
      });
    } else {
      // Create Membership
      await prisma.membership.create({
        data: {
          userId: user.id,
          companyId,
          roleId: resolvedRoleId,
          status: "ACTIVE",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "MEMBER_ADD",
        details: `Added user ${user.email} to company ${companyId} with role ${role.name}`,
        entity: "Membership",
        entityId: String(user.id), // Linking to User ID effectively
        companyId: companyId,

        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role as string,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Invite user error:", error);
    return { error: "Failed to invite user." };
  }
}

export async function removeUserFromCompany(userId: number, companyId: number) {
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
    await ensureNotSystemOwner(userId);
    const actor = await getAuditActor();

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!membership) return { error: "Membership not found." };
    if (membership.deletedAt) return { error: "Membership already removed." };

    // 1. Soft delete membership
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        deletedAt: new Date(),
        status: "REMOVED",
      },
    });

    // 2. Clear user's companyId association if it matches this company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (user && user.companyId === companyId) {
      await prisma.user.update({
        where: { id: userId },
        data: { companyId: null },
      });
    }

    // 3. Create Audit Log safely
    try {
      await prisma.auditLog.create({
        data: {
          action: "MEMBER_REMOVE",
          details: `Removed user ${userId} from company ${companyId}`,
          entity: "Membership",
          entityId: String(membership.id),
          companyId: companyId,
          userId: actor.userId,
          systemOwnerId: actor.systemOwnerId,
          role: actor.role as string,
          timestamp: new Date(),
        },
      });
    } catch (auditErr) {
      console.warn("Audit log warning on remove:", auditErr);
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Remove user error:", error);
    return { error: "Failed to remove user." };
  }
}

export async function updateMemberRole(
  userId: number,
  companyId: number,
  newRoleId: number,
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
    await ensureNotSystemOwner(userId);
    const actor = await getAuditActor();

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!membership || membership.deletedAt)
      return { error: "Active membership not found." };

    // Validate Role
    const role = await prisma.role.findUnique({
      where: { id: newRoleId },
    });
    if (!role) return { error: "Invalid Role ID" };

    await prisma.membership.update({
      where: { id: membership.id },
      data: { roleId: newRoleId },
    });

    await prisma.auditLog.create({
      data: {
        action: "MEMBER_ROLE_UPDATE",
        details: `Updated role for user ${userId} in company ${companyId} to ${role.name}`,
        entity: "Membership",
        entityId: String(membership.id),
        companyId: companyId,

        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role as string,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Update role error:", error);
    return { error: "Failed to update role." };
  }
}

export async function toggleMemberStatus(userId: number, companyId: number) {
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
    await ensureNotSystemOwner(userId);
    const actor = await getAuditActor();

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!membership) return { error: "Membership not found." };
    if (membership.deletedAt)
      return { error: "Cannot toggle status of removed member." };

    const newStatus = membership.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    await prisma.$transaction(async (tx) => {
      // 1. Update Membership Status
      await tx.membership.update({
        where: { id: membership.id },
        data: { status: newStatus },
      });

      // 2. Sync User Status if this is their primary/only company (optional, but safer to keep user status in sync)
      // Actually, for multi-tenant, it's better to just rely on membership status in lib/auth.ts
      // But let's also update the User.status to match if it's currently relevant.
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.companyId === companyId) {
        await tx.user.update({
          where: { id: userId },
          data: { status: newStatus },
        });
      }

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          action: "MEMBER_STATUS_TOGGLE",
          details: `Changed status for user ${userId} in company ${companyId} to ${newStatus}`,
          entity: "Membership",
          entityId: String(membership.id),
          companyId: companyId,
          prevStatus: membership.status,
          newStatus: newStatus,
          userId: actor.userId,
          systemOwnerId: actor.systemOwnerId,
          role: actor.role as string,
          timestamp: new Date(),
        },
      });
    });

    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true, newStatus };
  } catch (error) {
    console.error("Toggle status error:", error);
    return { error: "Failed to toggle status." };
  }
}

export async function updateMemberData(
  userId: number,
  companyId: number,
  data: {
    name: string;
    username: string;
    email: string;
    phone?: string;
    roleId: number;
    password?: string; // Optional password update
  },
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

  console.log("updateMemberData called with:", { userId, companyId, data });
  await requireRole(["SYSTEM_OWNER"]);
  try {
    await ensureNotSystemOwner(userId);
    const actor = await getAuditActor();

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!membership || membership.deletedAt)
      return { error: "Membership not found." };

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });
    if (!company) return { error: "الشركة غير موجودة." };

    let username = data.username;
    if (username && !username.includes("@")) {
      username = `${username}@${company.slug.toLowerCase()}`;
    }

    // Check email uniqueness if it's changing
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return { error: "البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر." };
    }

    // Check username uniqueness if it's changing
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: username,
        NOT: { id: userId },
      },
    });

    if (existingUsername) {
      return { error: "اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر." };
    }

    // Hash password BEFORE transaction to avoid interactive transaction timeout
    const updateData: any = {
      name: data.name,
      username: username,
      email: data.email,
      phone: data.phone || null,
    };

    if (data.password && data.password.trim() !== "") {
      console.log("Password update detected. Plain:", data.password);
      updateData.password = await hash(data.password, 10);
    } else {
      console.log("No password update or empty password.");
    }

    console.log("Proceeding to update user with:", updateData);

    // 1. Update User Data
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 2. Update Membership Role
    await prisma.membership.update({
      where: { id: membership.id },
      data: { roleId: data.roleId },
    });

    // 3. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "MEMBER_DATA_UPDATE",
          details: `Updated info and role for user ${userId} in company ${companyId}`,
          entity: "Membership",
          entityId: String(membership.id),
          companyId: companyId,
          userId: actor.userId,
          systemOwnerId: actor.systemOwnerId,
          role: actor.role as string,
          timestamp: new Date(),
        },
      });
    } catch (aErr) {
      console.warn("Audit log warning on update:", aErr);
    }

    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Update member data error:", error);
    return { error: "Failed to update member data." };
  }
}

export async function toggleUserStatus(userId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    await ensureNotSystemOwner(userId);
    const actor = await getAuditActor();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { error: "User not found." };

    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    // Update User Status
    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "USER_STATUS_TOGGLE",
        details: `Changed account status for user ${userId} to ${newStatus}`,
        entity: "User",
        entityId: String(userId),
        companyId: user.companyId || undefined,
        prevStatus: user.status,
        newStatus: newStatus,
        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role as string,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/users");
    return { success: true, newStatus };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { error: "Failed to toggle user status." };
  }
}

export async function saveUserCustomPermissions(
  userId: number,
  permissions: string[],
) {
  await requireRole([
    "SYSTEM_OWNER",
    "LAB_MANAGER",
    "SALES_MANAGER",
    "DEPARTMENT_MANAGER",
  ]);
  try {
    await prisma.userSetting.upsert({
      where: {
        userId_key: {
          userId,
          key: "custom_permissions",
        },
      },
      create: {
        userId,
        key: "custom_permissions",
        value: JSON.stringify(permissions),
      },
      update: {
        value: JSON.stringify(permissions),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Save custom permissions error:", error);
    return { error: "Failed to save custom permissions" };
  }
}

export async function fetchUserCustomPermissions(userId: number) {
  await requireRole([
    "SYSTEM_OWNER",
    "LAB_MANAGER",
    "SALES_MANAGER",
    "DEPARTMENT_MANAGER",
  ]);
  try {
    const setting = await prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key: "custom_permissions",
        },
      },
    });
    if (!setting) return [];
    return JSON.parse(setting.value) as string[];
  } catch (error) {
    console.error("Fetch custom permissions error:", error);
    return [];
  }
}

export async function checkFieldAvailability(
  field: "email" | "username",
  value: string,
  ignoreUserId?: number,
): Promise<boolean> {
  try {
    const whereClause: any = {
      [field]: value,
    };
    if (ignoreUserId) {
      whereClause.NOT = { id: ignoreUserId };
    }
    const count = await prisma.user.count({
      where: whereClause,
    });
    return count === 0;
  } catch (error) {
    console.error("Check field availability error:", error);
    return false;
  }
}
