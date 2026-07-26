"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { signJWT } from "@/lib/security/jwt";

export async function registerCompany(formData: FormData) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const isRtl = lang === "ar";

  const t = {
    fillFields: isRtl
      ? "يرجى ملء جميع الحقول المطلوبة."
      : "Please fill all required fields.",
    companyExists: isRtl
      ? "اسم الشركة أو النطاق الفرعي مسجل مسبقاً."
      : "Company name or subdomain already registered.",
    emailExists: isRtl
      ? "البريد الإلكتروني مسجل مسبقاً."
      : "Email already registered.",
    regFailed: isRtl
      ? "فشل التسجيل. يرجى المحاولة مرة أخرى."
      : "Registration failed. Please try again.",
    adminRole: isRtl ? "مدير الشركة" : "Company Admin",
  };

  const companyName = formData.get("companyName") as string;
  const subdomain = formData.get("subdomain") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = formData.get("phone") as string;

  if (!companyName || !subdomain || !name || !email || !password) {
    return { success: false, error: t.fillFields };
  }

  try {
    // 1. Check uniqueness
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [{ name: companyName }, { slug: subdomain }],
      },
    });

    if (existingCompany) {
      return {
        success: false,
        error: t.companyExists,
      };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: t.emailExists };
    }

    // 2. Create Company & Admin User in transaction
    const registrationResult = await prisma.$transaction(async (tx) => {
      const hashedPassword = await hashPassword(password);

      // Create Company
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug: subdomain.toLowerCase(),
          status: "ACTIVE", // Or 'PENDING' / 'TRIAL_ACTIVE' if we implement approval
          branding: {
            create: {
              logoText: companyName.substring(0, 2).toUpperCase(),
            },
          },
        },
      });

      // Create Admin User (Without Role column)
      const user = await tx.user.create({
        data: {
          name,
          username: email, // Use email as username initially
          email,
          password: hashedPassword,
          companyId: company.id,
          phone,
        },
      });

      // Find System Role or Create One
      let adminRole = await tx.role.findFirst({
        where: { name: "COMPANY_ADMIN", isSystem: true },
      });

      // Fallback: Check if it exists with companyId null
      if (!adminRole) {
        adminRole = await tx.role.findFirst({
          where: { name: "COMPANY_ADMIN" },
        });
      }

      if (adminRole) {
        // Create Membership
        await tx.membership.create({
          data: {
            userId: user.id,
            companyId: company.id,
            roleId: adminRole.id,
          },
        });
      } else {
        const newRole = await tx.role.create({
          data: {
            name: "COMPANY_ADMIN",
            displayName: t.adminRole,
            companyId: company.id,
            isSystem: false,
          },
        });
        await tx.membership.create({
          data: {
            userId: user.id,
            companyId: company.id,
            roleId: newRole.id,
          },
        });
      }

      // Assign Free/Trial Plan if exists, or create default subscription
      let plan = await tx.plan.findFirst({ where: { key: "TRIAL" } });
      if (!plan) {
        // Fallback to any plan if TRIAL doesn't exist
        plan = await tx.plan.findFirst();
      }

      if (plan) {
        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: plan.id,
            status: "TRIALING",
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return { user, company };
    });

    const { user, company } = registrationResult;

    if (user && user.id) {
      // --- AUTO LOGIN LOGIC ---
      const { token, session } = await createSession(
        user.id,
        user.companyId ?? undefined,
      );

      // Set Cookie
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 Days
      });

      // JWT (for middleware/helpers)
      const jwtPayload = {
        userId: user.id,
        role: "COMPANY_ADMIN", // User is always COMPANY_ADMIN upon registration
        companyId: user.companyId ?? null,
      };
      const accessToken = await signJWT(jwtPayload, 60 * 60 * 24 * 7);

      cookieStore.set("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 Days
      });

      // Return redirect URL instead of simple success
      return { success: true, redirectUrl: "/system/manager/dashboard" };
    }

    return { success: true }; // Fallback (should not happen if transaction succeeds)
  } catch (error) {
    console.error("Registration error details:", error);
    return { success: false, error: t.regFailed };
  }
}
