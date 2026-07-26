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
    const query = searchParams.get("q");
    const limit = searchParams.get("limit") || "5";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    // استدعاء خادم Nominatim الخارجي برمجياً من السيرفر لحفظ قواعد الـ CSP بالمتصفح
    const externalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}&accept-language=ar`;

    const response = await fetch(externalUrl, {
      headers: {
        "User-Agent": "Concrete-Plant-System-GIS/1.0.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch search results from provider" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // تحويل الاستجابة لعقد موحد متناسق
    const mapped = data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GIS API Gateway Search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
