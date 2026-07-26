// Role names as string constants (Role is now a model, not an enum)
export const ALL_ROLES = [
  "SYSTEM_OWNER",
  "COMPANY_ADMIN",
  "MANAGER",
  "DEPARTMENT_MANAGER",
  "LAB_MANAGER",
  "LAB_ENGINEER",
  "LAB_TECH",
  "LAB_WORKER",
  "OPERATOR",
  "WORKER",
  "ACCOUNTANT",
  "AUDITOR",
  "SALES",
  "SALES_REP",
  "SALES_MANAGER",
  "GUARD",
  "SAFETY",
  "SECURITY",
  "DISPATCHER",
  "DRIVER",
] as const;

export type SystemRole = (typeof ALL_ROLES)[number];
export type RoleName = SystemRole;

export const PERMISSIONS = [
  "USERS_CREATE",
  "USERS_READ",
  "USERS_UPDATE",
  "USERS_DELETE",
  "ROLES_CREATE",
  "ROLES_READ",
  "ROLES_UPDATE",
  "ROLES_DELETE",
  "ORDERS_CREATE",
  "ORDERS_READ",
  "ORDERS_UPDATE",
  "ORDERS_DELETE",
  "ORDERS_APPROVE",
  "PROJECTS_CREATE",
  "PROJECTS_READ",
  "PROJECTS_UPDATE",
  "PROJECTS_DELETE",
  "CLIENTS_CREATE",
  "CLIENTS_READ",
  "CLIENTS_UPDATE",
  "CLIENTS_DELETE",
  "MIX_DESIGNS_CREATE",
  "MIX_DESIGNS_READ",
  "MIX_DESIGNS_UPDATE",
  "MIX_DESIGNS_DELETE",
  "LAB_TESTS_CREATE",
  "LAB_TESTS_READ",
  "LAB_TESTS_UPDATE",
  "LAB_TESTS_DELETE",
  "PRODUCTION_CREATE",
  "PRODUCTION_READ",
  "PRODUCTION_UPDATE",
  "PRODUCTION_DELETE",
  "FLEET_READ",
  "INVENTORY_READ",
  "INVOICES_READ",
  "REPORTS_READ",
  "SETTINGS_UPDATE",
  "AUDIT_LOGS_READ",
] as const;

export type PermissionType = (typeof PERMISSIONS)[number];

export const ROLE_DEFAULT_PERMISSIONS: Partial<Record<RoleName, string[]>> = {
  SYSTEM_OWNER: [...PERMISSIONS],
  COMPANY_ADMIN: [...PERMISSIONS],
  MANAGER: [
    "USERS_READ",
    "ORDERS_CREATE",
    "ORDERS_READ",
    "ORDERS_UPDATE",
    "PROJECTS_READ",
    "CLIENTS_READ",
    "MIX_DESIGNS_READ",
  ],
  SALES: [
    "ORDERS_CREATE",
    "ORDERS_READ",
    "ORDERS_UPDATE",
    "ORDERS_DELETE",
    "PROJECTS_READ",
    "CLIENTS_READ",
    "MIX_DESIGNS_READ",
  ],
  SALES_REP: [
    "ORDERS_CREATE",
    "ORDERS_READ",
    "ORDERS_UPDATE",
    "PROJECTS_READ",
    "CLIENTS_READ",
    "MIX_DESIGNS_READ",
  ],
  OPERATOR: ["ORDERS_READ", "PRODUCTION_READ"],
  LAB_TECH: ["LAB_TESTS_CREATE", "LAB_TESTS_READ", "MIX_DESIGNS_READ"],
  LAB_ENGINEER: [
    "LAB_TESTS_CREATE",
    "LAB_TESTS_READ",
    "LAB_TESTS_UPDATE",
    "MIX_DESIGNS_CREATE",
    "MIX_DESIGNS_READ",
    "MIX_DESIGNS_UPDATE",
  ],
  LAB_MANAGER: [
    "LAB_TESTS_CREATE",
    "LAB_TESTS_READ",
    "LAB_TESTS_UPDATE",
    "LAB_TESTS_DELETE",
    "MIX_DESIGNS_CREATE",
    "MIX_DESIGNS_READ",
    "MIX_DESIGNS_UPDATE",
    "MIX_DESIGNS_DELETE",
    "ORDERS_APPROVE",
  ],
};

// ─── 2. من يستطيع الوصول لكل قطاع (مسار URL) ───
// المفتاح = الجزء الثاني من المسار بعد /system/
// القيمة = الأدوار المسموح لها بالدخول
export const SECTOR_ACCESS: Record<string, SystemRole[]> = {
  manager: [
    "SYSTEM_OWNER",
    "COMPANY_ADMIN",
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "LAB_MANAGER",
    "SALES_MANAGER",
  ],
  lab: [
    "SYSTEM_OWNER",
    "LAB_TECH",
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "DEPARTMENT_MANAGER",
    "COMPANY_ADMIN",
  ],
  operator: [
    "SYSTEM_OWNER",
    "OPERATOR",
    "GUARD",
    "SECURITY",
    "DEPARTMENT_MANAGER",
    "COMPANY_ADMIN",
  ],
  sales: [
    "SYSTEM_OWNER",
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "COMPANY_ADMIN",
    "MANAGER",
  ],
  accountant: ["SYSTEM_OWNER", "ACCOUNTANT", "AUDITOR", "COMPANY_ADMIN"],
  safety: ["SYSTEM_OWNER", "SECURITY", "GUARD", "SAFETY", "COMPANY_ADMIN"],
  dashboard: [...ALL_ROLES], // الكل يرى الـ dashboard
};

// ─── 3. من يستطيع إنشاء أي دور (هرمية التوظيف) ───
// القاعدة: لا تفوّض ما لا تملكه.
// المفتاح = دور المنشئ
// القيمة = الأدوار التي يستطيع المنشئ إنشاءها
export const CAN_CREATE_ROLE: Record<string, SystemRole[]> = {
  SYSTEM_OWNER: [
    "COMPANY_ADMIN",
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "LAB_MANAGER",
    "LAB_ENGINEER",
    "LAB_TECH",
    "LAB_WORKER",
    "OPERATOR",
    "WORKER",
    "ACCOUNTANT",
    "AUDITOR",
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "DISPATCHER",
    "DRIVER",
    "SECURITY",
    "GUARD",
    "SAFETY",
  ],
  COMPANY_ADMIN: [
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "LAB_MANAGER",
    "SALES_MANAGER",
    "OPERATOR",
  ],
  MANAGER: [
    "DEPARTMENT_MANAGER",
    "LAB_MANAGER",
    "SALES_MANAGER",
    "OPERATOR",
    "WORKER",
  ],
  LAB_MANAGER: ["LAB_ENGINEER", "LAB_TECH", "LAB_WORKER", "WORKER"],
  DEPARTMENT_MANAGER: ["OPERATOR", "WORKER"],
  SALES_MANAGER: ["SALES_REP", "DISPATCHER", "DRIVER"],
};

// ─── 4. الدالة الرئيسية للتحقق من صلاحية الدخول لقطاع ───
export function canAccessSector(role: string, sector: string): boolean {
  if (role === "SYSTEM_OWNER") return true;
  const allowed = SECTOR_ACCESS[sector];
  if (!allowed) return true; // قطاع غير معروف = مفتوح
  return allowed.includes(role as SystemRole);
}

// ─── 5. الدالة الرئيسية للتحقق من صلاحية إنشاء دور ───
export function canCreateUserWithRole(
  creatorRole: string,
  targetRole: string,
): boolean {
  if (creatorRole === "SYSTEM_OWNER") return true;
  const allowed = CAN_CREATE_ROLE[creatorRole];
  if (!allowed) return false;
  return allowed.includes(targetRole as SystemRole);
}

// ─── 6. جلب الأدوار التي يستطيع شخص ما إنشاءها (للواجهة) ───
export function getCreatableRoles(creatorRole: string): SystemRole[] {
  if (creatorRole === "SYSTEM_OWNER") return [...ALL_ROLES];
  return CAN_CREATE_ROLE[creatorRole] || [];
}
