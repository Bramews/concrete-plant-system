import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mixId = parseInt(id, 10);
  if (isNaN(mixId)) {
    return new NextResponse("Invalid Mix ID", { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const mix = await prisma.mixDesign.findUnique({
    where: { id: mixId, companyId: user.companyId },
    include: {
      approvedBy: true,
      MixComponent: {
        include: { material: true },
        orderBy: { material: { name: "asc" } },
      },
    },
  });

  if (!mix) {
    return new NextResponse("Mix Design not found", { status: 404 });
  }

  // Parse lab metadata
  let labResults: Record<string, any> = {};
  try {
    labResults = JSON.parse((mix.labResults as string) || "{}");
  } catch (e) {
    console.error("Failed to parse metadata", e);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <title>Mix Design - ${mix.code}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        @media print {
          body { padding: 0; margin: 20px; }
          .no-print { display: none; }
          .page-break { page-break-after: always; }
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #1e40af;
          text-transform: uppercase;
        }
        .header p {
          margin: 5px 0 0;
          color: #64748b;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-box {
          border: 1px solid #e2e8f0;
          padding: 15px;
          border-radius: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
        }
        .section-title {
          font-size: 1.2rem;
          color: #1e40af;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .footer-signatures {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 40px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #94a3b8;
          padding-top: 10px;
          margin-top: 60px;
          font-size: 0.9rem;
          color: #475569;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.8rem;
          margin-top: 10px;
        }
        .status-APPROVED { background: #dcfce7; color: #166534; }
        .status-DRAFT { background: #fef9c3; color: #854d0e; }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <button class="no-print print-btn" onclick="window.print()">Print Document</button>
      
      <div class="header">
        <h1>Concrete Mix Design Report</h1>
        <p>Document Version: <strong>v${mix.version}</strong> | Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}</p>
        <div class="status-badge status-${mix.status}">
          STATUS: ${mix.status}
        </div>
      </div>

      <div class="grid-2">
        <div class="info-box">
          <h3 style="margin-top:0">Mix Details</h3>
          <p><strong>Code:</strong> ${mix.code}</p>
          <p><strong>Name:</strong> ${mix.name}</p>
          <p><strong>Strength Class:</strong> ${mix.strengthClass || "N/A"}</p>
        </div>
        <div class="info-box">
          <h3 style="margin-top:0">Technical Targets</h3>
          <p><strong>Target W/C:</strong> ${mix.targetWC || "N/A"}</p>
          <p><strong>Target Slump:</strong> ${mix.targetSlump || "N/A"} mm</p>
          <p><strong>Required Strength:</strong> ${labResults.requiredStrength || "N/A"} MPa</p>
          <p><strong>Fresh Density:</strong> ${labResults.freshDensity || "N/A"} kg/m³</p>
        </div>
      </div>

      <h2 class="section-title">Material Proportions (per 1 m³)</h2>
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Type</th>
            <th style="text-align:right">Quantity</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          ${mix.MixComponent.map(
            (comp: any) => `
            <tr>
              <td>${comp.material?.name || comp.materialName}</td>
              <td>${comp.material?.type || "-"}</td>
              <td style="text-align:right">${comp.quantity.toFixed(2)}</td>
              <td>${comp.unit || "kg"}</td>
            </tr>
          `,
          ).join("")}
          <tr style="background:#f8fafc; font-weight:bold;">
            <td colspan="2">Total Mass</td>
            <td style="text-align:right">
              ${mix.MixComponent.reduce((sum: number, c: { quantity: number }) => sum + Number(c.quantity), 0).toFixed(2)}
            </td>
            <td>kg</td>
          </tr>
        </tbody>
      </table>

      ${
        mix.details
          ? `
        <h2 class="section-title">Additional Details & Notes</h2>
        <div class="info-box" style="background: #f8fafc; border: none;">
          <p style="white-space: pre-wrap; margin:0;">${mix.details}</p>
        </div>
      `
          : ""
      }

      <div class="footer-signatures">
        <div>
          <div class="signature-line">Prepared By (Lab Technician)</div>
        </div>
        <div>
          <div class="signature-line">Reviewed By (QC Manager)</div>
        </div>
        <div>
          <div class="signature-line">
            Approved By (Plant Manager)
            <br/>
            ${mix.status === "APPROVED" ? `<b>${mix.approvedBy?.name || mix.approverName || "—"}</b><br/>${format(new Date(mix.approvedAt!), "yyyy-MM-dd")}` : "<br/>(Pending)"}
          </div>
        </div>
      </div>

    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
