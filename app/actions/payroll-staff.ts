"use server";

import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export interface StaffDocument {
  id: string;
  type: "NATIONAL_ID" | "DRIVING_LICENSE" | "PASSPORT" | "RESIDENCE" | "CONTRACT" | "OTHER";
  title: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface StaffMember {
  id: string;
  companyId: number;
  name: string;
  jobTitle: string;
  department: string;
  salaryType: "MONTHLY" | "DAILY" | "PIECE_RATE";
  baseSalary: number;
  phone?: string;
  nationalIdNumber?: string;
  joinDate: string;
  status: "ACTIVE" | "ON_LEAVE" | "TERMINATED";
  documents: StaffDocument[];
  notes?: string;
  isSystemUser?: boolean;
  systemUserId?: number;
}

export interface StaffPayrollSheetItem {
  id: number | string; // Payroll record id or temp key
  staffId: string;
  name: string;
  jobTitle: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: "PAID" | "PENDING";
  paidAt?: Date | null;
  paymentMethod?: string;
  documentsCount: number;
}

// 1. Get Company Staff Directory
export async function getCompanyStaffDirectory(
  companyId: number,
): Promise<{ staff: StaffMember[]; currency: string }> {
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

  // Fetch settings for currency
  const currencySetting = await prisma.companySetting.findFirst({
    where: { companyId, key: "currency" },
  });
  const currency = currencySetting?.value || "IQD";

  // Fetch custom staff directory stored in CompanySetting
  const staffSetting = await prisma.companySetting.findFirst({
    where: { companyId, key: "company_staff_directory" },
  });

  let staffList: StaffMember[] = [];
  if (staffSetting?.value) {
    try {
      staffList = JSON.parse(staffSetting.value);
    } catch {}
  }

  // Also include system users if not already present
  const systemUsers = await prisma.user.findMany({
    where: { companyId, status: "ACTIVE" },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  const existingUserIds = new Set(staffList.map((s) => s.systemUserId).filter(Boolean));

  for (const u of systemUsers) {
    if (!existingUserIds.has(u.id)) {
      const roleName = u.userRoles?.[0]?.role?.name || "موظف";
      staffList.push({
        id: `SYS-USR-${u.id}`,
        companyId,
        name: u.name,
        jobTitle: roleName,
        department: "إدارة النظام",
        salaryType: "MONTHLY",
        baseSalary: 1000000,
        phone: undefined,
        joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "2026-01-01",
        status: "ACTIVE",
        documents: [],
        isSystemUser: true,
        systemUserId: u.id,
      });
    }
  }

  return { staff: staffList, currency };
}

// 2. Add or Update Staff Member
export async function saveStaffMember(
  companyId: number,
  member: Omit<StaffMember, "id" | "companyId"> & { id?: string; companyId?: number },
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

  await requireRole(["ACCOUNTANT", "SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"]);

  const staffSetting = await prisma.companySetting.findFirst({
    where: { companyId, key: "company_staff_directory" },
  });

  let staffList: StaffMember[] = [];
  if (staffSetting?.value) {
    try {
      staffList = JSON.parse(staffSetting.value);
    } catch {}
  }

  const staffId = member.id || `STAFF-${Date.now()}`;
  const fullMember: StaffMember = {
    ...member,
    id: staffId,
    companyId,
    documents: member.documents || [],
  };

  const existingIndex = staffList.findIndex((s) => s.id === staffId);
  if (existingIndex >= 0) {
    staffList[existingIndex] = fullMember;
  } else {
    staffList.unshift(fullMember);
  }

  if (staffSetting) {
    await prisma.companySetting.update({
      where: { id: staffSetting.id },
      data: { value: JSON.stringify(staffList) },
    });
  } else {
    await prisma.companySetting.create({
      data: {
        companyId,
        key: "company_staff_directory",
        value: JSON.stringify(staffList),
      },
    });
  }

  revalidatePath("/system/accountant/payroll");
  return { success: true, staffId };
}

// 3. Delete Staff Member
export async function deleteStaffMember(companyId: number, staffId: string) {
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

  await requireRole(["ACCOUNTANT", "SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"]);

  const staffSetting = await prisma.companySetting.findFirst({
    where: { companyId, key: "company_staff_directory" },
  });

  if (staffSetting?.value) {
    let staffList: StaffMember[] = JSON.parse(staffSetting.value);
    staffList = staffList.filter((s) => s.id !== staffId);

    await prisma.companySetting.update({
      where: { id: staffSetting.id },
      data: { value: JSON.stringify(staffList) },
    });
  }

  revalidatePath("/system/accountant/payroll");
  return { success: true };
}

// 4. Upload Staff Document
export async function uploadStaffDocument(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "غير مصرح لك برفع الملفات" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "لم يتم تحديد ملف" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads", "staff-docs");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "pdf";
    const filename = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/staff-docs/${filename}`;
    return { success: true, fileUrl, filename: file.name };
  } catch (err: any) {
    console.error("Staff doc upload error:", err);
    return { success: false, error: "فشل رفع المستمسك الثبوتي" };
  }
}

// 5. Pay Salary to Staff Member
export async function recordSalaryPayment(
  companyId: number,
  data: {
    staffName: string;
    jobTitle: string;
    amount: number;
    month: string;
    paymentMethod: "CASH" | "BANK_TRANSFER";
    notes?: string;
  },
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

  await requireRole(["ACCOUNTANT", "SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"]);

  const { staffName, jobTitle, amount, month, paymentMethod, notes } = data;

  // 1. Create Payroll Record
  const payroll = await prisma.payroll.create({
    data: {
      companyId,
      creatorName: staffName,
      amount,
      month,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // 2. Create Operational Expense
  await prisma.operationalExpense.create({
    data: {
      companyId,
      category: "PAYROLL",
      amount,
      reference: staffName,
      details: notes || `صرف راتب شهر ${month} للموظف (${staffName} - ${jobTitle}) بواسطة ${paymentMethod === "CASH" ? "نقداً" : "تحويل بنكي"}`,
      timestamp: new Date(),
    },
  });

  // 3. Create Ledger Entry
  await prisma.ledgerEntry.create({
    data: {
      companyId,
      type: "DEBIT",
      amount,
      description: `صرف راتب ${staffName} (${jobTitle}) - شهر ${month}`,
      date: new Date(),
    },
  });

  revalidatePath("/system/accountant/payroll");
  revalidatePath("/system/accountant/expenses");
  revalidatePath("/system/accountant/reports");

  return { success: true, payrollId: payroll.id };
}

// 6. Departments Management
const DEFAULT_STAFF_DEPARTMENTS = [
  "خدمات عامة ونظافة",
  "استقبال وضيافة (Reception)",
  "حراسة وأمن البوابات",
  "حركة ونقل (سائقين)",
  "صيانة وميكانيك",
  "إنتاج وتشغيل",
  "مختبر وجودة",
  "إدارة ومبيعات",
  "مالية ومحاسبة",
  "مشتريات ومخازن",
];

export async function getCompanyStaffDepartments(companyId: number): Promise<string[]> {
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

  const deptSetting = await prisma.companySetting.findFirst({
    where: { companyId, key: "company_staff_departments" },
  });

  if (deptSetting?.value) {
    try {
      const parsed = JSON.parse(deptSetting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }

  return DEFAULT_STAFF_DEPARTMENTS;
}

export async function saveCompanyStaffDepartments(
  companyId: number,
  departments: string[],
): Promise<{ success: boolean; departments: string[] }> {
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

  await requireRole(["ACCOUNTANT", "SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"]);

  const clean = Array.from(new Set(departments.map((d) => d.trim()).filter(Boolean)));

  const deptSetting = await prisma.companySetting.findFirst({
    where: { companyId, key: "company_staff_departments" },
  });

  if (deptSetting) {
    await prisma.companySetting.update({
      where: { id: deptSetting.id },
      data: { value: JSON.stringify(clean) },
    });
  } else {
    await prisma.companySetting.create({
      data: {
        companyId,
        key: "company_staff_departments",
        value: JSON.stringify(clean),
      },
    });
  }

  revalidatePath("/system/accountant/settings");
  revalidatePath("/system/accountant/payroll");
  return { success: true, departments: clean };
}

