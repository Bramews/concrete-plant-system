import { prisma } from "@/lib/prisma";
import { TvDashboard } from "./TvDashboard";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    guest_token?: string;
  }>;
}

export default async function TvPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const guestToken = params.guest_token;

  let companyId: number;
  let isGuest = false;
  let allowedOrderId: number | null = null;
  let allowedMixId: number | null = null;

  if (guestToken) {
    // Guest Access
    const guestLink = await prisma.guestLink.findUnique({
      where: { token: guestToken },
    });

    if (!guestLink || new Date() > guestLink.expiresAt) {
      redirect("/login?error=invalid_token");
    }

    companyId = guestLink.companyId;
    isGuest = true;
    allowedOrderId = guestLink.allowedOrderId;
    allowedMixId = guestLink.allowedMixId;
  } else {
    // Authenticated Access
    const session = await getSession();
    if (!session?.companyId) {
      redirect("/login");
    }
    companyId = session.companyId;
  }

  // Fetch initial data
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const isRestricted = !!(allowedOrderId || allowedMixId);

  const batches = await prisma.batch.findMany({
    where: {
      companyId,
      order: {
        ...(allowedOrderId ? { id: allowedOrderId } : {}),
        ...(allowedMixId ? { mixDesignId: allowedMixId } : {}),
      },
      ...(!isRestricted ? { createdAt: { gte: startOfDay } } : {}),
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          customer: { select: { name: true } },
          project: { select: { name: true } },
          mixDesign: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const tests = await prisma.cubeTest.findMany({
    where: {
      companyId,
      order: {
        ...(allowedOrderId ? { id: allowedOrderId } : {}),
        ...(allowedMixId ? { mixDesignId: allowedMixId } : {}),
      },
      ...(!isRestricted ? { sampleDate: { gte: startOfDay } } : {}),
    },
    select: {
      id: true,
      mpa: true,
      status: true,
      sampleDate: true,
      age: true,
      order: {
        select: {
          orderNumber: true,
          mixDesign: { select: { code: true } },
        },
      },
    },
    orderBy: { sampleDate: "desc" },
    take: 10,
  });

  // Format data
  const formattedBatches = batches.map((b) => ({
    ...b,
    order: b.order
      ? {
          orderNumber: b.order.orderNumber,
          customer: b.order.customer ? { name: b.order.customer.name } : null,
          project: b.order.project ? { name: b.order.project.name } : null,
          mixDesign: b.order.mixDesign
            ? { code: b.order.mixDesign.code, name: b.order.mixDesign.name }
            : null,
        }
      : null,
  }));

  const formattedTests = tests.map((t) => ({
    ...t,
    order: t.order
      ? {
          orderNumber: t.order.orderNumber,
          mixDesign: t.order.mixDesign
            ? { code: t.order.mixDesign.code }
            : null,
        }
      : null,
  }));

  const totalVolume = formattedBatches.reduce(
    (sum, b) => sum + (b.quantity || 0),
    0,
  );
  const totalBatches = formattedBatches.length;

  return (
    <TvDashboard
      companyId={companyId}
      initialBatches={formattedBatches}
      initialTests={formattedTests}
      totalVolume={totalVolume}
      totalBatches={totalBatches}
      isGuest={isGuest}
      allowedOrderId={allowedOrderId}
      allowedMixId={allowedMixId}
      guestToken={guestToken}
    />
  );
}
