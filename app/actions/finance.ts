"use server";

import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";
import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  checkPeriodLock,
  lockFinancialPeriod,
  unlockFinancialPeriod,
  getCompanyFinancialPeriods,
} from "@/lib/financial-guard";
import {
  recordFinancialAudit,
  getCompanyFinancialAuditTrail,
} from "@/lib/financial-audit";

export interface CompanyFinancialSettings {
  currency: string;
  supportedCurrencies: string[];
  taxRate: number;
  paymentTermsDays: number;
  invoicePrefix: string;
  enablePlcCostSync?: boolean;
}

export async function getCompanyFinancialSettings(
  companyId: number,
): Promise<CompanyFinancialSettings> {
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

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      currency: true,
      invoiceSettings: true,
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  let customSettings: Partial<CompanyFinancialSettings> = {};
  if (company.invoiceSettings) {
    try {
      customSettings = JSON.parse(company.invoiceSettings);
    } catch {
      customSettings = {};
    }
  }

  return {
    currency: customSettings.currency || company.currency || "IQD",
    supportedCurrencies: customSettings.supportedCurrencies || [
      company.currency || "IQD",
      "USD",
      "SAR",
    ],
    taxRate: typeof customSettings.taxRate === "number" ? customSettings.taxRate : 0,
    paymentTermsDays: customSettings.paymentTermsDays || 30,
    invoicePrefix: customSettings.invoicePrefix || "INV-",
    enablePlcCostSync:
      typeof customSettings.enablePlcCostSync === "boolean"
        ? customSettings.enablePlcCostSync
        : true,
  };
}

export async function updateCompanyFinancialSettings(
  companyId: number,
  settings: Partial<CompanyFinancialSettings>,
) {
  const session = await getSession();
  if (!session || (session.role !== "ACCOUNTANT" && session.role !== "MANAGER" && session.role !== "SYSTEM_OWNER")) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const current = await getCompanyFinancialSettings(companyId);
  const updated: CompanyFinancialSettings = {
    currency: settings.currency || current.currency,
    supportedCurrencies: settings.supportedCurrencies || current.supportedCurrencies,
    taxRate: typeof settings.taxRate === "number" ? settings.taxRate : current.taxRate,
    paymentTermsDays: settings.paymentTermsDays || current.paymentTermsDays,
    invoicePrefix: settings.invoicePrefix || current.invoicePrefix,
    enablePlcCostSync:
      typeof settings.enablePlcCostSync === "boolean"
        ? settings.enablePlcCostSync
        : current.enablePlcCostSync,
  };

  await prisma.company.update({
    where: { id: companyId },
    data: {
      currency: updated.currency,
      invoiceSettings: JSON.stringify(updated),
    },
  });

  revalidatePath("/system/accountant/invoices");
  revalidatePath("/system/accountant/expenses");
  revalidatePath("/system/accountant/payroll");
  revalidatePath("/system/accountant/reports");
  revalidatePath("/system/accountant/settings");

  return { success: true, settings: updated };
}

// --- Invoice Actions ---

export type InvoiceKpis = {
  totalReceivables: number;
  overdueInvoices: number;
  collectedThisMonth: number;
  pendingProcessing: number;
  currency: string;
};

export async function getInvoiceKpis(companyId: number): Promise<InvoiceKpis> {
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

  const settings = await getCompanyFinancialSettings(companyId);
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);
  const overdueThreshold = new Date(
    Date.now() - settings.paymentTermsDays * 24 * 60 * 60 * 1000,
  );

  const [
    totalReceivables,
    overdueInvoices,
    collectedThisMonth,
    pendingProcessing,
  ] = await Promise.all([
    // Total Receivables (All unpaid invoices)
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        _sum: { amount: true },
      })
      .then((res) => res._sum.amount || 0),

    // Overdue Invoices
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          status: { notIn: ["PAID", "CANCELLED"] },
          createdAt: { lt: overdueThreshold },
        },
        _sum: { amount: true },
      })
      .then((res) => res._sum.amount || 0),

    // Collected This Month
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          status: "PAID",
          paidAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
        },
        _sum: { amount: true },
      })
      .then((res) => res._sum.amount || 0),

    // Pending Processing
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          status: { in: ["PENDING", "DRAFT"] },
        },
        _sum: { amount: true },
      })
      .then((res) => res._sum.amount || 0),
  ]);

  return {
    totalReceivables,
    overdueInvoices,
    collectedThisMonth,
    pendingProcessing,
    currency: settings.currency,
  };
}

export async function getInvoices(companyId: number) {
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

  return await prisma.invoice.findMany({
    where: { companyId },
    include: {
      order: {
        include: {
          customer: true,
          project: true,
          mixDesign: true,
        },
      },
      ticket: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function updateInvoiceStatus(
  companyId: number,
  invoiceId: string,
  status: string,
) {
  const session = await getSession();
  if (!session || (session.role !== "ACCOUNTANT" && session.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: invoiceId, companyId },
  });
  if (!existing) throw new Error("الفاتورة غير موجودة");

  // فحص إقفال الفترة المالية
  const lockCheck = await checkPeriodLock(companyId, existing.createdAt);
  if (lockCheck.isLocked) {
    throw new Error(lockCheck.message || "لا يمكن تعديل الفاتورة لأن الفترة المالية مقفلة");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId, companyId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  // تسجيل الرقابة المالية السيادية غير القابلة للتعديل
  await recordFinancialAudit({
    companyId,
    action: "INVOICE_STATUS_CHANGE",
    entityType: "Invoice",
    entityId: invoiceId,
    oldSnapshot: { status: existing.status, paidAt: existing.paidAt },
    newSnapshot: { status: updated.status, paidAt: updated.paidAt },
    reason: `تغيير حالة الفاتورة من (${existing.status}) إلى (${status})`,
  });

  revalidatePath("/system/accountant/invoices");
  revalidatePath(`/system/accountant/invoices/${invoiceId}`);
  revalidatePath("/system/accountant/reports");

  return updated;
}

// --- Expenses Actions ---

export type ExpenseKpis = {
  totalMonthly: number;
  fuelCosts: number;
  maintenanceCosts: number;
  miscExpenses: number;
  currency: string;
};

export async function getExpenseKpis(companyId: number): Promise<ExpenseKpis> {
  const settings = await getCompanyFinancialSettings(companyId);
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const [totalMonthly, fuelCosts, maintenanceCosts, miscExpenses] =
    await Promise.all([
      prisma.operationalExpense
        .aggregate({
          where: { companyId, timestamp: { gte: start, lte: end } },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.operationalExpense
        .aggregate({
          where: {
            companyId,
            category: "FUEL",
            timestamp: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.operationalExpense
        .aggregate({
          where: {
            companyId,
            category: "MAINTENANCE",
            timestamp: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.operationalExpense
        .aggregate({
          where: {
            companyId,
            category: { notIn: ["FUEL", "MAINTENANCE"] },
            timestamp: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),
    ]);

  return {
    totalMonthly,
    fuelCosts,
    maintenanceCosts,
    miscExpenses,
    currency: settings.currency,
  };
}

export async function getExpenses(companyId: number) {
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

  return await prisma.operationalExpense.findMany({
    where: { companyId },
    orderBy: { timestamp: "desc" },
    take: 100,
  });
}

export async function createExpense(
  companyId: number,
  data: {
    category: string;
    amount: number;
    details?: string;
    reference?: string;
    date?: Date;
  },
) {
  const session = await getSession();
  if (!session || (session.role !== "ACCOUNTANT" && session.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const expense = await prisma.operationalExpense.create({
    data: {
      companyId,
      category: data.category,
      amount: Math.abs(data.amount),
      details: data.details || "",
      reference: data.reference || "",
      timestamp: data.date || new Date(),
    },
  });

  revalidatePath("/system/accountant/expenses");
  revalidatePath("/system/accountant/reports");

  return expense;
}

// --- Payroll Actions ---

export type PayrollKpis = {
  totalPayroll: number;
  paidAmount: number;
  pendingAmount: number;
  staffCount: number;
  currency: string;
};

export async function getPayrollKpis(companyId: number): Promise<PayrollKpis> {
  const settings = await getCompanyFinancialSettings(companyId);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [totalPayroll, paidAmount, pendingAmount, staffCount] =
    await Promise.all([
      prisma.payroll
        .aggregate({
          where: { companyId, month: currentMonth },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.payroll
        .aggregate({
          where: { companyId, month: currentMonth, status: "PAID" },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.payroll
        .aggregate({
          where: { companyId, month: currentMonth, status: { not: "PAID" } },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.user.count({
        where: { companyId, status: "ACTIVE" },
      }),
    ]);

  return {
    totalPayroll,
    paidAmount,
    pendingAmount,
    staffCount,
    currency: settings.currency,
  };
}

export async function getPayroll(companyId: number) {
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

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return await prisma.payroll.findMany({
    where: { companyId, month: currentMonth },
    include: {
      user: {
        select: {
          name: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function processPayroll(companyId: number, payrollId: number) {
  const session = await getSession();
  if (!session || (session.role !== "ACCOUNTANT" && session.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const updated = await prisma.payroll.update({
    where: { id: payrollId, companyId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  revalidatePath("/system/accountant/payroll");
  revalidatePath("/system/accountant/reports");

  return updated;
}

export async function processAllPendingPayrolls(companyId: number) {
  const session = await getSession();
  if (!session || (session.role !== "ACCOUNTANT" && session.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const res = await prisma.payroll.updateMany({
    where: {
      companyId,
      month: currentMonth,
      status: { not: "PAID" },
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  revalidatePath("/system/accountant/payroll");
  revalidatePath("/system/accountant/reports");

  return { success: true, count: res.count };
}

// --- Dynamic Financial Reports Engine ---

export type FinancialReportData = {
  totalRevenue: number;
  totalOperatingCosts: number;
  totalPayrollCosts: number;
  netProfit: number;
  profitMargin: number;
  currency: string;
  monthLabel: string;
  breakdown: {
    revenuePct: number;
    expensesPct: number;
    payrollPct: number;
    profitPct: number;
  };
  expenseCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
};

export async function getFinancialReportData(
  companyId: number,
): Promise<FinancialReportData> {
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

  const settings = await getCompanyFinancialSettings(companyId);
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [invoicesSum, expensesSum, payrollSum, categoryBreakdown] =
    await Promise.all([
      // 1. Total Revenue from Invoices this month
      prisma.invoice
        .aggregate({
          where: {
            companyId,
            status: "PAID",
            paidAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      // 2. Total Operational Expenses this month
      prisma.operationalExpense
        .aggregate({
          where: {
            companyId,
            timestamp: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      // 3. Total Payroll for current month
      prisma.payroll
        .aggregate({
          where: {
            companyId,
            month: currentMonthStr,
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      // 4. Expense Categories Breakdown
      prisma.operationalExpense.groupBy({
        by: ["category"],
        where: {
          companyId,
          timestamp: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

  const totalRevenue = invoicesSum;
  const totalOperatingCosts = expensesSum;
  const totalPayrollCosts = payrollSum;
  const totalCost = totalOperatingCosts + totalPayrollCosts;
  const netProfit = totalRevenue - totalCost;
  const profitMargin =
    totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 100)
      : 0;

  const baseTotal = Math.max(totalRevenue, totalCost, 1);
  const revenuePct = Math.min(100, Math.round((totalRevenue / baseTotal) * 100));
  const expensesPct = Math.min(100, Math.round((totalOperatingCosts / baseTotal) * 100));
  const payrollPct = Math.min(100, Math.round((totalPayrollCosts / baseTotal) * 100));
  const profitPct = Math.max(0, Math.min(100, Math.round((Math.max(0, netProfit) / baseTotal) * 100)));

  const expenseCategories = categoryBreakdown.map((cat) => {
    const amt = cat._sum.amount || 0;
    return {
      category: cat.category,
      amount: amt,
      percentage: totalOperatingCosts > 0 ? Math.round((amt / totalOperatingCosts) * 100) : 0,
    };
  });

  return {
    totalRevenue,
    totalOperatingCosts,
    totalPayrollCosts,
    netProfit,
    profitMargin,
    currency: settings.currency,
    monthLabel: `${now.toLocaleString("ar-SA", { month: "long" })} ${now.getFullYear()}`,
    breakdown: {
      revenuePct,
      expensesPct,
      payrollPct,
      profitPct,
    },
    expenseCategories,
  };
}

// -------------------------------------------------------------
// 5. CUSTOMER LEDGERS & STATEMENTS (كشوفات حسابات وذمم العملاء)
// -------------------------------------------------------------

export interface CustomerLedgerSummary {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  projectsCount: number;
  ordersCount: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
  creditLimit: number;
  isOverLimit: boolean;
}

export async function getCustomerLedgers(companyId: number): Promise<{
  customers: CustomerLedgerSummary[];
  kpis: {
    totalReceivables: number;
    totalBilled: number;
    totalCollected: number;
    activeCustomersCount: number;
    currency: string;
  };
}> {
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

  const [settings, customers] = await Promise.all([
    getCompanyFinancialSettings(companyId),
    prisma.customer.findMany({
      where: { companyId },
      include: {
        orders: {
          include: {
            invoices: true,
            project: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  let grandTotalBilled = 0;
  let grandTotalCollected = 0;
  let grandTotalReceivables = 0;

  const summaries: CustomerLedgerSummary[] = customers.map((c) => {
    const uniqueProjects = new Set<number>();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let pendingInvoicesCount = 0;
    let overdueInvoicesCount = 0;

    for (const order of c.orders) {
      if (order.projectId) {
        uniqueProjects.add(order.projectId);
      }
      if (order.invoices) {
        const inv = order.invoices;
        totalInvoiced += inv.amount;
        if (inv.status === "PAID") {
          totalPaid += inv.amount;
        } else {
          if (inv.status === "OVERDUE") {
            overdueInvoicesCount++;
          } else {
            pendingInvoicesCount++;
          }
        }
      }
    }

    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);
    const creditLimit = 50000; // Standard default credit ceiling per contractor

    grandTotalBilled += totalInvoiced;
    grandTotalCollected += totalPaid;
    grandTotalReceivables += outstandingBalance;

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      projectsCount: uniqueProjects.size,
      ordersCount: c.orders.length,
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      pendingInvoicesCount,
      overdueInvoicesCount,
      creditLimit,
      isOverLimit: outstandingBalance > creditLimit,
    };
  });

  return {
    customers: summaries,
    kpis: {
      totalReceivables: grandTotalReceivables,
      totalBilled: grandTotalBilled,
      totalCollected: grandTotalCollected,
      activeCustomersCount: customers.length,
      currency: settings.currency,
    },
  };
}

export interface StatementItem {
  id: string;
  type: "INVOICE" | "PAYMENT";
  date: Date;
  reference: string;
  description: string;
  projectName: string;
  mixCode: string;
  quantity: number;
  unitPrice: number;
  debit: number; // مدين (فاتورة / مستحق)
  credit: number; // دائن (سداد / دفعة)
  balance: number; // الرصيد التراكمي
  status: string;
}

export async function getCustomerStatement(
  companyId: number,
  customerId: number,
  projectId?: number,
): Promise<{
  customer: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  projects: { id: number; name: string }[];
  items: StatementItem[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    currentBalance: number;
    currency: string;
  };
}> {
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

  const [settings, customer] = await Promise.all([
    getCompanyFinancialSettings(companyId),
    prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          where: projectId ? { projectId } : undefined,
          include: {
            invoices: true,
            project: true,
            mixDesign: true,
          },
          orderBy: { date: "asc" },
        },
      },
    }),
  ]);

  if (!customer || customer.companyId !== companyId) {
    throw new Error("Customer not found or unauthorized");
  }

  // Also get payment vouchers from LedgerEntry for this customer
  const ledgerPayments = await prisma.ledgerEntry.findMany({
    where: {
      companyId,
      type: "PAYMENT_RECEIVED",
      description: { contains: `[CUST:${customerId}]` },
    },
    orderBy: { date: "asc" },
  });

  const statementItems: StatementItem[] = [];
  const projectsMap = new Map<number, string>();

  // Add all invoices
  for (const order of customer.orders) {
    if (order.project) {
      projectsMap.set(order.project.id, order.project.name);
    }
    if (order.invoices) {
      const inv = order.invoices;
      const mixPrice = order.mixDesign?.concretePrice || 250;
      const qty = order.actualQuantity || order.volume || 1;

      statementItems.push({
        id: inv.id,
        type: "INVOICE",
        date: inv.createdAt,
        reference: `INV-${inv.id.substring(0, 8)}`,
        description: `توريد خرسانة طلبية #${order.orderNumber}`,
        projectName: order.project?.name || "عام",
        mixCode: order.mixDesign?.code || "—",
        quantity: qty,
        unitPrice: mixPrice,
        debit: inv.amount,
        credit: 0,
        balance: 0,
        status: inv.status,
      });

      // If invoice was marked paid, add corresponding payment record if not in ledger
      if (inv.status === "PAID" && inv.paidAt) {
        statementItems.push({
          id: `pay_${inv.id}`,
          type: "PAYMENT",
          date: inv.paidAt,
          reference: `REC-${inv.id.substring(0, 8)}`,
          description: `سداد فاتورة #${inv.id.substring(0, 8)}`,
          projectName: order.project?.name || "عام",
          mixCode: "—",
          quantity: 0,
          unitPrice: 0,
          debit: 0,
          credit: inv.amount,
          balance: 0,
          status: "PAID",
        });
      }
    }
  }

  // Add separate ledger receipts
  for (const pay of ledgerPayments) {
    statementItems.push({
      id: `led_${pay.id}`,
      type: "PAYMENT",
      date: pay.date,
      reference: `VOUCHER-#${pay.id}`,
      description: pay.description?.replace(/\[CUST:\d+\]/, "").trim() || "سند قبض نقدي",
      projectName: "عام",
      mixCode: "—",
      quantity: 0,
      unitPrice: 0,
      debit: 0,
      credit: pay.amount,
      balance: 0,
      status: "COMPLETED",
    });
  }

  // Sort chronologically
  statementItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute running balance
  let runningBalance = 0;
  let totalInvoiced = 0;
  let totalPaid = 0;

  for (const item of statementItems) {
    runningBalance += item.debit - item.credit;
    item.balance = runningBalance;
    totalInvoiced += item.debit;
    totalPaid += item.credit;
  }

  const projectsList = Array.from(projectsMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    },
    projects: projectsList,
    items: statementItems,
    summary: {
      totalInvoiced,
      totalPaid,
      currentBalance: Math.max(0, runningBalance),
      currency: settings.currency,
    },
  };
}

export async function recordCustomerPayment(
  companyId: number,
  payload: {
    customerId: number;
    invoiceId?: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  },
) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "ACCOUNTANT" &&
      session.role !== "MANAGER" &&
      session.role !== "SYSTEM_OWNER")
  ) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const customer = await prisma.customer.findUnique({
    where: { id: payload.customerId },
  });

  if (!customer || customer.companyId !== companyId) {
    throw new Error("Customer not found or access denied");
  }

  // 1. Create Ledger Entry for audit and voucher printing
  const voucherDescription = `[CUST:${payload.customerId}] ${payload.notes || "سداد دفعة"} | طريقة الدفع: ${payload.paymentMethod} | مرجع: ${payload.reference || "—"}`;

  const entry = await prisma.ledgerEntry.create({
    data: {
      companyId,
      type: "PAYMENT_RECEIVED",
      amount: payload.amount,
      description: voucherDescription,
      date: new Date(),
    },
  });

  // 2. If specific invoice provided, mark paid
  if (payload.invoiceId) {
    await prisma.invoice.update({
      where: { id: payload.invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  } else {
    // Sequentially allocate payment to oldest pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ["PENDING", "OVERDUE", "DRAFT"] },
        order: { customerId: payload.customerId },
      },
      orderBy: { createdAt: "asc" },
    });

    let remainingPayment = payload.amount;
    for (const inv of pendingInvoices) {
      if (remainingPayment >= inv.amount) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
        remainingPayment -= inv.amount;
      }
    }
  }

  revalidatePath("/system/accountant/invoices");
  revalidatePath("/system/accountant/customers");
  revalidatePath(`/system/accountant/customers/${payload.customerId}`);
  revalidatePath("/system/accountant/reports");

  return { success: true, voucherId: entry.id };
}

// -------------------------------------------------------------
// 6. VOUCHERS / RECEIPTS LIST (سندات القبض المعتمدة)
// -------------------------------------------------------------

export async function getVouchers(companyId: number) {
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

  const [settings, vouchers] = await Promise.all([
    getCompanyFinancialSettings(companyId),
    prisma.ledgerEntry.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);

  return {
    vouchers: vouchers.map((v) => ({
      id: v.id,
      type: v.type,
      amount: v.amount,
      description: v.description || "سند مالي",
      date: v.date,
      currency: settings.currency,
    })),
    currency: settings.currency,
  };
}

// -------------------------------------------------------------
// 7. CONCRETE PRODUCTION BATCH COSTING (تحليل تكلفة المتر المكعب)
// -------------------------------------------------------------

export interface MixCostAnalysis {
  id: number;
  code: string;
  name: string;
  grade: string | null;
  sellingPrice: number;
  estimatedCost: number;
  grossMargin: number;
  marginPercentage: number;
  componentsCount: number;
}

export async function getProductionCostAnalysis(companyId: number): Promise<{
  mixes: MixCostAnalysis[];
  currency: string;
}> {
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

  const [settings, mixDesigns] = await Promise.all([
    getCompanyFinancialSettings(companyId),
    prisma.mixDesign.findMany({
      where: { companyId },
      include: {
        MixComponent: true,
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const analyses: MixCostAnalysis[] = mixDesigns.map((mix) => {
    const sellingPrice = mix.concretePrice && mix.concretePrice > 0 ? mix.concretePrice : 250;
    
    // Calculate raw materials cost based on component weights
    // Cement: ~0.12/kg, Sand/Agg: ~0.025/kg, Water: ~0.001/kg, Chemical: ~1.5/kg
    let estimatedCost = 0;
    const comps = mix.MixComponent || [];
    for (const comp of comps) {
      const name = comp.materialName.toLowerCase();
      const qty = comp.quantity;
      if (name.includes("cement") || name.includes("إسمنت") || name.includes("اسمنت")) {
        estimatedCost += qty * 0.12;
      } else if (name.includes("sand") || name.includes("رمل") || name.includes("ركام") || name.includes("gravel") || name.includes("agg")) {
        estimatedCost += qty * 0.025;
      } else if (name.includes("admixture") || name.includes("إضافة") || name.includes("كيميا")) {
        estimatedCost += qty * 1.5;
      } else {
        estimatedCost += qty * 0.02;
      }
    }

    // Default realistic base cost if components not yet fully weighted
    if (estimatedCost <= 0) {
      estimatedCost = Math.round(sellingPrice * 0.65);
    }

    const grossMargin = Math.max(0, sellingPrice - estimatedCost);
    const marginPercentage = sellingPrice > 0 ? Math.round((grossMargin / sellingPrice) * 100) : 0;

    return {
      id: mix.id,
      code: mix.code,
      name: mix.name,
      grade: mix.grade || mix.strengthClass,
      sellingPrice,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      grossMargin: Math.round(grossMargin * 100) / 100,
      marginPercentage,
      componentsCount: comps.length,
    };
  });

  return {
    mixes: analyses,
    currency: settings.currency,
  };
}

// -------------------------------------------------------------
// 8. AUTO-INVOICING FOR DELIVERED TICKETS (الفوترة التلقائية الفورية)
// -------------------------------------------------------------

export async function getPendingUninvoicedTicketsCount(companyId: number): Promise<number> {
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

  const count = await prisma.deliveryTicket.count({
    where: {
      order: { companyId },
      status: "DELIVERED",
      invoice: null,
    },
  });

  return count;
}

export async function batchGenerateInvoices(companyId: number): Promise<{ count: number }> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "ACCOUNTANT" &&
      session.role !== "MANAGER" &&
      session.role !== "SYSTEM_OWNER")
  ) {
    throw new Error("Unauthorized");
  }

  const isolationCheck = validateTenantIsolation(
    session.companyId,
    companyId,
    session.role,
  );
  if (!isolationCheck.valid) {
    throw new Error(isolationCheck.reason);
  }

  const [settings, pendingTickets] = await Promise.all([
    getCompanyFinancialSettings(companyId),
    prisma.deliveryTicket.findMany({
      where: {
        order: { companyId },
        status: "DELIVERED",
        invoice: null,
      },
      include: {
        order: {
          include: {
            mixDesign: true,
            customer: true,
          },
        },
      },
    }),
  ]);

  if (pendingTickets.length === 0) {
    return { count: 0 };
  }

  let generatedCount = 0;
  for (const ticket of pendingTickets) {
    const unitPrice =
      ticket.order.mixDesign?.concretePrice && ticket.order.mixDesign.concretePrice > 0
        ? ticket.order.mixDesign.concretePrice
        : 250;
    const quantity =
      ticket.cumulativeQuantity && ticket.cumulativeQuantity > 0
        ? ticket.cumulativeQuantity
        : 1;

    const rawSubtotal = quantity * unitPrice;
    const taxAmount = (rawSubtotal * settings.taxRate) / 100;
    const totalAmount = rawSubtotal + taxAmount;

    await prisma.invoice.create({
      data: {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        ticketId: ticket.id,
        orderId: ticket.orderId,
        amount: Math.round(totalAmount * 100) / 100,
        currency: settings.currency,
        status: "PENDING",
      },
    });
    generatedCount++;
  }

  revalidatePath("/system/accountant/invoices");
  revalidatePath("/system/accountant/customers");
  revalidatePath("/system/accountant/reports");

  return { count: generatedCount };
}

// -------------------------------------------------------------
// 9. ACTUAL VS TARGET BATCH VARIANCE COSTING (حساب هدر وتكلفة الـ PLC الفعلية)
// -------------------------------------------------------------

export interface BatchVarianceCostItem {
  batchId: number;
  orderNumber: string;
  mixCode: string;
  date: Date;
  quantity: number;
  targetCost: number;
  actualCost: number;
  varianceCost: number;
  variancePercentage: number;
  cementDiffKg: number;
  admixtureDiffKg: number;
}

export async function getActualBatchVarianceCostAnalysis(companyId: number): Promise<{
  batches: BatchVarianceCostItem[];
  totalVarianceCost: number;
  currency: string;
  totalActualCost: number;
  totalTargetCost: number;
  isEnabled: boolean;
}> {
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

  const settings = await getCompanyFinancialSettings(companyId);

  // If PLC Cost Sync is disabled by the company, return empty variance without processing
  if (settings.enablePlcCostSync === false) {
    return {
      batches: [],
      totalVarianceCost: 0,
      totalActualCost: 0,
      totalTargetCost: 0,
      currency: settings.currency,
      isEnabled: false,
    };
  }

  const recentBatches = await prisma.batch.findMany({
    where: {
      order: { companyId },
    },
    include: {
      order: {
        include: {
          mixDesign: {
            include: {
              MixComponent: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  let grandTotalTargetCost = 0;
  let grandTotalActualCost = 0;
  let grandTotalVarianceCost = 0;

  const items: BatchVarianceCostItem[] = [];

  for (const b of recentBatches) {
    const mix = b.order?.mixDesign;
    const comps = mix?.MixComponent || [];
    const batchQty = b.quantity || 1;

    let targetBatchCost = 0;
    let actualBatchCost = 0;
    let cementTarget = 0;
    let cementActual = 0;
    let admixTarget = 0;
    let admixActual = 0;

    // Calculate Target Cost from Mix Components
    for (const c of comps) {
      const name = c.materialName.toLowerCase();
      let unitCost = 0.025; // default aggregates
      if (name.includes("cement") || name.includes("إسمنت") || name.includes("اسمنت")) {
        unitCost = 0.12;
        cementTarget += c.quantity * batchQty;
      } else if (name.includes("admixture") || name.includes("إضافة") || name.includes("كيميا")) {
        unitCost = 1.5;
        admixTarget += c.quantity * batchQty;
      } else if (name.includes("water") || name.includes("ماء")) {
        unitCost = 0.001;
      }
      targetBatchCost += c.quantity * batchQty * unitCost;
    }

    // Parse Actual Mix Data from PLC sensors
    try {
      if (b.actualMixData) {
        const parsed = JSON.parse(b.actualMixData);
        const proportions = parsed.proportions || parsed;

        for (const [matName, val] of Object.entries(proportions)) {
          const name = matName.toLowerCase();
          const numericVal = typeof val === "number" ? val : parseFloat(String(val)) || 0;
          let unitCost = 0.025;

          if (name.includes("cement") || name.includes("إسمنت") || name.includes("اسمنت")) {
            unitCost = 0.12;
            cementActual += numericVal;
          } else if (name.includes("admixture") || name.includes("إضافة") || name.includes("كيميا")) {
            unitCost = 1.5;
            admixActual += numericVal;
          } else if (name.includes("water") || name.includes("ماء")) {
            unitCost = 0.001;
          }
          actualBatchCost += numericVal * unitCost;
        }
      }
    } catch {
      actualBatchCost = targetBatchCost;
    }

    if (actualBatchCost <= 0) {
      actualBatchCost = targetBatchCost;
    }

    const varianceCost = actualBatchCost - targetBatchCost;
    const variancePercentage =
      targetBatchCost > 0 ? Math.round((varianceCost / targetBatchCost) * 1000) / 10 : 0;

    grandTotalTargetCost += targetBatchCost;
    grandTotalActualCost += actualBatchCost;
    grandTotalVarianceCost += varianceCost;

    items.push({
      batchId: b.id,
      orderNumber: b.order?.orderNumber || `ORD-${b.orderId}`,
      mixCode: mix?.code || "MIX",
      date: b.createdAt,
      quantity: batchQty,
      targetCost: Math.round(targetBatchCost * 100) / 100,
      actualCost: Math.round(actualBatchCost * 100) / 100,
      varianceCost: Math.round(varianceCost * 100) / 100,
      variancePercentage,
      cementDiffKg: Math.round((cementActual - cementTarget) * 10) / 10,
      admixtureDiffKg: Math.round((admixActual - admixTarget) * 10) / 10,
    });
  }

  return {
    batches: items,
    totalVarianceCost: Math.round(grandTotalVarianceCost * 100) / 100,
    totalActualCost: Math.round(grandTotalActualCost * 100) / 100,
    totalTargetCost: Math.round(grandTotalTargetCost * 100) / 100,
    currency: settings.currency,
    isEnabled: true,
  };
}

// -------------------------------------------------------------
// 10. CREDIT LIMIT & SALES ENFORCEMENT (التحقق من سقف الائتمان)
// -------------------------------------------------------------

export interface CreditStatusResult {
  isAllowed: boolean;
  reason?: string;
  creditLimit: number;
  outstandingBalance: number;
  hasOverdueInvoices: boolean;
  overdueCount: number;
  newBalance: number;
  statusType: "OPEN" | "HEALTHY" | "OVERDUE" | "LIMIT_EXCEEDED";
}

export async function checkCustomerCreditStatus(
  companyId: number,
  customerId: number,
  newOrderAmount: number = 0,
): Promise<CreditStatusResult> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      orders: {
        include: {
          invoices: true,
        },
      },
    },
  });

  if (!customer) {
    return {
      isAllowed: true,
      creditLimit: 0,
      outstandingBalance: 0,
      hasOverdueInvoices: false,
      overdueCount: 0,
      newBalance: newOrderAmount,
      statusType: "OPEN",
    };
  }

  let totalInvoiced = 0;
  let totalPaid = 0;
  let overdueCount = 0;

  for (const o of customer.orders) {
    if (o.invoices) {
      totalInvoiced += o.invoices.amount;
      if (o.invoices.status === "PAID") {
        totalPaid += o.invoices.amount;
      } else if (o.invoices.status === "OVERDUE") {
        overdueCount++;
      }
    }
  }

  const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);
  // Default: No credit ceiling (0 = open / unlimited credit unless explicitly configured)
  const creditLimit = 0; 
  const newBalance = outstandingBalance + newOrderAmount;

  if (overdueCount > 0) {
    return {
      isAllowed: false,
      reason: `العميل لديه (${overdueCount}) فواتير متأخرة السداد (OVERDUE). يتطلب موافقة مالية استثنائية.`,
      creditLimit,
      outstandingBalance,
      hasOverdueInvoices: true,
      overdueCount,
      newBalance,
      statusType: "OVERDUE",
    };
  }

  if (creditLimit > 0 && newBalance > creditLimit) {
    return {
      isAllowed: false,
      reason: `الرصيد القائم مع الطلبية الجديدة (${newBalance}) يتجاوز سقف الائتمان المخصص (${creditLimit}). يتطلب موافقة مالية.`,
      creditLimit,
      outstandingBalance,
      hasOverdueInvoices: false,
      overdueCount: 0,
      newBalance,
      statusType: "LIMIT_EXCEEDED",
    };
  }

  return {
    isAllowed: true,
    creditLimit,
    outstandingBalance,
    hasOverdueInvoices: false,
    overdueCount: 0,
    newBalance,
    statusType: creditLimit > 0 ? "HEALTHY" : "OPEN",
  };
}

export async function approveFinancialHoldOrder(
  orderId: number,
  companyId: number,
  notes?: string,
) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "ACCOUNTANT" &&
      session.role !== "MANAGER" &&
      session.role !== "SYSTEM_OWNER")
  ) {
    throw new Error("غير مصرح لك باعتماد الطلبيات المعلقة مالياً");
  }

  await prisma.order.update({
    where: { id: orderId, companyId },
    data: {
      status: "DRAFT",
      notes: notes ? `${notes} [تمت الموافقة المالية الاستثنائية بواسطة المحاسب]` : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "FINANCIAL_OVERRIDE_APPROVED",
      entity: "Order",
      entityId: String(orderId),
      companyId,
      role: session.role,
      details: notes || "Financial credit override approved by accountant/manager",
      timestamp: new Date(),
    },
  });

  revalidatePath("/system/sales/orders");
  revalidatePath("/system/accountant/customers");
  return { success: true };
}

// -------------------------------------------------------------
// 11. FIELD COLLECTIONS & GATE RECEIPT VOUCHERS (التحصيل الميداني)
// -------------------------------------------------------------

export async function recordFieldCollection(
  ticketId: number,
  amount: number,
  collectedBy: string,
  notes?: string,
) {
  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: ticketId },
    include: {
      order: {
        include: {
          customer: true,
          invoices: true,
        },
      },
    },
  });

  if (!ticket || !ticket.order) {
    throw new Error("تذكرة التسليم غير موجودة");
  }

  const companyId = ticket.order.companyId;
  const customer = ticket.order.customer;

  // Auto create or pay invoice if exists
  let invoice = ticket.order.invoices;
  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        id: `inv_field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        companyId,
        ticketId: ticket.id,
        orderId: ticket.orderId,
        amount,
        currency: "IQD",
        status: "PAID",
        paidAt: new Date(),
        creatorName: collectedBy,
      },
    });
  } else {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  // Create Ledger Entry for the collection
  await prisma.ledgerEntry.create({
    data: {
      companyId,
      type: "CREDIT",
      amount,
      description: `تحصيل ميداني نقدي - تذكرة #${ticket.ticketNumber} بواسطة (${collectedBy}) ${notes ? `- ${notes}` : ""}`,
      date: new Date(),
    },
  });

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      action: "FIELD_COLLECTION_RECEIVED",
      entity: "DeliveryTicket",
      entityId: String(ticket.id),
      companyId,
      role: "DRIVER",
      details: `Field cash collected: ${amount} for ticket ${ticket.ticketNumber} by ${collectedBy}`,
      timestamp: new Date(),
    },
  });

  revalidatePath("/system/accountant/vouchers");
  revalidatePath("/system/accountant/invoices");
  revalidatePath("/system/accountant/customers");

  return {
    success: true,
    invoiceId: invoice.id,
    amount,
    receiptNumber: `VOUCH-FIELD-${Date.now()}`,
  };
}

// -------------------------------------------------------------
// 12. PUBLIC E-INVOICE VERIFICATION (التحقق العام للفواتير الإلكترونية)
// -------------------------------------------------------------

export async function getPublicVerifiedInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: {
        select: {
          name: true,
          phone: true,
          address: true,
          currency: true,
        },
      },
      order: {
        include: {
          customer: true,
          project: true,
          mixDesign: true,
        },
      },
      ticket: true,
    },
  });

  if (!invoice) return null;

  return {
    id: invoice.id,
    companyName: invoice.company?.name || "الشركة الوطنية للخرسانة الجاهزة",
    companyPhone: invoice.company?.phone,
    companyAddress: invoice.company?.address,
    customerName: invoice.order?.customer?.name || "عميل عام",
    projectName: invoice.order?.project?.name || "—",
    orderNumber: invoice.order?.orderNumber || "—",
    ticketNumber: invoice.ticket?.ticketNumber || "—",
    mixCode: invoice.order?.mixDesign?.code || "—",
    strengthClass: invoice.order?.mixDesign?.strengthClass || invoice.order?.mixDesign?.grade || "—",
    amount: invoice.amount,
    currency: invoice.currency || invoice.company?.currency || "IQD",
    status: invoice.status,
    createdAt: invoice.createdAt,
    paidAt: invoice.paidAt,
    isVerified: true,
  };
}

// -------------------------------------------------------------
// 13. FINANCIAL PERIOD LOCKING & IMMUTABLE AUDIT TRAIL ACTIONS
// -------------------------------------------------------------

export async function getFinancialPeriodsAction(companyId: number) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) throw new Error(isolationCheck.reason);
  }
  return await getCompanyFinancialPeriods(companyId);
}

export async function lockFinancialPeriodAction(
  companyId: number,
  periodKey: string,
  reason?: string,
) {
  const session = await getSession();
  if (!session || (session.role !== "ACCOUNTANT" && session.role !== "MANAGER" && session.role !== "SYSTEM_OWNER")) {
    throw new Error("Unauthorized");
  }
  const result = await lockFinancialPeriod(companyId, periodKey, reason);
  revalidatePath("/system/accountant/periods");
  revalidatePath("/system/accountant/invoices");
  revalidatePath("/system/accountant/expenses");
  return result;
}

export async function unlockFinancialPeriodAction(
  companyId: number,
  periodKey: string,
  reason: string,
) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "SYSTEM_OWNER")) {
    throw new Error("فك قفل الفترات المالية يتطلب موافقة المدير العام حصراً");
  }
  const result = await unlockFinancialPeriod(companyId, periodKey, reason);
  revalidatePath("/system/accountant/periods");
  revalidatePath("/system/accountant/invoices");
  revalidatePath("/system/accountant/expenses");
  return result;
}

export async function getFinancialAuditTrailAction(
  companyId: number,
  options?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  },
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) throw new Error(isolationCheck.reason);
  }
  return await getCompanyFinancialAuditTrail(companyId, options);
}




