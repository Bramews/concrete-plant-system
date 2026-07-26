import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const mixId = parseInt(id, 10);
    if (isNaN(mixId)) {
      return new NextResponse("Invalid Mix ID", { status: 400 });
    }

    const mix = await prisma.mixDesign.findUnique({
      where: { id: mixId },
      include: {
        MixComponent: true,
      },
    });

    if (!mix) return new NextResponse("Not Found", { status: 404 });

    // Ensure user belongs to the same company
    if (mix.companyId !== user.companyId && user.role !== "SYSTEM_OWNER") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Create Workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Concrete Mix Design Report"],
      [""],
      ["General Information"],
      ["Mix Name", mix.name],
      ["Mix Code", mix.code],
      ["Strength Class", mix.strengthClass || "N/A"],
      ["Method", mix.method || "ACI"],
      ["Exposure Class", mix.exposureClass || "N/A"],
      ["Status", mix.status],
      [""],
      ["Design Targets"],
      ["Max Aggregate Size", `${mix.maxAggregateSize || 0} mm`],
      ["Target W/C Ratio", mix.targetWC || "N/A"],
      ["Target Slump", `${mix.targetSlump || 0} mm`],
      ["Target Air Content", `${mix.targetAir || 0} %`],
      ["Target Density", `${mix.targetDensity || 0} kg/m³`],
      [""],
      ["Components / Proportions"],
      [
        "Material Name",
        "Quantity (kg/m³)",
        "Specific Gravity",
        "Absorption (%)",
        "Moisture (%)",
      ],
    ];

    mix.MixComponent.forEach((c: any) => {
      summaryData.push([
        c.materialName,
        c.quantity.toString(),
        (c.specificGravity || 0).toString(),
        (c.absorption || 0).toString(),
        (c.moistureContent || 0).toString(),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);

    // Aesthetic adjustments (simplified for library limits)
    ws["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Mix Design");

    // Generate Buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="MixDesign_${mix.code}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
