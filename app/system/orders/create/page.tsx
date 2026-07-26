import { getOrderFormData } from "@/app/actions/orders";
import { CreateOrderForm } from "./CreateOrderForm";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function CreateOrderPage() {
  const { customers, projects, mixes } = await getOrderFormData();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as "en" | "ar") || "en";

  const user = await getCurrentUser();
  const companyId = user?.companyId || 1;

  const [settings, activeOrders] = await Promise.all([
    prisma.systemSetting.findMany({
      where: { key: { in: ["congestion_min", "congestion_max"] } },
    }),
    prisma.order.findMany({
      where: {
        companyId,
        status: { in: ["APPROVED", "PENDING", "PRODUCTION", "DELIVERED"] },
        deletedAt: null,
      },
      select: {
        date: true,
        volume: true,
      },
    }),
  ]);

  const settingsMap = settings.reduce(
    (acc, s) => {
      acc[s.key] = s.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const congestionMin = parseInt(settingsMap["congestion_min"] || "300");
  const congestionMax = parseInt(settingsMap["congestion_max"] || "800");

  const dailyVolumes: Record<string, number> = {};
  for (const order of activeOrders) {
    if (order.date) {
      const dateStr = order.date.toISOString().split("T")[0];
      dailyVolumes[dateStr] =
        (dailyVolumes[dateStr] || 0) + (order.volume || 0);
    }
  }

  return (
    <CreateOrderForm
      customers={customers}
      projects={projects}
      mixes={mixes}
      lang={lang}
      congestionMin={congestionMin}
      congestionMax={congestionMax}
      dailyVolumes={dailyVolumes}
    />
  );
}
