"use server";

import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";
import { revalidatePath } from "next/cache";

export interface DriverTripSummary {
  driverName: string;
  driverPhone?: string;
  truckNumber: string;
  totalTrips: number;
  completedTrips: number;
  inTransitTrips: number;
  totalVolumeM3: number;
  ratePerTrip: number;
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
  recentTickets: {
    id: number;
    ticketNumber: string;
    orderNumber: string;
    customerName: string;
    projectName: string;
    quantityM3: number;
    status: string;
    createdAt: Date;
    truckNumber: string;
  }[];
}

export interface DriverFinanceDashboardData {
  drivers: DriverTripSummary[];
  allTickets: {
    id: number;
    ticketNumber: string;
    orderNumber: string;
    driverName: string;
    truckNumber: string;
    customerName: string;
    projectName: string;
    quantityM3: number;
    status: string;
    createdAt: Date;
  }[];
  totalDriversCount: number;
  totalTripsCount: number;
  totalDeliveredVolumeM3: number;
  totalEstimatedPayout: number;
  currency: string;
}

export async function getDriverTripsFinancials(
  companyId: number,
): Promise<DriverFinanceDashboardData> {
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

  // 1. Fetch Company Settings for Currency and Default Driver Trip Rate
  const settingsRecords = await prisma.companySetting.findMany({
    where: { companyId },
  });
  const settingsMap = new Map(settingsRecords.map((s) => [s.key, s.value]));
  const currency = settingsMap.get("currency") || "IQD";
  const defaultRate = parseFloat(settingsMap.get("driver_default_trip_rate") || "15000") || 15000;

  // 2. Fetch Custom Rates for specific drivers
  let customRates: Record<string, number> = {};
  try {
    const rawRates = settingsMap.get("driver_custom_trip_rates");
    if (rawRates) {
      customRates = JSON.parse(rawRates);
    }
  } catch {}

  // 3. Fetch All Delivery Tickets for this company
  const tickets = await prisma.deliveryTicket.findMany({
    where: {
      OR: [
        { companyId },
        { order: { companyId } },
      ],
    },
    include: {
      order: {
        include: {
          customer: true,
          project: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  // 4. Fetch Driver Payout History from Operational Expenses
  const payoutExpenses = await prisma.operationalExpense.findMany({
    where: {
      companyId,
      category: "DRIVER_PAYOUT",
    },
  });

  const paidMap: Record<string, number> = {};
  for (const exp of payoutExpenses) {
    if (exp.reference) {
      const driver = exp.reference.trim();
      paidMap[driver] = (paidMap[driver] || 0) + exp.amount;
    }
  }

  // 5. Group by Driver Name
  const driverMap = new Map<string, DriverTripSummary>();

  for (const t of tickets) {
    const name = (t.driverName || "سائق غير محدد").trim();
    const isCompleted = t.status === "DELIVERED";
    const isInTransit = t.status === "IN_TRANSIT";
    const vol = t.cumulativeQuantity || 0;
    const rate = customRates[name] !== undefined ? customRates[name] : defaultRate;

    if (!driverMap.has(name)) {
      driverMap.set(name, {
        driverName: name,
        driverPhone: t.driverPhone || undefined,
        truckNumber: t.truckNumber || "MIXER-01",
        totalTrips: 0,
        completedTrips: 0,
        inTransitTrips: 0,
        totalVolumeM3: 0,
        ratePerTrip: rate,
        totalEarned: 0,
        totalPaid: paidMap[name] || 0,
        balanceDue: 0,
        recentTickets: [],
      });
    }

    const current = driverMap.get(name)!;
    current.totalTrips += 1;
    if (isCompleted) current.completedTrips += 1;
    if (isInTransit) current.inTransitTrips += 1;
    current.totalVolumeM3 += vol;
    current.totalEarned = current.totalTrips * current.ratePerTrip;
    current.balanceDue = Math.max(0, current.totalEarned - current.totalPaid);

    if (current.recentTickets.length < 15) {
      current.recentTickets.push({
        id: t.id,
        ticketNumber: t.ticketNumber,
        orderNumber: t.order?.orderNumber || `ORD-${t.orderId}`,
        customerName: t.order?.customer?.name || "عميل عام",
        projectName: t.order?.project?.name || "مشروع عام",
        quantityM3: vol,
        status: t.status,
        createdAt: t.createdAt,
        truckNumber: t.truckNumber,
      });
    }
  }

  // Also include vehicles/registered drivers even if they have 0 trips yet
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId, status: "ACTIVE" },
  });

  for (const v of vehicles) {
    if (v.name && !driverMap.has(v.name.trim())) {
      const name = v.name.trim();
      const rate = customRates[name] !== undefined ? customRates[name] : defaultRate;
      driverMap.set(name, {
        driverName: name,
        truckNumber: v.code,
        totalTrips: 0,
        completedTrips: 0,
        inTransitTrips: 0,
        totalVolumeM3: 0,
        ratePerTrip: rate,
        totalEarned: 0,
        totalPaid: paidMap[name] || 0,
        balanceDue: 0,
        recentTickets: [],
      });
    }
  }

  const driverList = Array.from(driverMap.values()).sort(
    (a, b) => b.totalTrips - a.totalTrips,
  );

  let grandTrips = 0;
  let grandVolume = 0;
  let grandEstimatedPayout = 0;

  for (const d of driverList) {
    grandTrips += d.totalTrips;
    grandVolume += d.totalVolumeM3;
    grandEstimatedPayout += d.balanceDue;
  }

  const allFormattedTickets = tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    orderNumber: t.order?.orderNumber || `ORD-${t.orderId}`,
    driverName: t.driverName || "سائق غير محدد",
    truckNumber: t.truckNumber || "MIXER",
    customerName: t.order?.customer?.name || "عميل عام",
    projectName: t.order?.project?.name || "مشروع عام",
    quantityM3: t.cumulativeQuantity || 0,
    status: t.status,
    createdAt: t.createdAt,
  }));

  return {
    drivers: driverList,
    allTickets: allFormattedTickets,
    totalDriversCount: driverList.length,
    totalTripsCount: grandTrips,
    totalDeliveredVolumeM3: Math.round(grandVolume * 10) / 10,
    totalEstimatedPayout: Math.round(grandEstimatedPayout * 100) / 100,
    currency,
  };
}

export async function saveDriverTripRate(
  companyId: number,
  driverName: string,
  rate: number,
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

  const existing = await prisma.companySetting.findFirst({
    where: { companyId, key: "driver_custom_trip_rates" },
  });

  let ratesObj: Record<string, number> = {};
  if (existing && existing.value) {
    try {
      ratesObj = JSON.parse(existing.value);
    } catch {}
  }

  ratesObj[driverName.trim()] = Number(rate);

  if (existing) {
    await prisma.companySetting.update({
      where: { id: existing.id },
      data: { value: JSON.stringify(ratesObj) },
    });
  } else {
    await prisma.companySetting.create({
      data: {
        companyId,
        key: "driver_custom_trip_rates",
        value: JSON.stringify(ratesObj),
      },
    });
  }

  revalidatePath("/system/accountant/drivers");
  return { success: true };
}

export async function recordDriverPayout(
  companyId: number,
  data: {
    driverName: string;
    amount: number;
    tripsSettledCount: number;
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

  const { driverName, amount, tripsSettledCount, paymentMethod, notes } = data;

  if (!driverName || !amount || amount <= 0) {
    return { success: false, error: "المبلغ واسم السائق مطلوبان للصرف" };
  }

  // 1. Create Operational Expense
  const expense = await prisma.operationalExpense.create({
    data: {
      companyId,
      category: "DRIVER_PAYOUT",
      amount,
      reference: driverName.trim(),
      details: notes || `صرف مستحقات ${tripsSettledCount} وصولات ونقلات صب خرساني (طريقة الدفع: ${paymentMethod === "CASH" ? "نقداً" : "تحويل بنكي"})`,
      timestamp: new Date(),
    },
  });

  // 2. Add Debit Ledger Entry
  await prisma.ledgerEntry.create({
    data: {
      companyId,
      type: "DEBIT",
      amount,
      description: `صرف مستحقات وصولات السائق ${driverName} (${tripsSettledCount} وصل)`,
      date: new Date(),
    },
  });

  revalidatePath("/system/accountant/drivers");
  revalidatePath("/system/accountant/expenses");
  revalidatePath("/system/accountant/reports");

  return { success: true, expenseId: expense.id };
}
