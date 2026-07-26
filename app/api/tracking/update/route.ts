import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * هذا الـ endpoint يُستدعى من:
 * 1. هاتف السائق (GPS browser API)
 * 2. نظام التتبع الخارجي (webhook)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, lat, lng } = body;

    if (!token || !lat || !lng) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);

    if (isNaN(latVal) || isNaN(lngVal)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 },
      );
    }

    const ticket = await prisma.deliveryTicket.findFirst({
      where: { trackingToken: token },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Invalid tracking token" },
        { status: 404 },
      );
    }

    await prisma.deliveryTicket.update({
      where: { id: ticket.id },
      data: {
        currentLat: latVal,
        currentLng: lngVal,
        lastLocationAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
