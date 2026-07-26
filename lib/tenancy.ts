import { headers } from "next/headers";
import { prisma } from "./prisma";

// ========================================
// GLOBAL MODELS - لا تخضع لعزل الشركات
// ========================================
export const GLOBAL_MODELS = [
  "SystemAlert", // تنبيهات النظام العامة
  "SystemSetting", // إعدادات النظام العامة
  "Plan", // خطط الاشتراكات (SaaS)
  "SystemPolicy", // سياسات النظام
  "BillingEvent", // أحداث الفوترة السيادية
  "ChangeRequest", // طلبات التغيير الإدارية
  "Feature", // الميزات المتوفرة عالمياً
  "PlanFeature", // ميزات الخطط
] as const;

// ========================================
// TENANTED MODELS - تخضع لعزل الشركات (يجب أن تحتوي على companyId)
// ========================================
export const TENANTED_MODELS = [
  "Material",
  "Vehicle",
  "InventoryTransaction",
  "Order",
  "MixDesign",
  "Customer",
  "Project",
  "LabReportConfig",
  "UsageCounter",
  "UsageEvent",
  "MaterialRejection",
  "Payment",
  "LedgerEntry",
  "Batch",
  "DeliveryTicket",
  "Department",
  "Role",
  "User",
  "CompanySetting",
  "AuditLog",
  "Domain",
  "Invite",
  "License",
  "Subscription",
  "Invoice",
  "OperationalExpense",
  "CompanyActivityLog",
] as const;

export type GlobalModel = (typeof GLOBAL_MODELS)[number];
export type TenantedModel = (typeof TENANTED_MODELS)[number];

/**
 * getTenantContext - تحديد سياق المستأجر بناءً على النطاق والشركة
 */
export async function getTenantContext(
  userId: number,
  requestCompanyId?: number,
) {
  const headerList = await headers();
  const host = headerList.get("host") || "";

  // استخراج النطاق الفرعي (Subdomain)
  const parts = host.split(".");
  let slug: string | null = null;

  if (parts.length >= 2 && !host.includes("localhost")) {
    slug = parts[0];
  } else if (parts.length >= 3) {
    slug = parts[0];
  }

  // النطاقات المحجوزة للنظام
  const reserved = ["www", "admin", "api", "app", "dev", "sys", "system"];
  if (slug && reserved.includes(slug)) {
    return { error: "RESERVED" };
  }

  // البحث عن الشركة بناءً على النطاق
  let company = null;
  if (slug) {
    company = await prisma.company.findUnique({
      where: { slug },
      include: { subscription: true },
    });
  }

  // إذا لم يتم تحديد شركة وكان الوصول عبر النطاق الرئيسي
  if (!slug && !requestCompanyId) {
    return { error: "NOT_FOUND" };
  }

  if (company) {
    // التحقق من تعارض الشركة مع جلسة المستخدم (لغير مالك النظام)
    if (requestCompanyId && company.id !== requestCompanyId) {
      return { company, error: "TENANT_MISMATCH" };
    }

    // التحقق من حالة الحساب
    if (company.status === "SUSPENDED" || company.status === "DISABLED") {
      return { company, error: "SUSPENDED" };
    }

    return {
      company,
      isLocked: company.isLocked || (company as any).suspensionLevel !== "NONE",
    };
  }

  return { error: "NOT_FOUND" };
}
