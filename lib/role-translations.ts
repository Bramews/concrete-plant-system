/**
 * قاموس ترجمة الأدوار
 * Role Translation Dictionary - Arabic
 *
 * This file provides a centralized, comprehensive role translation map
 * to ensure consistent Arabic display across the entire system.
 */

export const ROLE_TRANSLATIONS: Record<string, string> = {
  // System Level
  SYSTEM_OWNER: "مالك النظام",
  "System Owner": "مالك النظام",

  // Company Management
  COMPANY_ADMIN: "مدير الشركة",
  "Company Admin": "مدير الشركة",
  MANAGER: "مدير المحطة",
  Manager: "مدير المحطة",
  DEPARTMENT_MANAGER: "مسؤول متابعة الإنتاج",
  "Department Manager": "مسؤول متابعة الإنتاج",

  // Departments
  ADMINISTRATION: "الإدارة",
  Administration: "الإدارة",
  LABORATORY: "المختبر",
  Laboratory: "المختبر",
  ACCOUNTING: "الحسابات",
  Accounting: "الحسابات",
  OPERATIONS: "التشغيل",
  Operations: "التشغيل",
  SALES: "المبيعات",
  Sales: "المبيعات",
  DISPATCH: "الحركة",
  Dispatch: "الحركة",

  // Sub-users / Positions
  ENGINEER: "مهندس",
  Engineer: "مهندس",
  TECHNICIAN: "فني",
  Technician: "فني",
  WORKER: "عامل",
  Worker: "عامل",
  AUDITOR: "مدقق",
  Auditor: "مدقق",
  ACCOUNTANT: "محاسب",
  Accountant: "محاسب",
  OPERATOR: "مشغل",
  Operator: "مشغل",
  DRIVER: "سائق",
  Driver: "سائق",
  SALES_REP: "مندوب مبيعات",
  "Sales Rep": "مندوب مبيعات",
  SALES_REPRESENTATIVE: "مندوب مبيعات",
  "Sales Representative": "مندوب مبيعات",
  LAB_TECH: "فني مختبر",
  "Lab Tech": "فني مختبر",
  LAB_TECHNICIAN: "فني مختبر",
  "Lab Technician": "فني مختبر",
  DISPATCHER: "مسؤول الحركة",
  Dispatcher: "مسؤول الحركة",
};

/**
 * Translates a role name to Arabic
 * Falls back to displayName or the original name if no translation found
 */
export function translateRole(
  name: string,
  displayName?: string | null,
): string {
  if (!name) return "غير محدد";

  // 1. If displayName is Arabic, use it first to respect DB overrides
  if (displayName && /[\u0600-\u06FF]/.test(displayName)) {
    return displayName;
  }

  // 2. Try direct lookup
  if (ROLE_TRANSLATIONS[name]) {
    return ROLE_TRANSLATIONS[name];
  }

  // Try uppercase lookup
  const upperName = name.toUpperCase().replace(/\s+/g, "_");
  if (ROLE_TRANSLATIONS[upperName]) {
    return ROLE_TRANSLATIONS[upperName];
  }

  // Try displayName
  if (displayName && ROLE_TRANSLATIONS[displayName]) {
    return ROLE_TRANSLATIONS[displayName];
  }

  // Last resort: return displayName or name
  return displayName || name;
}

/**
 * Gets the list of available roles for user creation forms
 * Excludes system-level roles that shouldn't be assigned to company users
 */
export const ASSIGNABLE_ROLES = [
  "COMPANY_ADMIN",
  "ADMINISTRATION",
  "LABORATORY",
  "ACCOUNTING",
  "OPERATIONS",
  "SALES",
  "DISPATCH",
  "ENGINEER",
  "TECHNICIAN",
  "WORKER",
  "AUDITOR",
  "ACCOUNTANT",
  "OPERATOR",
  "DRIVER",
  "SALES_REP",
  "LAB_TECH",
  "DISPATCHER",
];

/**
 * Roles that should never be shown in user creation forms
 */
export const SYSTEM_ONLY_ROLES = ["SYSTEM_OWNER"];
