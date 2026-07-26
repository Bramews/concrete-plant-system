"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type RegisterPageConfig = {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;

  companyNameAr: string;
  companyNameEn: string;
  subdomainAr: string;
  subdomainEn: string;
  nameAr: string;
  nameEn: string;
  emailAr: string;
  emailEn: string;
  passwordAr: string;
  passwordEn: string;
  phoneAr: string;
  phoneEn: string;
  submitTextAr: string;
  submitTextEn: string;

  loginLinkTextAr: string;
  loginLinkTextEn: string;

  brandingNameAr: string;
  brandingNameEn: string;

  backgroundStyle: string;
  primaryColor: string;
};

const DEFAULT_CONFIG: RegisterPageConfig = {
  titleAr: "إنشاء حساب جديد",
  titleEn: "Create New Account",
  subtitleAr: "ابدأ فترتك التجريبية لمدة 14 يوماً مجاناً.",
  subtitleEn: "Start your 14-day free trial.",

  companyNameAr: "اسم الشركة",
  companyNameEn: "Company Name",
  subdomainAr: "النطاق الفرعي (إنجليزي)",
  subdomainEn: "Subdomain (English)",
  nameAr: "الاسم الكامل",
  nameEn: "Full Name",
  emailAr: "البريد الإلكتروني",
  emailEn: "Email",
  passwordAr: "كلمة المرور",
  passwordEn: "Password",
  phoneAr: "رقم الهاتف",
  phoneEn: "Phone Number",
  submitTextAr: "إنشاء الحساب",
  submitTextEn: "Create Account",

  loginLinkTextAr: "لديك حساب بالفعل؟ تسجيل الدخول",
  loginLinkTextEn: "Already have an account? Login",

  brandingNameAr: "كونكريت كور",
  brandingNameEn: "Concrete Core",

  backgroundStyle: "blob",
  primaryColor: "indigo",
};

export async function getRegisterPageConfig(): Promise<RegisterPageConfig> {
  const config = await prisma.registerPageConfig.findFirst({
    where: { id: 1 },
  });

  if (!config) {
    return DEFAULT_CONFIG;
  }

  return {
    titleAr: config.titleAr,
    titleEn: config.titleEn,
    subtitleAr: config.subtitleAr,
    subtitleEn: config.subtitleEn,

    companyNameAr: config.companyNameAr,
    companyNameEn: config.companyNameEn,
    subdomainAr: config.subdomainAr,
    subdomainEn: config.subdomainEn,
    nameAr: config.nameAr,
    nameEn: config.nameEn,
    emailAr: config.emailAr,
    emailEn: config.emailEn,
    passwordAr: config.passwordAr,
    passwordEn: config.passwordEn,
    phoneAr: config.phoneAr,
    phoneEn: config.phoneEn,
    submitTextAr: config.submitTextAr,
    submitTextEn: config.submitTextEn,

    loginLinkTextAr: config.loginLinkTextAr,
    loginLinkTextEn: config.loginLinkTextEn,

    brandingNameAr: config.brandingNameAr,
    brandingNameEn: config.brandingNameEn,

    backgroundStyle: config.backgroundStyle,
    primaryColor: config.primaryColor,
  };
}

export async function updateRegisterPageConfig(data: RegisterPageConfig) {
  // Ensure defaults
  const createData = { ...DEFAULT_CONFIG, ...data };

  await prisma.registerPageConfig.upsert({
    where: { id: 1 },
    update: data,
    create: {
      id: 1,
      ...createData,
    },
  });

  revalidatePath("/register");
  return { success: true };
}
