export type RoleName =
  | "SYSTEM_OWNER"
  | "COMPANY_ADMIN"
  | "DEPARTMENT_MANAGER"
  | "MANAGER"
  | "SALES"
  | "SALES_REP"
  | "SALES_MANAGER"
  | "LAB_TECH"
  | "LAB_ENGINEER"
  | "LAB_MANAGER"
  | "OPERATOR"
  | "ACCOUNTANT"
  | "GUARD"
  | "SAFETY";

const ROLE_MAP: Record<string, RoleName> = {
  "مدير نظام": "SYSTEM_OWNER",
  الإدارة: "COMPANY_ADMIN",
  "مدير قسم": "DEPARTMENT_MANAGER",
  "مسؤول متابعة الإنتاج": "DEPARTMENT_MANAGER",
  "متابع الإنتاج": "DEPARTMENT_MANAGER",
  مدير: "MANAGER",
  "مدير مبيعات": "SALES_MANAGER",
  "مدير المبيعات": "SALES_MANAGER",
  مبيعات: "SALES",
  "مندوب مبيعات": "SALES_REP",
  "مندوب المبيعات": "SALES_REP",
  "فني مختبر": "LAB_TECH",
  مختبر: "LAB_TECH",
  مشغل: "OPERATOR",
  محاسب: "ACCOUNTANT",
  أمن: "GUARD",
  سلامة: "SAFETY",
  "مدير مختبر": "LAB_MANAGER",
  "مهندس مختبر": "LAB_ENGINEER",
};

/**
 * Normalizes a role name from the database (which might be Arabic)
 * to its English constant equivalent used in middleware and logic.
 */
export function normalizeRole(roleName: string): RoleName | string {
  return ROLE_MAP[roleName] || roleName;
}

/**
 * Checks if a user with a certain role is allowed to access a module.
 * This is used to keep middleware and logic in sync.
 */
export function canAccessModule(role: string, module: string): boolean {
  // SYSTEM_OWNER can access everything
  if (role === "SYSTEM_OWNER") return true;

  const roleMappings: Record<string, string[]> = {
    manager: [
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "MANAGER",
      "SALES_MANAGER",
    ],
    lab: ["LAB_TECH", "LAB_ENGINEER", "LAB_MANAGER", "DEPARTMENT_MANAGER"], // Managers might need to see lab data
    operator: ["OPERATOR", "GUARD", "COMPANY_ADMIN", "DEPARTMENT_MANAGER"], // Let managers see plant status
    sales: ["SALES", "SALES_REP", "SALES_MANAGER", "COMPANY_ADMIN", "MANAGER"],
    accountant: ["ACCOUNTANT", "COMPANY_ADMIN"],
    safety: ["SAFETY", "COMPANY_ADMIN"],
    ai: ["COMPANY_ADMIN", "DEPARTMENT_MANAGER", "SALES_MANAGER"],
  };

  const allowedRoles = roleMappings[module];
  if (!allowedRoles) return true; // Public or unknown module

  return allowedRoles.includes(role);
}
