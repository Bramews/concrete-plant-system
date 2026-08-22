"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizeRole } from "@/lib/roles";
import { logEvent } from "@/lib/logger";
import { canCreateUserWithRole } from "@/lib/permissions";

import { verifyPassword, hashPassword } from "@/lib/security/password";
// import { setTokens } from "@/lib/security/jwt"; // DEPRECATED
import { logSessionEvent } from "@/lib/security/audit";
// import { Role } from "@prisma/client"; // DEPRECATED
import { canAddUser } from "@/lib/saas/license";
import {
  createSession,
  revokeSession,
  verifySession,
  SESSION_COOKIE_NAME,
} from "@/lib/session";
import { cookies } from "next/headers";
import { signJWT } from "@/lib/security/jwt";

// ============================================
// Multi-Company Security Validation Functions
// ============================================

/**

/**
 * Check if creator can create user with target role (Hierarchy validation)
 * @param creatorRole - Role of the user creating the new user
 * @param targetRole - Role of the user being created
 * @returns true if creation is allowed
 */
function canCreateUser(creatorRole: string, targetRole: string): boolean {
  return canCreateUserWithRole(creatorRole, targetRole);
}

export async function authenticateUserAction(formData: FormData): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || null;
  const remember = formData.get("remember") === "on";

  try {
    const rawInput = (username || "").trim();
    const cleanInput = rawInput.toLowerCase();

    const orConditions: Array<Record<string, unknown>> = [
      { username: rawInput },
      { username: cleanInput },
      { email: rawInput },
      { email: cleanInput },
    ];

    if (rawInput.includes("@")) {
      const parts = rawInput.split("@");
      if (parts.length === 2) {
        const [p1, p2] = parts;
        orConditions.push(
          { username: `${p1}@${p2}` },
          { username: `${p1.toLowerCase()}@${p2.toLowerCase()}` },
          { username: `${p1}@${p2.toLowerCase()}` },
          { username: `${p2}@${p1}` },
          { username: `${p2.toLowerCase()}@${p1.toLowerCase()}` },
          { username: `${p2}@${p1.toLowerCase()}` },
        );
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        company: true,
        memberships: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "بيانات الدخول غير صحيحة" };
    }

    const passwordMatches = await verifyPassword(password, user.password);
    if (!passwordMatches) {
      return { success: false, error: "بيانات الدخول غير صحيحة" };
    }

    if (user.status === "DISABLED") {
      return { success: false, error: "الحساب معطل، يرجى مراجعة الدعم" };
    }

    if (user.company) {
      if (user.company.status === "SUSPENDED") {
        return { success: false, error: "الشركة موقوفة مؤقتاً" };
      }
      if (user.company.status === "LOCKED") {
        return { success: false, error: "النظام مقفل من قبل الإدارة" };
      }
    }

    // Determine Role
    const rawRoles = user.memberships.map(
      (m: { role: { name: string } }) => m.role.name,
    );
    const roles = rawRoles.map((r: string) => normalizeRole(r));

    let activeRole = "OPERATOR";
    if (roles.includes("SYSTEM_OWNER")) activeRole = "SYSTEM_OWNER";
    else if (roles.includes("COMPANY_ADMIN")) activeRole = "COMPANY_ADMIN";
    else if (roles.includes("DEPARTMENT_MANAGER"))
      activeRole = "DEPARTMENT_MANAGER";
    else if (roles.includes("MANAGER")) activeRole = "MANAGER";
    else if (roles.includes("LAB_TECH")) activeRole = "LAB_TECH";
    else if (roles.includes("SALES")) activeRole = "SALES";
    else if (roles.includes("ACCOUNTANT")) activeRole = "ACCOUNTANT";
    else if (roles.includes("SAFETY")) activeRole = "SAFETY";
    else if (roles.includes("GUARD")) activeRole = "GUARD";
    else if (roles.includes("OPERATOR")) activeRole = "OPERATOR";
    else if (roles.length > 0) activeRole = roles[0];

    // Check system owner global bypass
    const systemOwner = await prisma.systemOwner
      .findFirst({
        where: { email: user.email },
      })
      .catch(() => null);

    if (systemOwner) {
      activeRole = "SYSTEM_OWNER";
    }

    const maxAge = remember ? 30 * 24 * 3600 : 7 * 24 * 3600;

    const { token } = await createSession(user.id, user.companyId ?? undefined);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    const jwtPayload = {
      userId: user.id,
      role: activeRole,
      companyId: user.companyId ?? null,
    };
    const accessToken = await signJWT(jwtPayload, maxAge);

    cookieStore.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    // Determine target URL
    let targetUrl = "/system/dashboard";
    if (callbackUrl && callbackUrl.startsWith("/")) {
      targetUrl = callbackUrl;
    } else if (activeRole === "SYSTEM_OWNER") {
      targetUrl = "/admin";
    } else if (
      activeRole === "MANAGER" ||
      activeRole === "COMPANY_ADMIN" ||
      activeRole === "DEPARTMENT_MANAGER"
    ) {
      targetUrl = "/system/manager/dashboard";
    } else if (activeRole === "LAB_TECH" || activeRole === "LAB_ENGINEER") {
      targetUrl = "/system/lab/mix-designs";
    } else if (activeRole === "OPERATOR" || activeRole === "GUARD") {
      targetUrl = "/system/operator";
    } else if (activeRole === "SALES") {
      targetUrl = "/system/sales";
    } else if (activeRole === "ACCOUNTANT") {
      targetUrl = "/system/accountant";
    } else if (activeRole === "SAFETY") {
      targetUrl = "/system/safety";
    }

    return { success: true, redirectUrl: targetUrl };
  } catch (err: unknown) {
    console.error("[authenticateUserAction] Error:", err);
    return { success: false, error: "حدث خطأ غير متوقع أثناء تسجيل الدخول" };
  }
}

export async function login(formData: FormData) {
  const username = formData.get("username") as string;

  // ── Rate Limiting على Login ──
  const { headers: reqHeaders } = await import("next/headers");
  let clientIp = "unknown";
  try {
    const hdrs = await reqHeaders();
    clientIp =
      hdrs.get("x-real-ip") || hdrs.get("x-forwarded-for") || "unknown";
  } catch {}

  // تسجيل محاولة الدخول في قاعدة البيانات
  try {
    const recentAttempts = await prisma.auditLog.count({
      where: {
        action: "LOGIN_FAILED",
        ipAddress: clientIp,
        timestamp: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (recentAttempts >= 10) {
      return redirect(
        "/login?error=تم تجاوز الحد الأقصى لمحاولات الدخول. حاول بعد 15 دقيقة.",
      );
    }
  } catch {}

  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || null;
  const remember = formData.get("remember") === "on";

  try {
    const rawInput = (username || "").trim();
    const cleanInput = rawInput.toLowerCase();

    const orConditions: Array<Record<string, unknown>> = [
      { username: rawInput },
      { username: cleanInput },
      { email: rawInput },
      { email: cleanInput },
    ];

    if (rawInput.includes("@")) {
      const parts = rawInput.split("@");
      if (parts.length === 2) {
        const [p1, p2] = parts;
        // User entered "user@slug" (e.g. 5@demo-plant)
        orConditions.push(
          { username: `${p1}@${p2}` },
          { username: `${p1.toLowerCase()}@${p2.toLowerCase()}` },
          { username: `${p1}@${p2.toLowerCase()}` },
          // If user reversed the order: "slug@user" (e.g. demo-plant@5)
          { username: `${p2}@${p1}` },
          { username: `${p2.toLowerCase()}@${p1.toLowerCase()}` },
          { username: `${p2}@${p1.toLowerCase()}` },
        );
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        company: true,
        memberships: {
          include: { role: true },
        },
      },
    });

    if (user && (await verifyPassword(password, user.password))) {
      // 1. Check User Status
      if (user.status === "DISABLED") {
        return redirect(
          `/login?error=Account Disabled. Please contact support.`,
        );
      }

      // 2. Check Company Status (if applicable)
      if (user.company) {
        if (user.company.status === "SUSPENDED") {
          return redirect(`/login?error=Company Suspended. Access restricted.`);
        }
        if (user.company.status === "LOCKED") {
          return redirect(`/login?error=System Locked by Administrator.`);
        }
      }

      // Determine Role from Memberships
      // Prioritize System Owner > Company Admin > Others
      const rawRoles = user.memberships.map(
        (m: { role: { name: string } }) => m.role.name,
      );

      // Normalize all roles
      const roles = rawRoles.map((r: string) => normalizeRole(r));

      let activeRole = "OPERATOR"; // Default Fallback

      // Priority Ladder
      if (roles.includes("SYSTEM_OWNER")) activeRole = "SYSTEM_OWNER";
      else if (roles.includes("COMPANY_ADMIN")) activeRole = "COMPANY_ADMIN";
      else if (roles.includes("DEPARTMENT_MANAGER"))
        activeRole = "DEPARTMENT_MANAGER";
      else if (roles.includes("MANAGER")) activeRole = "MANAGER";
      else if (roles.includes("LAB_TECH")) activeRole = "LAB_TECH";
      else if (roles.includes("SALES")) activeRole = "SALES";
      else if (roles.includes("ACCOUNTANT")) activeRole = "ACCOUNTANT";
      else if (roles.includes("SAFETY")) activeRole = "SAFETY";
      else if (roles.includes("GUARD")) activeRole = "GUARD";
      else if (roles.includes("OPERATOR")) activeRole = "OPERATOR";
      else if (roles.length > 0) activeRole = roles[0]; // Blind fallback to first role if known

      // Create Session
      const { token, session } = await createSession(
        user.id,
        user.companyId ?? undefined,
      );
      console.log(
        `[LOGIN] Session Created. ID: ${session.id}, Token (start): ${token.substring(0, 10)}...`,
      );

      // Calculate Expiration
      // Fetch System Settings
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              "session_duration",
              "remember_me_duration",
              "remember_me_duration_unit",
            ],
          },
        },
      });

      const settingsMap = settings.reduce(
        (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
        {} as Record<string, string>,
      );

      const sessionDurationDays = parseInt(
        settingsMap["session_duration"] || "7",
      );
      const rememberMeDuration = parseInt(
        settingsMap["remember_me_duration"] || "30",
      );
      const rememberMeUnit = settingsMap["remember_me_duration_unit"] || "days";

      let maxAge = 60 * 60 * 24 * sessionDurationDays; // Default session (days)

      if (remember) {
        if (rememberMeUnit === "minutes") {
          maxAge = 60 * rememberMeDuration;
        } else {
          // days
          maxAge = 60 * 60 * 24 * rememberMeDuration;
        }
      }

      // Set Cookie
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAge,
      });
      console.log(
        `[LOGIN] Cookie '${SESSION_COOKIE_NAME}' set. MaxAge: ${maxAge}`,
      );

      // JWT Fallback for Middleware & Edge Compatibility
      const jwtPayload = {
        userId: user.id,
        role: activeRole,
        companyId: user.companyId ?? null,
      };
      const accessToken = await signJWT(jwtPayload, maxAge);

      cookieStore.set("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAge,
      });

      await logSessionEvent(
        user.id,
        activeRole,
        "LOGIN",
        `User ${user.username} logged in securely`,
      );

      // Redirect logic: callbackUrl takes precedence
      if (callbackUrl && callbackUrl.startsWith("/")) {
        return redirect(callbackUrl);
      }

      // Default redirections based on ROLE
      if (activeRole === "SYSTEM_OWNER") return redirect("/admin");
      if (
        activeRole === "MANAGER" ||
        activeRole === "COMPANY_ADMIN" ||
        activeRole === "DEPARTMENT_MANAGER"
      )
        return redirect("/system/manager/dashboard");
      if (activeRole === "LAB_TECH" || activeRole === "LAB_ENGINEER")
        return redirect("/system/lab/dashboard"); // Assuming lab has a dashboard
      if (activeRole === "OPERATOR" || activeRole === "GUARD")
        return redirect("/system/operator");
      if (activeRole === "SALES") return redirect("/system/sales");
      if (activeRole === "ACCOUNTANT") return redirect("/system/accountant");
      if (activeRole === "SAFETY") return redirect("/system/safety");

      return redirect("/system/dashboard");
    }
  } catch (error: unknown) {
    if (
      (error as Error).message === "NEXT_REDIRECT" ||
      (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    )
      throw error;
    // console.error("Login Error:", error);
    return redirect(
      `/login?error=${encodeURIComponent((error as Error).message)}`,
    );
  }

  return redirect("/login?error=Invalid Credentials");
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      await revokeSession(session.id);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete("auth_token"); // Clear JWT
    cookieStore.delete("refresh_token"); // Clear Refresh if any
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// User Management Actions
export async function createUser(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Fetch full current user with company details
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: true,
        memberships: { include: { role: true } },
      },
    });

    if (!currentUser) throw new Error("User not found");

    // 0. SaaS License Check
    if (currentUser.companyId) {
      const licenseCheck = await canAddUser(currentUser.companyId);
      if (!licenseCheck.allowed) {
        throw new Error(`License Limit Reached: ${licenseCheck.error}`);
      }
    }

    // 1. Permission Check
    const allowedCreatorRoles = [
      "SYSTEM_OWNER",
      "COMPANY_ADMIN",
      "MANAGER",
      "DEPARTMENT_MANAGER",
      "LAB_MANAGER",
      "SALES_MANAGER",
      "ACCOUNTING_MANAGER",
    ];
    if (
      !currentUser.canCreateUsers &&
      !allowedCreatorRoles.includes(session.role)
    ) {
      throw new Error("ليس لديك صلاحية إنشاء مستخدمين");
    }

    let username = formData.get("username") as string;
    if (session.role !== "SYSTEM_OWNER" && currentUser.company) {
      if (username && !username.includes("@")) {
        username = `${username}@${currentUser.company.slug.toLowerCase()}`;
      }
    }
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    // Instead of taking password from formData, generate a random one for invites
    let password = formData.get("password") as string;
    if (!password) {
      password = Math.random().toString(36).slice(-10) + "A1!"; // ensure complexity
    }

    const expiresAtStr = formData.get("expiresAt") as string;
    const ipRestriction = (formData.get("ipRestriction") as string) || null;
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
    const role = formData.get("role") as string;

    // 2. Hierarchy Validation
    if (!canCreateUser(session.role, role)) {
      throw new Error("لا يمكنك إنشاء مستخدم بهذا الدور (تجاوز للهيكل الهرمي)");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new Error("Email already used");
    }

    const hashedPassword = await hashPassword(password);

    // Find Role ID
    const roleRecord = await prisma.role.findFirst({
      where: {
        name: role,
        OR: [
          { companyId: session.companyId },
          { companyId: null }, // System template roles
          { isSystem: true }, // Fallback to system roles
        ],
      },
    });

    if (!roleRecord) {
      throw new Error(`Role ${role} not found available for this company.`);
    }

    // Phase 4.3: Enforcement
    if (session.companyId) {
      const { enforceLimit } = await import("@/lib/enforcement");
      const decision = await enforceLimit(session.companyId, "USERS", 1);
      if (!decision.allowed) {
        throw new Error(decision.reason);
      }
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        // role, // DEPRECATED
        status: "ACTIVE",
        companyId: session.companyId,
        createdById: session.userId,
        expiresAt,
        ipRestriction,
        canCreateUsers: [
          "COMPANY_ADMIN",
          "MANAGER",
          "DEPARTMENT_MANAGER",
          "LAB_MANAGER",
          "SALES_MANAGER",
          "ACCOUNTING_MANAGER",
        ].includes(role),
        memberships: {
          create: {
            companyId: session.companyId!,
            roleId: roleRecord.id,
          },
        },
      },
    });

    // Generate Setup Token for zero-knowledge invite
    const crypto = await import("crypto");
    const setupToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: newUser.id,
        token: setupToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const inviteUrl = `/reset-password?token=${setupToken}`;

    // Phase 4.2: Usage Tracking
    try {
      const { incrementUsage, USAGE_METRICS } = await import("@/lib/usage");
      if (session.companyId) {
        await incrementUsage(
          session.companyId,
          USAGE_METRICS.USERS,
          1,
          "USER_CREATE",
        );
      }
    } catch {
      // console.error("Usage Tracking Failed");
    }

    await logSessionEvent(
      session.userId,
      session.role,
      "LOGIN",
      `Created user ${username} with role ${role} in company ${session.companyId}. Invite generated.`,
    );

    revalidatePath("/system/manager/users");
    revalidatePath("/admin/users");
    return {
      success: true,
      message: "تم إضافة المستخدم بنجاح. يرجى نسخ رابط الإعداد وإرساله للموظف.",
      inviteUrl,
    };
  } catch (error) {
    // console.error("Create User Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateUser(formData: FormData) {
  try {
    await requireRole([
      "SYSTEM_OWNER",
      "MANAGER",
      "COMPANY_ADMIN",
      "LAB_MANAGER",
      "SALES_MANAGER",
      "DEPARTMENT_MANAGER",
    ]);

    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const expiresAtStr = formData.get("expiresAt") as string;
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // 🔱 حصانة مالك النظام — حماية بياناته من التعديل
    const targetUserCheck = await prisma.user.findUnique({
      where: { id },
      include: { memberships: { include: { role: true } } },
    });
    if (targetUserCheck) {
      const isTargetOwner = targetUserCheck.memberships?.some(
        (m: { role: { name: string } | null }) =>
          m.role?.name === "SYSTEM_OWNER",
      );
      if (isTargetOwner && session.role !== "SYSTEM_OWNER") {
        throw new Error("🔱 محظور: لا يمكن تعديل بيانات مالك النظام.");
      }
      if (isTargetOwner && role !== "SYSTEM_OWNER") {
        throw new Error("🔱 محظور: لا يمكن تغيير دور مالك النظام.");
      }
    }

    // SYSTEM_OWNER can edit anyone to anything
    if (session.role === "SYSTEM_OWNER") {
      // No restrictions
    } else if (
      [
        "MANAGER",
        "COMPANY_ADMIN",
        "LAB_MANAGER",
        "SALES_MANAGER",
        "DEPARTMENT_MANAGER",
      ].includes(session.role)
    ) {
      // Scoped restrictions
      const targetUser = await prisma.user.findUnique({
        where: { id, companyId: session.companyId },
      });
      if (!targetUser) throw new Error("User not found or access denied");
    }

    const updateData: {
      name: string;
      email: string;
      expiresAt: Date | null;
      username?: string;
      password?: string;
    } = {
      name,
      email,
      expiresAt,
    };

    // Find Role Record
    const roleRecord = await prisma.role.findFirst({
      where: {
        name: role,
        OR: [
          { companyId: session.companyId },
          { companyId: null },
          { isSystem: true },
        ],
      },
    });
    if (!roleRecord) throw new Error("Invalid role");

    // Update User Core Data
    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update Membership Role
    // Finds membership for this company and updates roleId
    // If no membership exists (edge case), create one?
    // Start with updateMany to be safe
    const membership = await prisma.membership.findFirst({
      where: { userId: id, companyId: session.companyId ?? undefined },
    });

    if (membership) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { roleId: roleRecord.id },
      });
    } else if (session.companyId) {
      // Create if missing
      await prisma.membership.create({
        data: {
          userId: id,
          companyId: session.companyId,
          roleId: roleRecord.id,
        },
      });
    }

    // console.log("✅ Updated User:", id);

    await logEvent({
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      details: `Updated info for user ID ${id}`,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User updated successfully" };
  } catch (error: unknown) {
    // console.error("Update User Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function toggleUserStatus(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const id = parseInt(formData.get("id") as string);

    const user = await prisma.user.findUnique({
      where: {
        id,
        companyId:
          session.role === "SYSTEM_OWNER" ? undefined : session.companyId,
      },
    });
    if (!user) throw new Error("User not found or access denied");

    // 🔱 حصانة مالك النظام — لا يجوز تعطيل حسابه
    const targetMemberships = await prisma.membership.findMany({
      where: { userId: id, deletedAt: null },
      include: { role: true },
    });
    const isTargetSystemOwner = targetMemberships.some(
      (m: { role: { name: string } }) => m.role.name === "SYSTEM_OWNER",
    );
    if (isTargetSystemOwner && session.userId !== id) {
      throw new Error("🔱 محظور: لا يمكن تعطيل حساب مالك النظام.");
    }

    // Role checks will be handled via memberships
    // Implement proper role hierarchy checks

    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    await logEvent({
      action: "USER_STATUS_TOGGLE",
      entity: "User",
      entityId: id,
      newStatus,
      details: `User status changed to ${newStatus}`,
    });

    revalidatePath("/admin/users");
    return {
      success: true,
      message: `User ${newStatus.toLowerCase()} successfully`,
    };
  } catch (error: unknown) {
    // console.error("Toggle User Status Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function deleteUser(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const id = parseInt(formData.get("id") as string);

    const userCount = await prisma.user.count();
    if (userCount <= 1) {
      throw new Error(
        "Safety Block: Cannot delete the last user in the system.",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
        companyId:
          session.role === "SYSTEM_OWNER" ? undefined : session.companyId,
      },
      include: {
        memberships: { include: { role: true } },
        labApprovals: true,
      },
    });

    if (!user) throw new Error("User not found or access denied");

    // 🔱 حصانة مالك النظام — لا يجوز حذف حسابه أبداً
    const targetRoles = user.memberships.map(
      (m: { role: { name: string } }) => m.role.name,
    );
    if (targetRoles.includes("SYSTEM_OWNER")) {
      throw new Error(
        "🔱 محظور: لا يمكن حذف حساب مالك النظام من قاعدة البيانات. هذا الحساب محمي دستورياً.",
      );
    }

    // SYSTEM_OWNER can delete anyone (including linked ones - full privileges)
    if (session.role === "SYSTEM_OWNER") {
      // Proceed to deletion without any restrictions
    } else if (session.role === "MANAGER" || session.role === "COMPANY_ADMIN") {
      // Scoped restrictions
      const userRoles = user.memberships.map(
        (m: { role: { name: string } }) => m.role.name,
      );
      if (userRoles.includes("SYSTEM_OWNER")) {
        throw new Error("الإدارة لا يمكنها حذف مالك النظام.");
      }
      if (
        userRoles.includes("MANAGER") ||
        userRoles.includes("COMPANY_ADMIN")
      ) {
        throw new Error("الإدارة لا يمكنها حذف حسابات إدارية أخرى.");
      }

      /* MANAGER cannot delete users linked to records
      if (user.approvals.length > 0) {
        throw new Error(
          "لا يمكن حذف المستخدم: مرتبط بسجلات موافقات المختبر. قم بالتعطيل بدلاً من ذلك.",
        );
      }

      const linkedRejections = await prisma.materialRejection.findFirst({
        where: {
          OR: [{ labUserId: id }, { managerUserId: id }],
        },
      });
      if (linkedRejections) {
        throw new Error(
          "لا يمكن حذف المستخدم: مرتبط بسجلات رفض المواد. قم بالتعطيل بدلاً من ذلك.",
        );
      } */
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error: unknown) {
    // console.error("Delete User Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
