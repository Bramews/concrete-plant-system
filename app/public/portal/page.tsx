import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalClient } from "./PortalClient";

interface PageProps {
  searchParams: Promise<{
    guest_token?: string;
  }>;
}

export default async function PortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const guestToken = params.guest_token;

  if (!guestToken) {
    redirect("/login?error=missing_token");
  }

  // Find guest link and bypass tenancy check by using a raw query or checking DB
  const guestLink = await prisma.guestLink.findUnique({
    where: { token: guestToken },
  });

  if (!guestLink || new Date() > guestLink.expiresAt) {
    redirect("/login?error=invalid_token");
  }

  const companyId = guestLink.companyId;
  const allowedOrderId = guestLink.allowedOrderId;
  const allowedMixId = guestLink.allowedMixId;

  // Parse permissions
  let showMap = true;
  let showHistory = true;
  let notesText = "";

  if (guestLink.notes && guestLink.notes.startsWith("{")) {
    try {
      const parsed = JSON.parse(guestLink.notes);
      notesText = parsed.notes || "";
      showMap = parsed.showMap !== false;
      showHistory = parsed.showHistory !== false;
    } catch (e) {}
  } else {
    notesText = guestLink.notes || "";
  }

  // Fetch company branding
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { branding: true },
  });

  // Fetch order info
  let orderInfo = null;
  if (allowedOrderId) {
    orderInfo = await prisma.order.findUnique({
      where: { id: allowedOrderId },
      include: {
        customer: true,
        project: true,
        mixDesign: true,
      },
    });
  }

  return (
    <PortalClient
      companyId={companyId}
      guestToken={guestToken}
      allowedOrderId={allowedOrderId}
      allowedMixId={allowedMixId}
      showMap={showMap}
      showHistory={showHistory}
      companyName={company?.name || "المحطة الخرسانية"}
      branding={company?.branding}
      initialOrderInfo={orderInfo}
      notes={notesText}
    />
  );
}
