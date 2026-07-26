import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/api-protection";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const check = await protectApiRoute(request, { requireAuth: true });
    if (!check.allowed) return check.response!;

    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Parameters 'lat' and 'lng' are required" },
        { status: 400 },
      );
    }

    // استدعاء خادم Nominatim الخارجي برمجياً من السيرفر لحفظ قواعد الـ CSP بالمتصفح
    const externalUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=ar`;

    const response = await fetch(externalUrl, {
      headers: {
        "User-Agent": "Concrete-Plant-System-GIS/1.0.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch reverse results from provider" },
        { status: response.status },
      );
    }

    const data = await response.json();

    const mapped = {
      displayName: data.display_name || "",
      region:
        data.address?.state || data.address?.city || data.address?.county || "",
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GIS API Gateway Reverse error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
