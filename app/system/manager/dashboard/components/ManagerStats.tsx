"use client";

import { Vehicle, Order } from "@prisma/client";

interface ManagerStatsProps {
  vehicles: Vehicle[];
  orders: Order[];
  lang: "en" | "ar";
}

export default function ManagerStats({
  vehicles,
  orders,
  lang,
}: ManagerStatsProps) {
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "MAINTENANCE",
  ).length;
  const activeOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "IN_PROGRESS",
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="card glass-panel p-6 flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          {"إجمالي الآليات"}
        </h3>
        <span className="text-4xl font-bold">{vehicles.length}</span>
        <div className="text-sm mt-2 flex gap-4">
          <span className="text-emerald-400">
            {activeVehicles} {"صالحة"}
          </span>
          <span className="text-red-400">
            {maintenanceVehicles} {"صيانة"}
          </span>
        </div>
      </div>

      <div className="card glass-panel p-6 flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          {"الأوردرات النشطة"}
        </h3>
        <span className="text-4xl font-bold text-blue-400">{activeOrders}</span>
        <span className="text-sm font-bold text-gray-500 mt-1">
          {"قيد التنفيذ / معلق"}
        </span>
      </div>

      <div className="card glass-panel p-6 flex flex-col items-center justify-center text-center opacity-70">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          {"المواد (عرض فقط)"}
        </h3>
        <span className="text-sm text-gray-400">
          {"مراجعة المخزون في القسم أدناه"}
        </span>
      </div>
    </div>
  );
}
