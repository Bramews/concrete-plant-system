"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole, getCurrentUser } from "@/lib/auth";

// Validation schema
const createCompanySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric"),
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  plan: z.enum(["BASIC", "PREMIUM", "ENTERPRISE", "TRIAL"]).default("TRIAL"),
});

export type CreateCompanyState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createCompany(
  prevState: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  await requireRole(["SYSTEM_OWNER"]);

  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    password: formData.get("password"),
    plan: formData.get("plan"),
  };

  const validated = createCompanySchema.safeParse(rawData);

  if (!validated.success) {
    const fieldErrors: Record<string, string> = {};
    validated.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
    });
    return { error: "Validation failed", fieldErrors };
  }

  const { name, slug, adminName, adminEmail, password, plan } = validated.data;

  try {
    // Check if slug exists
    const existingSlug = await prisma.company.findUnique({ where: { slug } });
    if (existingSlug) {
      return {
        error: "Company ID (Slug) already exists",
        fieldErrors: { slug: "This ID is already taken" },
      };
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      return {
        error: "Email already registered in the system",
        fieldErrors: { adminEmail: "Email already in use" },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction to create everything
    const newCompany = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name,
          slug,
          status: "ACTIVE",
          features: {
            create: [{ key: "CORE_MODULES", enabled: true, tier: plan }],
          },
        },
      });

      // 2. Create Admin User & Assign Role
      // Use findFirst with companyId: null to find the GLOBAL template role
      const role = await tx.role.findFirst({
        where: { name: "COMPANY_ADMIN", companyId: null },
      });
      if (!role)
        throw new Error(
          "System Role COMPANY_ADMIN not found. Please ask System Owner to seed roles.",
        );

      const user = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          companyId: company.id,
          username: `${slug}_admin`, // Generate a default username
          status: "ACTIVE",
          memberships: {
            create: {
              companyId: company.id,
              roleId: role.id,
            },
          },
        },
      });

      // 3. Create License
      await tx.license.create({
        data: {
          companyId: company.id,
          type: plan,
          maxUsers: plan === "ENTERPRISE" ? 100 : plan === "PREMIUM" ? 20 : 5,
          modules: "FULL_SUITE", // Default for now
        },
      });

      return company;
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COMPANY_CREATE",
        details: `Created new company: ${name} (${slug}) with plan ${plan}`,
        entity: "Company",
        entityId: String(newCompany.id),
        userId: 1, // System Owner
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Create company error:", error);
    // Return actual error message for debugging
    return {
      error: `Failed to create company: ${error.message || "Unknown system error"}`,
      fieldErrors: { slug: error.message }, // Hack to show error in UI if needed
    };
  }
}

export async function updateCompanyStatus(
  companyId: number,
  status: "ACTIVE" | "SUSPENDED",
) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const currentState = await prisma.company.findUnique({
      where: { id: companyId },
      select: { status: true, name: true },
    });
    if (currentState?.status === status) return { success: true };

    await prisma.company.update({
      where: { id: companyId },
      data: { status },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: `COMPANY_${status}`,
        details: `Company ${currentState?.name || companyId} status changed to ${status}`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Update company status error:", error);
    return { error: "Failed to update status." };
  }
}

export async function deleteCompany(companyId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // Unified Professional Soft Delete
    await prisma.company.delete({
      where: { id: companyId },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COMPANY_DELETE",
        details: `Deleted company: ${company?.name || companyId}`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete company error:", error);
    return { error: "Failed to delete company." };
  }
}

export async function updateCompanyDetails(
  companyId: number,
  data: {
    name?: string;
    slug?: string;
    address?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const original = await prisma.company.findUnique({
      where: { id: companyId },
    });

    await prisma.company.update({
      where: { id: companyId },
      data,
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COMPANY_UPDATE",
        details: `Updated company details for ${original?.name}: ${JSON.stringify(data)}`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Update company details error:", error);
    return { error: "Failed to update company details." };
  }
}

export async function toggleCompanyLock(
  companyId: number,
  shouldLock: boolean,
) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const currentState = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: {
        isLocked: shouldLock,
        suspensionLevel: shouldLock ? "READ_ONLY" : "NONE",
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: shouldLock ? "COMPANY_LOCK" : "COMPANY_UNLOCK",
        details: `Company ${currentState?.name} lock status set to ${shouldLock}`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Lock/Unlock company error:", error);
    return { error: "Failed to update lock status." };
  }
}

export async function createCompanyUser(companyId: number, formData: FormData) {
  await requireRole(["SYSTEM_OWNER", "COMPANY_ADMIN", "DEPARTMENT_MANAGER"]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleName = formData.get("roleName") as string;
  const manualUsername = formData.get("username") as string;
  const phone = formData.get("phone") as string;

  if (!name || !email || !password || !roleName) {
    return {
      error: "جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور، الدور) ناقصة",
    };
  }

  try {
    // 1. Check if user exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { where: { companyId } } },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find Role
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return { error: "الدور المحدد غير صالح" };
    }

    // Get Company Slug for username generation
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });

    if (!company) return { error: "الشركة غير موجودة" };

    const username =
      manualUsername ||
      `${company.slug}_${name.split(" ")[0].toLowerCase()}_${Math.floor(Math.random() * 1000)}`;

    if (existingUser) {
      // Check if they have an active membership here
      const activeMembership = existingUser.memberships.find(
        (m) => !m.deletedAt,
      );
      if (activeMembership) {
        return { error: "هذا المستخدم عضو نشط بالفعل في هذه الشركة" };
      }

      // Check if username is taken by another user
      const usernameOccupied = await prisma.user.findFirst({
        where: { username, NOT: { id: existingUser.id } },
      });
      if (usernameOccupied) {
        return { error: "اسم المستخدم هذا مستخدم من قبل حساب آخر" };
      }

      // Reactivate User
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            username,
            password: hashedPassword,
            phone: phone || null,
            companyId: companyId,
            status: "ACTIVE",
          },
        });

        const membership = await tx.membership.findUnique({
          where: { userId_companyId: { userId: existingUser.id, companyId } },
        });

        if (membership) {
          await tx.membership.update({
            where: { id: membership.id },
            data: {
              deletedAt: null,
              status: "ACTIVE",
              roleId: role.id,
            },
          });
        } else {
          await tx.membership.create({
            data: {
              userId: existingUser.id,
              companyId,
              roleId: role.id,
              status: "ACTIVE",
            },
          });
        }
      });

      revalidatePath(`/admin/companies/${companyId}`);
      return { success: true };
    }

    // 2. Scenario: New User. Check if username exists globally.
    console.log("🔍 [DEBUG] Checking if username exists:", username);
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      console.log("❌ [DEBUG] Username already exists");
      return { error: "اسم المستخدم موجود بالفعل" };
    }
    console.log("✅ [DEBUG] Username available");

    // 🔴 DEBUG MODE: NO TRANSACTION - Sequential operations
    console.log("📝 [DEBUG] Creating user...");
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        phone: phone || null,
        companyId: companyId,
        status: "ACTIVE",
      },
    });
    console.log("✅ [DEBUG] User created:", newUser.id);

    console.log("📝 [DEBUG] Creating membership...");
    await prisma.membership.create({
      data: {
        userId: newUser.id,
        companyId: companyId,
        roleId: role.id,
        status: "ACTIVE",
      },
    });
    console.log("✅ [DEBUG] Membership created");

    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Create company user error:", error);
    return { error: "فشل في إنشاء أو تحديث المستخدم" };
  }
}

export async function updateCompanySettingAction(key: string, value: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    throw new Error("Unauthorized or no company context");
  }

  if (user.role !== "COMPANY_ADMIN" && user.role !== "SYSTEM_OWNER") {
    throw new Error("Insufficient permissions");
  }

  try {
    await prisma.companySetting.upsert({
      where: {
        companyId_key: {
          companyId: user.companyId,
          key: key,
        },
      },
      update: { value },
      create: {
        companyId: user.companyId,
        key,
        value,
      },
    });

    revalidatePath("/system/settings/company");
    return { success: true };
  } catch (error) {
    console.error("Update company setting error:", error);
    throw new Error("Failed to update setting");
  }
}

export async function getCompanySettings() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    throw new Error("Unauthorized or no company context");
  }

  const [companySettings, systemSettings] = await Promise.all([
    prisma.companySetting.findMany({
      where: { companyId: user.companyId },
    }),
    prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "CURRENCY",
            "TIMEZONE",
            "LANGUAGE",
            "COMPANY_NAME_DISPLAY",
            "THEME_COLOR",
          ],
        },
      },
    }),
  ]);

  return { companySettings, systemSettings };
}

export async function updateTenantVoiceSetting(
  companyId: number,
  enabled: boolean,
) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    await prisma.companySetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: "voice_assistant_enabled",
        },
      },
      update: { value: String(enabled) },
      create: {
        companyId,
        key: "voice_assistant_enabled",
        value: String(enabled),
      },
    });
    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Update tenant voice setting error:", error);
    return { error: "فشل في تحديث إعدادات المساعد الصوتي" };
  }
}
