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

    // استدعاء خوادم تحديد الموقع عبر الـ IP برمجياً من السيرفر لحفظ الـ CSP بالمتصفح
    const externalUrl = `https://ipapi.co/json/`;

    const response = await fetch(externalUrl, {
      headers: {
        "User-Agent": "Concrete-Plant-System-GIS/1.0.0",
      },
    });

    if (!response.ok) {
      // مزود بديل في حال تعطل المزود الأساسي أو تجاوزه للحد المسموح
      const fallbackUrl = `https://freeipapi.com/api/json`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "Concrete-Plant-System-GIS/1.0.0",
        },
      });
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return NextResponse.json({
          lat: fallbackData.latitude,
          lng: fallbackData.longitude,
          country: fallbackData.countryName,
          city: fallbackData.cityName,
        });
      }
      return NextResponse.json(
        { error: "Failed to fetch IP geolocation from all providers" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      lat: data.latitude,
      lng: data.longitude,
      country: data.country_name,
      city: data.city,
    });
  } catch (error) {
    console.error("GIS API Gateway IP error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
