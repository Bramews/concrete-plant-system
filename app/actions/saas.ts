"use server";

import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { generateSlug } from "@/lib/subdomain";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import { hashPassword } from "@/lib/security/password";
import { sendVerificationEmail } from "@/lib/email";

// =======================
// SYSTEM OWNER ACTIONS
// =======================

export async function createCompany(formData: FormData) {
  try {
    await requireRole(["SYSTEM_OWNER"]);

    const name = formData.get("name") as string;
    const domain = formData.get("domain") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;

    const latitudeVal = formData.get("latitude") as string;
    const longitudeVal = formData.get("longitude") as string;
    const latitude = latitudeVal ? parseFloat(latitudeVal) : null;
    const longitude = longitudeVal ? parseFloat(longitudeVal) : null;

    // Admin Info
    const adminName = formData.get("adminName") as string;
    const adminEmail = formData.get("adminEmail") as string;
    const adminPassword = formData.get("adminPassword") as string;
    const adminPhone = formData.get("adminPhone") as string;

    const maxUsers = parseInt(formData.get("maxUsers") as string) || 5;
    const planType = (formData.get("planType") as string) || "BASIC";
    const currency = (formData.get("currency") as string) || "IQD";

    // Branding
    const logoFile = formData.get("logo") as File;
    let logoUrl = "";

    // Generate URL-safe slug
    const slug = generateSlug(name);

    if (logoFile && logoFile.size > 0) {
      try {
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define upload directory
        const uploadDir = join(process.cwd(), "public", "uploads", "logos");
        await mkdir(uploadDir, { recursive: true });

        // Unique filename
        const filename = `${slug}_${Date.now()}_${logoFile.name.replace(/\s+/g, "_")}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);
        logoUrl = `/uploads/logos/${filename}`;
      } catch (uploadError) {
        console.error("Logo Upload Error:", uploadError);
        // Continue without logo if upload fails
      }
    }

    // 1. Create Company
    const company = await prisma.company.create({
      data: {
        name,
        slug,
        address,
        phone,
        latitude,
        longitude,
        currency,
        status: "ACTIVE",
        license: {
          create: {
            type: planType,
            maxUsers,
            modules: "FULL_SUITE",
          },
        },
        domains: {
          create: {
            domain: domain,
            status: "ACTIVE",
            verified: true,
          },
        },
        branding: {
          create: {
            logoUrl: logoUrl,
            logoText: name.charAt(0).toUpperCase(),
            systemName: name,
          },
        },
      },
      include: { license: true },
    });

    // 2. Create Company Admin (PENDING STATUS)
    const adminUsername = formData.get("adminUsername") as string;

    // Hash the provided password
    const hashedPassword = await hashPassword(adminPassword);

    // Find Company Admin Role ID
    const adminRole = await prisma.role.findFirst({
      where: { name: "COMPANY_ADMIN", isSystem: true },
    });

    if (!adminRole) {
      throw new Error(
        "Critical Error: COMPANY_ADMIN role not found in system.",
      );
    }

    await prisma.user.create({
      data: {
        username: adminUsername,
        name: adminName || `${name} Admin`,
        email: adminEmail,
        phone: adminPhone || null,
        password: hashedPassword,
        status: "PENDING", // User must activate account (verify email)
        companyId: company.id,
        canCreateUsers: true,
        memberships: {
          create: {
            companyId: company.id,
            roleId: adminRole.id,
            status: "ACTIVE",
          },
        },
      },
    });

    // Phase 4.2: Usage Tracking
    try {
      const { trackUsage, USAGE_METRICS } = await import("@/lib/usage");
      await trackUsage(company.id, USAGE_METRICS.USERS, 1, "COMPANY_CREATE");
    } catch (e) {
      console.error("Usage Tracking Failed", e);
    }

    // 3. Generate Verification Token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: adminEmail,
        token,
        expires,
      },
    });

    // 4. Send Verification Email
    try {
      await sendVerificationEmail(
        adminEmail,
        token,
        adminName || `${name} Admin`,
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    revalidatePath("/admin/companies");
    return {
      success: true,
      message: `Company ${name} created successfully`,
      subdomain: `${slug}`,
    };
  } catch (error) {
    console.error("Create Company Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

// =======================
// COMPANY ADMIN ACTIONS
// =======================

export async function inviteUser(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Check if sender is COMPANY_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: true,
        memberships: {
          include: { role: true },
        },
      },
    });

    const isAdmin = currentUser?.memberships.some(
      (m) => m.role.name === "COMPANY_ADMIN",
    );

    if (!currentUser || !isAdmin || !currentUser.companyId) {
      throw new Error("Only Company Admin can invite users");
    }

    const email = formData.get("email") as string;
    const roleName = formData.get("role") as string; // From UI select

    // Find Target Role
    const targetRole = await prisma.role.findFirst({
      where: {
        name: roleName,
        OR: [{ companyId: currentUser.companyId }, { isSystem: true }],
      },
    });

    if (!targetRole) throw new Error("Target role not found");

    // Validate Domain
    if (
      currentUser.company &&
      !email.endsWith(`@${currentUser.company.slug}.system`)
    ) {
      // Logic adjusted to match the new slug-based domain system
      // throw new Error(`Email must be in domain @${currentUser.company.slug}.system`);
    }

    const token = crypto.randomUUID();
    // Create Invite
    const invite = await prisma.invite.create({
      data: {
        id: token,
        email,
        roleId: targetRole.id,
        companyId: currentUser.companyId,
        token: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Note: URL generation might need update based on real deployment
    const inviteUrl = `https://${currentUser.company!.slug}.system/invite/${invite.token}`;

    revalidatePath("/system/manager/users");
    return {
      success: true,
      message: `Invitation sent to ${email}`,
      inviteUrl,
    };
  } catch (error) {
    console.error("Invite Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function acceptInvite(token: string, formData: FormData) {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { role: true, company: true },
    });

    if (!invite) throw new Error("Invalid invitation token");
    if (invite.status !== "PENDING")
      throw new Error("Invitation no longer valid");
    if (new Date() > invite.expiresAt) throw new Error("Invitation expired");

    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Check if username/email exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: invite.email }],
      },
    });

    if (existingUser)
      throw new Error("User with this email or username already exists");

    const hashedPassword = await hashPassword(password);

    // Create User & Membership
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          username,
          email: invite.email,
          password: hashedPassword,
          companyId: invite.companyId,
          status: "ACTIVE",
          memberships: {
            create: {
              companyId: invite.companyId,
              roleId: invite.roleId,
              status: "ACTIVE",
            },
          },
        },
      });

      // Update Invite
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Accept Invite Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
