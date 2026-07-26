"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function getCompanyBranding(companyId: number) {
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

  return prisma.companyBranding.findUnique({
    where: { companyId },
  });
}

export async function getCompanyBrandingBySlug(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { branding: true },
  });

  if (!company) return null;

  // Derive defaults from company name if branding is missing
  // We leave text fields null so the frontend can handle localization (Ar/En)
  const defaultBranding = {
    logoText: company.name.charAt(0).toUpperCase(),
    systemName: company.name,
    subtitle: null,
    loginButton: null,
    primaryColor: "#6366f1",
    secondaryColor: "#a855f7",
    accentColor: "#22d3ee",
    logoUrl: null,
    homeButtonShow: true,
    homeButtonTextAr: "الرئيسية",
    homeButtonTextEn: "HOME",
    homeButtonSize: "15px",
    homeButtonWeight: "font-extrabold",
    homeButtonTracking: "tracking-[0.3em]",
    homeButtonColor: null,
    homeButtonAnimation: "breath",
  };

  // Merge: Use DB branding if exists, otherwise defaults.
  // If DB branding exists but some fields are null/empty, we might want to fallback too,
  // but usually partial branding is valid. Here we mainly handle the "no branding record" case.
  if (!company.branding) {
    return defaultBranding;
  }

  // If branding exists, ensures fallbacks for critical text fields if they happens to be empty strings
  return {
    ...company.branding,
    logoText: company.branding.logoText || company.name.charAt(0).toUpperCase(),
    systemName: company.branding.systemName || company.name,
  };
}

export async function updateCompanyBranding(
  companyId: number,
  formData: FormData,
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

  const logoText = formData.get("logoText") as string;
  const systemName = formData.get("systemName") as string;
  const subtitle = formData.get("subtitle") as string;
  const loginButton = formData.get("loginButton") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const secondaryColor = formData.get("secondaryColor") as string;
  const accentColor = formData.get("accentColor") as string;

  const homeButtonShow = formData.get("homeButtonShow") === "true";
  const homeButtonTextAr = formData.get("homeButtonTextAr") as string;
  const homeButtonTextEn = formData.get("homeButtonTextEn") as string;
  const homeButtonSize = formData.get("homeButtonSize") as string;
  const homeButtonWeight = formData.get("homeButtonWeight") as string;
  const homeButtonTracking = formData.get("homeButtonTracking") as string;
  const homeButtonColor = formData.get("homeButtonColor") as string;
  const homeButtonAnimation = formData.get("homeButtonAnimation") as string;

  const logoFile = formData.get("logo") as File;
  let logoUrl = formData.get("currentLogoUrl") as string;

  if (logoFile && logoFile.size > 0) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });
      const slug = company?.slug || `company_${companyId}`;

      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), "public", "uploads", "logos");
      await mkdir(uploadDir, { recursive: true });

      const filename = `${slug}_updated_${Date.now()}_${logoFile.name.replace(/\s+/g, "_")}`;
      const path = join(uploadDir, filename);

      await writeFile(path, buffer);
      logoUrl = `/uploads/logos/${filename}`;
    } catch (error) {
      console.error("Branding Logo Upload Error:", error);
    }
  }

  const data = {
    logoUrl,
    logoText,
    systemName,
    subtitle,
    loginButton,
    primaryColor,
    secondaryColor,
    accentColor,
    homeButtonShow,
    homeButtonTextAr,
    homeButtonTextEn,
    homeButtonSize,
    homeButtonWeight,
    homeButtonTracking,
    homeButtonColor,
    homeButtonAnimation,
  };

  const branding = await prisma.companyBranding.upsert({
    where: { companyId },
    create: {
      companyId,
      ...data,
    },
    update: data,
  });

  revalidatePath(`/admin/companies/${companyId}/branding`);
  revalidatePath("/"); // Invalidate homepage if needed
  return branding;
}
