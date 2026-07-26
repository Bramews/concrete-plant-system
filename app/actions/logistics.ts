"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getFleetStatus() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  // Active tickets (In Transit, On Site)
  return prisma.deliveryTicket.findMany({
    where: {
      order: { companyId: user.companyId },
      status: { in: ["EN_ROUTE", "ON_SITE", "DISPATCHED"] },
    },
    include: {
      order: {
        include: {
          project: true,
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Simulated data generator for the demo (if no actual tickets exist)
export async function getSimulatedFleet() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  const baseTime = new Date();

  return [
    {
      id: "T-101",
      truckNumber: "M-45",
      status: "EN_ROUTE",
      driverName: "أحمد علي",
      projectName: "برج خليفة - المرحلة 2",
      batchTime: new Date(baseTime.getTime() - 25 * 60000), // 25 mins ago
      lat: 25.1972,
      lng: 55.2744,
      volume: 10,
    },
    {
      id: "T-102",
      truckNumber: "M-12",
      status: "ON_SITE",
      driverName: "محمد حسن",
      projectName: "فيلا جميرا - صب أعمدة",
      batchTime: new Date(baseTime.getTime() - 75 * 60000), // 75 mins ago (Warning)
      lat: 25.1234,
      lng: 55.1234,
      volume: 8,
    },
    {
      id: "T-103",
      truckNumber: "M-88",
      status: "LOADING",
      driverName: "خالد سعيد",
      projectName: "طريق القدرة - تسوية",
      batchTime: new Date(baseTime.getTime() - 5 * 60000), // 5 mins ago
      lat: 25.2048,
      lng: 55.2708,
      volume: 12,
    },
  ];
}

export async function simulateTruckMovement(vehicleId: number) {
  // Mock action for the dispatch simulation
  return { success: true, vehicleId };
}
