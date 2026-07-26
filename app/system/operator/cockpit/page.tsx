import React from "react";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "../../system-modules.css";

import PlantMap from "@/components/operator/PlantMap";
import LiveGauges from "@/components/operator/LiveGauges";
import DailyTimeline from "@/components/operator/DailyTimeline";
import ActiveOrdersKanban from "@/components/operator/ActiveOrdersKanban";
import DriverPwaSimulator from "@/components/operator/DriverPwaSimulator";
import OneClickProduction from "@/components/operator/OneClickProduction";

import CockpitClientTabs from "./CockpitClientTabs";
import { getPlcSettings } from "@/app/actions/plc";
import { ScadaPlantConsole } from "@/components/operator/ScadaPlantConsole";
import { redirect } from "next/navigation";

export default async function OperatorCockpitPage() {
  try {
    await requireRole([
      "OPERATOR",
      "MANAGER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "SYSTEM_OWNER",
    ]);
  } catch (e) {
    redirect("/api/auth/session-cleanup");
  }

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }
  const companyId = user.companyId as number;

  // 1. Fetch orders for Kanban
  const orders = await prisma.order.findMany({
    where: {
      companyId,
      status: {
        in: ["PENDING", "LAB_APPROVED", "PRODUCTION", "COMPLETED"],
      },
    },
    include: {
      customer: true,
      project: true,
      mixDesign: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer?.name || "عميل عام",
    volume: o.volume,
    actualQuantity: o.actualQuantity,
    mixGrade: o.mixDesign?.grade || "C30/37",
    status: o.status,
    projectAddress: o.project?.location || "الموقع الرئيسي",
  }));

  // 2. Fetch today's batches for timeline
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const DBBatches = await prisma.batch.findMany({
    where: {
      companyId,
      createdAt: {
        gte: startOfToday,
      },
    },
    include: {
      order: {
        include: {
          customer: true,
          mixDesign: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedBatches = DBBatches.map((b) => {
    const d = new Date(b.createdAt);
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return {
      id: b.id,
      time: `${hours}:${mins}`,
      quantity: b.quantity,
      orderNumber: b.order.orderNumber,
      customerName: b.order.customer?.name || "عميل عام",
      mixGrade: b.order.mixDesign?.grade || "C30/37",
    };
  });

  const plcSetting = await getPlcSettings();

  return (
    <div className="space-y-8" dir="rtl">
      {/* 🚀 SCADA Control Console & Hardware Cockpit */}
      {plcSetting && (
        <ScadaPlantConsole
          plcSetting={plcSetting}
          activeOrder={orders[0] || null}
        />
      )}

      <CockpitClientTabs
        PlantMap={<PlantMap />}
        LiveGauges={<LiveGauges />}
        DailyTimeline={<DailyTimeline batches={formattedBatches} />}
        ActiveOrdersKanban={<ActiveOrdersKanban orders={formattedOrders} />}
        DriverPwaSimulator={<DriverPwaSimulator />}
        OneClickProduction={<OneClickProduction orders={formattedOrders} />}
      />
    </div>
  );
}
