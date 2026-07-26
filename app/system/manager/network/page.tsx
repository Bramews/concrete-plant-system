import {
  getNetworkSettings,
  getConnectedDevices,
  getAccessLogs,
  getActiveGuestLinks,
} from "@/app/actions/network";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NetworkClient } from "./NetworkClient";
import { redirect } from "next/navigation";

export default async function NetworkPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const resolvedCompanyId = user.companyId || 1;

  const settingsRes = await getNetworkSettings(resolvedCompanyId);
  const devicesRes = await getConnectedDevices(resolvedCompanyId);
  const logsRes = await getAccessLogs(resolvedCompanyId);
  const guestLinksRes = await getActiveGuestLinks(resolvedCompanyId);

  // Fetch active orders and active mix designs to restrict guest link visibility
  const orders = await prisma.order.findMany({
    where: { companyId: resolvedCompanyId },
    select: { id: true, orderNumber: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const mixes = await prisma.mixDesign.findMany({
    where: { companyId: resolvedCompanyId, isCurrent: true, deletedAt: null },
    select: { id: true, code: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <NetworkClient
      userRole={user.role}
      companyId={resolvedCompanyId}
      initialSettings={
        settingsRes.settings || {
          companyId: resolvedCompanyId,
          localAccessEnabled: true,
          globalAccessEnabled: false,
          startHour: "06:00",
          endHour: "18:00",
          scheduleEnabled: false,
        }
      }
      initialDevices={devicesRes.devices || []}
      initialLogs={logsRes.logs || []}
      initialGuestLinks={guestLinksRes.links || []}
      orders={orders}
      mixes={mixes}
    />
  );
}
