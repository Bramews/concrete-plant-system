/**
 * Lab Calculations Engine
 * Handles all unit conversions and standard-specific formulas
 */

export type SampleShape = "CUBE" | "CYLINDER" | "BEAM";
export type UnitSystem = "METRIC" | "IMPERIAL";

export type ForceUnit = "kN" | "N" | "Lbf" | "Kgf" | "Ton";
export type StressUnit = "MPa" | "Psi" | "N/mm2" | "Kg/cm2";

export interface Dimensions {
  width?: number; // mm
  height?: number; // mm
  length?: number; // mm
  diameter?: number; // mm
}

export interface Specimen {
  shape: SampleShape;
  dimensions: Dimensions;
}

/**
 * Calculates the cross-sectional area of a specimen in mm²
 */
export function calculateArea(specimen: Specimen): number {
  const { shape, dimensions } = specimen;

  if (shape === "CUBE") {
    if (!dimensions.width || !dimensions.height)
      throw new Error("Missing dimensions for CUBE");
    return dimensions.width * dimensions.height;
  }

  if (shape === "CYLINDER") {
    if (!dimensions.diameter) throw new Error("Missing diameter for CYLINDER");
    const radius = dimensions.diameter / 2;
    return Math.PI * Math.pow(radius, 2);
  }

  return 0;
}

/**
 * Convert any Force to Newtons (N)
 */
export function convertForceToNewtons(value: number, unit: ForceUnit): number {
  switch (unit) {
    case "kN":
      return value * 1000;
    case "N":
      return value;
    case "Lbf":
      return value * 4.44822;
    case "Kgf":
      return value * 9.80665;
    case "Ton":
      return value * 1000 * 9.80665; // Metric Ton
    default:
      return value;
  }
}

/**
 * Convert MPa to Target Stress Unit
 */
export function convertStress(mpa: number, targetUnit: StressUnit): number {
  switch (targetUnit) {
    case "MPa":
    case "N/mm2":
      return mpa;
    case "Psi":
      return mpa * 145.0377;
    case "Kg/cm2":
      return mpa * 10.19716;
    default:
      return mpa;
  }
}

/**
 * Calculates Compressive Strength
 * @param force Force Value
 * @param forceUnit Unit of the input force
 * @param specimen Specimen details
 * @param standardCode Code of the standard used
 * @param outputUnit Desired output unit (default MPa)
 * @returns Strength in generic unit and standardized MPa
 */
export function calculateCompressiveStrength(
  force: number,
  forceUnit: ForceUnit,
  specimen: Specimen,
  standardCode: string,
  outputUnit: StressUnit = "MPa",
): {
  strength: number;
  strengthMPa: number;
  area: number;
  correctionFactor: number;
} {
  const area = calculateArea(specimen); // mm²
  if (area === 0)
    return { strength: 0, strengthMPa: 0, area: 0, correctionFactor: 1 };

  // 1. Normalize Force to Newtons
  const forceN = convertForceToNewtons(force, forceUnit);

  // 2. Basic Stress = Force (N) / Area (mm²) = MPa
  let strengthMPa = forceN / area;

  // 3. Apply Correction Factors
  let correctionFactor = 1.0;
  if (standardCode === "ASTM_C39" && specimen.shape === "CYLINDER") {
    const { diameter, height } = specimen.dimensions;
    if (diameter && height) {
      const ratio = height / diameter;
      if (ratio <= 1.75) {
        if (ratio >= 1.75) correctionFactor = 1.0;
        else if (ratio >= 1.5) correctionFactor = 0.96;
        else if (ratio >= 1.25) correctionFactor = 0.93;
        else if (ratio >= 1.0) correctionFactor = 0.87;
      }
    }
  }

  // Apply Correction
  strengthMPa = strengthMPa * correctionFactor;

  // 4. Convert to Output Unit
  let strength = convertStress(strengthMPa, outputUnit);

  // Rounding
  strength = Math.round(strength * 100) / 100; // 2 decimal places
  strengthMPa = Math.round(strengthMPa * 100) / 100;

  return { strength, strengthMPa, area, correctionFactor };
}

/**
 * Legacy Converter (Keep for compatibility if needed)
 */
export const UnitConverter = {
  mpaToPsi: (mpa: number) => mpa * 145.0377,
  psiToMpa: (psi: number) => psi / 145.0377,
  knToLbf: (kn: number) => kn * 224.809,
  lbfToKn: (lbf: number) => lbf / 224.809,
  mmToInch: (mm: number) => mm / 25.4,
  inchToMm: (inch: number) => inch * 25.4,
};
