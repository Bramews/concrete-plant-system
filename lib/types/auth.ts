export type SystemRole =
  | "SYSTEM_OWNER"
  | "COMPANY_ADMIN"
  | "DEPARTMENT_MANAGER"
  | "MANAGER"
  | "SALES"
  | "SALES_REP"
  | "LAB_TECH"
  | "LAB_ENGINEER"
  | "LAB_MANAGER"
  | "OPERATOR"
  | "ACCOUNTANT"
  | "GUARD"
  | "SAFETY";

export type RoleType = SystemRole | string;

export interface ExtendedUser {
  id: number;
  username: string;
  name: string;
  email: string;
  password?: string;
  role: RoleType;
  status: "ACTIVE" | "DISABLED";
  companyId?: number;
}
