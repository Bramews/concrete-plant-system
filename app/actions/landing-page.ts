"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type LandingPageConfig = {
  heroTitleAr: string;
  heroTitleEn: string;
  heroSubtitleAr: string;
  heroSubtitleEn: string;
  ctaTextAr: string;
  ctaTextEn: string;
  loginTextAr: string;
  loginTextEn: string;
  headerLogoTextAr: string;
  headerLogoTextEn: string;
  headerLogoInitial: string;
  backgroundStyle: string;
  primaryColor: string;
  features: Array<{
    icon: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
  }>;
};

const DEFAULT_CONFIG: LandingPageConfig = {
  heroTitleAr: "نظام إدارة مصانع الخرسانة",
  heroTitleEn: "Concrete Plant Management System",
  heroSubtitleAr:
    "الحل المتكامل لإدارة الإنتاج، الجودة، والمبيعات بأحدث التقنيات السحابية. تحكم كامل بمصنعك من أي مكان.",
  heroSubtitleEn:
    "The integrated solution for production, quality, and sales management with the latest cloud technologies. Full control from anywhere.",
  ctaTextAr: "ابدأ التجربة المجانية",
  ctaTextEn: "Start Free Trial",
  loginTextAr: "تسجيل الدخول",
  loginTextEn: "Login",
  headerLogoTextAr: "كونكريت كور",
  headerLogoTextEn: "Concrete Core",
  headerLogoInitial: "C",
  backgroundStyle: "blob",
  primaryColor: "indigo",
  features: [
    {
      icon: "Factory",
      titleAr: "إدارة الإنتاج",
      titleEn: "Production Management",
      descriptionAr: "تتبع الإنتاج والتشغيل لحظة بلحظة.",
      descriptionEn: "Real-time production tracking.",
    },
    {
      icon: "FlaskConical",
      titleAr: "مراقبة الجودة",
      titleEn: "Quality Control",
      descriptionAr: "ضبط جودة الخلطات والفحوصات المخبرية.",
      descriptionEn: "Mix quality control and lab tests.",
    },
    {
      icon: "Receipt",
      titleAr: "المبيعات الفورية",
      titleEn: "Sales & Invoicing",
      descriptionAr: "إدارة العقود والفواتير والعملاء.",
      descriptionEn: "Manage contracts, invoices, and clients.",
    },
    {
      icon: "Cloud",
      titleAr: "تقارير ذكية",
      titleEn: "Smart Reports",
      descriptionAr:
        "بياناتك آمنة ومشفرة، مع نسخ احتياطي تلقائي وإمكانية الوصول من أي جهاز.",
      descriptionEn:
        "Your data is secure and encrypted, with auto-backups and access from any device.",
    },
  ],
};

export async function getLandingPageConfig(): Promise<LandingPageConfig> {
  try {
    const config = await prisma.landingPageConfig.findFirst({
      where: { id: 1 },
    });

    if (!config) {
      return DEFAULT_CONFIG;
    }

    let parsedFeatures = [];
    try {
      parsedFeatures = JSON.parse(config.features);
    } catch (_) {
      parsedFeatures = DEFAULT_CONFIG.features;
    }

    return {
      heroTitleAr: config.heroTitleAr,
      heroTitleEn: config.heroTitleEn,
      heroSubtitleAr: config.heroSubtitleAr,
      heroSubtitleEn: config.heroSubtitleEn,
      ctaTextAr: config.ctaTextAr,
      ctaTextEn: config.ctaTextEn,
      loginTextAr: config.loginTextAr,
      loginTextEn: config.loginTextEn,
      headerLogoTextAr: config.headerLogoTextAr,
      headerLogoTextEn: config.headerLogoTextEn,
      headerLogoInitial: config.headerLogoInitial,
      backgroundStyle: config.backgroundStyle,
      primaryColor: config.primaryColor,
      features:
        parsedFeatures.length > 0 ? parsedFeatures : DEFAULT_CONFIG.features,
    };
  } catch (error) {
    console.warn("[LandingPage] Falling back to default config:", error);
    return DEFAULT_CONFIG;
  }
}


export async function updateLandingPageConfig(data: LandingPageConfig) {
  // Check permission (System Owner only)
  // For now we assume the caller checks or the page is protected.
  // Ideally use verifySystemOwner() here.

  // Ensure defaults for create, avoiding undefined overwrites
  const createData = {
    heroTitleAr: data.heroTitleAr || DEFAULT_CONFIG.heroTitleAr,
    heroTitleEn: data.heroTitleEn || DEFAULT_CONFIG.heroTitleEn,
    heroSubtitleAr: data.heroSubtitleAr || DEFAULT_CONFIG.heroSubtitleAr,
    heroSubtitleEn: data.heroSubtitleEn || DEFAULT_CONFIG.heroSubtitleEn,
    ctaTextAr: data.ctaTextAr || DEFAULT_CONFIG.ctaTextAr,
    ctaTextEn: data.ctaTextEn || DEFAULT_CONFIG.ctaTextEn,
    loginTextAr: data.loginTextAr || DEFAULT_CONFIG.loginTextAr,
    loginTextEn: data.loginTextEn || DEFAULT_CONFIG.loginTextEn,
    headerLogoTextAr: data.headerLogoTextAr || DEFAULT_CONFIG.headerLogoTextAr,
    headerLogoTextEn: data.headerLogoTextEn || DEFAULT_CONFIG.headerLogoTextEn,
    headerLogoInitial:
      data.headerLogoInitial || DEFAULT_CONFIG.headerLogoInitial,
    backgroundStyle: data.backgroundStyle || DEFAULT_CONFIG.backgroundStyle,
    primaryColor: data.primaryColor || DEFAULT_CONFIG.primaryColor,
    features: data.features || DEFAULT_CONFIG.features,
  };

  await prisma.landingPageConfig.upsert({
    where: { id: 1 },
    update: {
      heroTitleAr: data.heroTitleAr,
      heroTitleEn: data.heroTitleEn,
      heroSubtitleAr: data.heroSubtitleAr,
      heroSubtitleEn: data.heroSubtitleEn,
      ctaTextAr: data.ctaTextAr,
      ctaTextEn: data.ctaTextEn,
      loginTextAr: data.loginTextAr,
      loginTextEn: data.loginTextEn,
      headerLogoTextAr: data.headerLogoTextAr,
      headerLogoTextEn: data.headerLogoTextEn,
      headerLogoInitial: data.headerLogoInitial,
      backgroundStyle: data.backgroundStyle,
      primaryColor: data.primaryColor,
      features: data.features ? JSON.stringify(data.features) : undefined,
    },
    create: {
      id: 1,
      heroTitleAr: createData.heroTitleAr,
      heroTitleEn: createData.heroTitleEn,
      heroSubtitleAr: createData.heroSubtitleAr,
      heroSubtitleEn: createData.heroSubtitleEn,
      ctaTextAr: createData.ctaTextAr,
      ctaTextEn: createData.ctaTextEn,
      loginTextAr: createData.loginTextAr,
      loginTextEn: createData.loginTextEn,
      headerLogoTextAr: createData.headerLogoTextAr,
      headerLogoTextEn: createData.headerLogoTextEn,
      headerLogoInitial: createData.headerLogoInitial,
      backgroundStyle: createData.backgroundStyle,
      primaryColor: createData.primaryColor,
      features: JSON.stringify(createData.features),
    },
  });

  revalidatePath("/");
  return { success: true };
}
