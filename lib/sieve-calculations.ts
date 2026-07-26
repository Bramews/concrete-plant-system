/**
 * Sieve Analysis Calculation Library
 */

export interface SieveReading {
  size: number;
  weightRetained: number;
}

export interface SieveResult {
  size: number;
  retained: number;
  percentRetained: number;
  cumulativeRetained: number;
  cumulativeWeightAbsolute: number;
  passing: number;
  status?: "PASS" | "FAIL" | "REVIEW";
  minLimit?: number;
  maxLimit?: number;
}

export function calculateSieveResults(
  readings: SieveReading[],
  totalWeight: number,
  limits?: Record<number, { min: number; max: number }>,
): {
  results: SieveResult[];
  finenessModulus: number;
} {
  if (!Array.isArray(readings)) return { results: [], finenessModulus: 0 };

  let cumulativeWeight = 0;
  let fmSum = 0;

  // Standard FM sieves (mm)
  const fmSieveValues = [4.75, 2.36, 1.18, 0.6, 0.3, 0.15];

  const results: SieveResult[] = readings
    .sort((a, b) => b.size - a.size)
    .map((reading) => {
      const retained = reading.weightRetained;
      cumulativeWeight += retained;

      const percentRetained =
        totalWeight > 0 ? (retained / totalWeight) * 100 : 0;
      const cumulativePercentRetained =
        totalWeight > 0 ? (cumulativeWeight / totalWeight) * 100 : 0;
      const passing = 100 - cumulativePercentRetained;

      if (fmSieveValues.includes(reading.size)) {
        fmSum += cumulativePercentRetained;
      }

      let status: SieveResult["status"];
      const limit = limits?.[reading.size];

      if (limit) {
        if (passing >= limit.min && passing <= limit.max) {
          status = "PASS";
        } else {
          status = "FAIL";
        }
      }

      return {
        size: reading.size,
        retained,
        percentRetained: Number(percentRetained.toFixed(2)),
        cumulativeRetained: Number(cumulativePercentRetained.toFixed(2)),
        cumulativeWeightAbsolute: Number(cumulativeWeight.toFixed(2)),
        passing: Number(passing.toFixed(2)),
        status,
        minLimit: limit?.min,
        maxLimit: limit?.max,
      };
    });

  const finenessModulus = Number((fmSum / 100).toFixed(1));

  return { results, finenessModulus };
}

export function judgeSieveAnalysis(results: SieveResult[]): {
  isAccepted: boolean;
  message: string;
} {
  const failed = results.filter((r) => r.status === "FAIL");
  const reviews = results.filter((r) => r.status === "REVIEW");

  if (failed.length > 0) {
    return {
      isAccepted: false,
      message: `مرفوض: فشل في ${failed.length} مناخل`,
    };
  }

  if (reviews.length > 0) {
    return {
      isAccepted: true,
      message: "مقبول مع ملاحظة (مراجعة)",
    };
  }

  return {
    isAccepted: true,
    message: "مقبول مطابـق للمواصفـات",
  };
}
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function exportSieveAnalysisToPDF({
  analysisData,
}: {
  analysisData: any;
}) {
  try {
    const doc = new jsPDF() as any;

    // Header
    doc.setFont("helvetica", "bold");
    doc.text("Sieve Analysis Report", 105, 15, { align: "center" });

    // Metadata
    doc.setFontSize(10);
    doc.text(`Lab No: ${analysisData.labNo || "-"}`, 20, 30);
    doc.text(
      `Test Date: ${analysisData.testDate ? new Date(analysisData.testDate).toLocaleDateString() : "-"}`,
      20,
      35,
    );
    doc.text(`Material: ${analysisData.material?.name || "---"}`, 20, 40);
    doc.text(`Supplier: ${analysisData.supplier || "-"}`, 20, 45);

    // Results Table
    const results = Array.isArray(analysisData.results)
      ? analysisData.results
      : typeof analysisData.results === "string"
        ? JSON.parse(analysisData.results)
        : [];

    const tableData = results.map((r: any) => [
      r.size === 0 ? "Pan" : r.size,
      r.retained?.toFixed(2) || "0.00",
      r.percentRetained?.toFixed(2) || "0.00",
      r.cumulativeRetained?.toFixed(1) || "0.0",
      r.passing?.toFixed(1) || "0.0",
      r.status === "FAIL" ? "Out" : "Pass",
    ]);

    autoTable(doc, {
      startY: 55,
      head: [
        ["Sieve", "Retained (g)", "(%)", "Cum. (%)", "Passing (%)", "State"],
      ],
      body: tableData,
    });

    try {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(
        `Fineness Modulus (FM): ${analysisData.finenessModulus || "0.0"}`,
        20,
        finalY,
      );
    } catch (e) {}

    doc.save(`Sieve_${analysisData.labNo || Date.now()}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("حدث خطأ أثناء تصدير PDF");
  }
}
