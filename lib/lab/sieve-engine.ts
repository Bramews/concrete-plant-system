export interface SieveReading {
  size: string;
  weightRetained: number;
}

export interface SieveLimit {
  size: string;
  min: number;
  max: number;
}

export interface SieveResult {
  size: string;
  retained: number;
  percentRetained: number;
  cumulativeRetained: number;
  passing: number;
  minLimit?: number;
  maxLimit?: number;
  status: "PASS" | "FAIL" | "NEUTRAL";
}

export interface SieveAnalysisCalculation {
  results: SieveResult[];
  finenessModulus: number;
  isPassed: boolean;
}

/**
 * محرك حسابات التحليل المنخلي
 * Siemens Sieve Analysis Engine
 */
export function calculateSieveAnalysis(
  readings: Record<string, number>,
  totalWeight: number,
  limits: SieveLimit[] = [],
): SieveAnalysisCalculation {
  let cumulativeWeight = 0;
  let finenessModulusSum = 0;
  const results: SieveResult[] = [];

  // نستخدم الحدود كمرجع لترتيب المناخل إذا وجدت، وإلا نستخدم القراءات
  const sieveSizes =
    limits.length > 0
      ? limits.map((l) => l.size)
      : Object.keys(readings).sort((a, b) => {
          const valA = parseFloat(a);
          const valB = parseFloat(b);
          return valB - valA;
        });

  sieveSizes.forEach((size) => {
    const retained = readings[size] || 0;
    cumulativeWeight += retained;

    const percentRetained = (retained / totalWeight) * 100;
    const cumulativePercentRetained = (cumulativeWeight / totalWeight) * 100;
    const passing = 100 - cumulativePercentRetained;

    if (isStandardFMSieve(size)) {
      finenessModulusSum += cumulativePercentRetained;
    }

    const limit = limits.find((l) => l.size === size);
    let status: "PASS" | "FAIL" | "NEUTRAL" = "NEUTRAL";

    if (limit) {
      status = passing >= limit.min && passing <= limit.max ? "PASS" : "FAIL";
    }

    results.push({
      size,
      retained,
      percentRetained: roundTo(percentRetained, 2),
      cumulativeRetained: roundTo(cumulativePercentRetained, 2),
      passing: roundTo(passing, 2),
      minLimit: limit?.min,
      maxLimit: limit?.max,
      status,
    });
  });

  const finenessModulus = roundTo(finenessModulusSum / 100, 2);
  const isPassed = results.every((r) => r.status !== "FAIL");

  return {
    results,
    finenessModulus,
    isPassed,
  };
}

function roundTo(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function isStandardFMSieve(size: string): boolean {
  const normalized = size.toLowerCase().trim();
  const standardSizes = [
    "75mm",
    "37.5mm",
    "19mm",
    "9.5mm",
    "4.75mm",
    "2.36mm",
    "1.18mm",
    "600um",
    "300um",
    "150um",
  ];
  return (
    standardSizes.includes(normalized) ||
    standardSizes.includes(normalized.replace("um", "µm"))
  );
}
