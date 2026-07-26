"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";

export type InvoiceKpis = {
  totalReceivables: number;
  overdueInvoices: number;
  collectedThisMonth: number;
  pendingProcessing: number;
};

export async function getInvoiceKpis(companyId: number): Promise<InvoiceKpis> {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

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
          status: { not: "PAID" },
        },
        _sum: { amount: true },
      })
      .then((res) => res._sum.amount || 0),

    // Overdue Invoices: Unpaid and past due date (assuming 30 days credit)
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          status: { not: "PAID" },
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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

    // Pending Processing (Status = PENDING)
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          status: "PENDING",
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
        },
      },
      ticket: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// --- Expenses Actions ---

export type ExpenseKpis = {
  totalMonthly: number;
  fuelCosts: number;
  maintenanceCosts: number;
  miscExpenses: number;
};

export async function getExpenseKpis(companyId: number): Promise<ExpenseKpis> {
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
            category: "MISC",
            timestamp: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),
    ]);

  return { totalMonthly, fuelCosts, maintenanceCosts, miscExpenses };
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
    take: 50,
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

  return await prisma.operationalExpense.create({
    data: {
      companyId,
      category: data.category,
      amount: data.amount,
      details: data.details,
      reference: data.reference,
      timestamp: data.date || new Date(),
    },
  });
}

// --- Payroll Actions ---

export type PayrollKpis = {
  totalPayroll: number;
  paidAmount: number;
  pendingAmount: number;
  staffCount: number;
};

export async function getPayrollKpis(companyId: number): Promise<PayrollKpis> {
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
          where: { companyId, month: currentMonth, status: "PENDING" },
          _sum: { amount: true },
        })
        .then((res) => res._sum.amount || 0),

      prisma.user.count({
        where: { companyId, status: "ACTIVE" },
      }),
    ]);

  return { totalPayroll, paidAmount, pendingAmount, staffCount };
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

  return await prisma.payroll.update({
    where: { id: payrollId, companyId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });
}

export async function updateInvoiceStatus(
  companyId: number,
  invoiceId: string,
  status: string,
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

  return await prisma.invoice.update({
    where: { id: invoiceId, companyId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });
}
