import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const companyId = searchParams.get("companyId");

  // قراءة موقع بتوكن (للسائق أو العميل)
  if (token) {
    const ticket = await prisma.deliveryTicket.findFirst({
      where: { trackingToken: token },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        destinationLat: true,
        destinationLng: true,
        destinationLabel: true,
        truckNumber: true,
        status: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  }

  // قراءة كل الشاحنات لشركة (للمدير — يتطلب session)
  if (companyId) {
    const tickets = await prisma.deliveryTicket.findMany({
      where: {
        companyId: parseInt(companyId),
        status: "DISPATCHED",
        lastLocationAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // آخر ساعة
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        truckNumber: true,
        driverName: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        destinationLabel: true,
      },
    });

    return NextResponse.json({ success: true, tickets });
  }

  return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
}
