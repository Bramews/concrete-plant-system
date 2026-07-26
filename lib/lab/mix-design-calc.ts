/**
 * Mix Design Calculation Engine
 * Implements ACI 211.1, IS 10262, and Moisture Correction logic.
 */

export interface MaterialProperties {
  id?: number;
  name: string;
  specificGravity: number;
  absorption: number; // %
  moistureContent: number; // %
  finenessModulus?: number;
  unitWeight?: number; // kg/m3 (for coarse aggregate)
  type?: string;
}

export interface DesignTargets {
  f_prime_c: number; // MPa
  strengthClass: string; // e.g. C30/37
  slump: number; // mm
  maxSize: number; // mm
  airContent: number; // %
  isAirEntrained: boolean;
  isPumpable: boolean;
}

export interface MixResult {
  cement: number; // kg
  microSilica?: number; // kg
  ggbfs?: number; // kg
  flyAsh?: number; // kg
  water: number; // kg
  fineAggregate: number; // kg
  blackSand?: number; // kg
  coarseAggregate: number; // kg
  bahas?: number; // kg
  admixture?: number; // kg/L (calculated as % of cementitious)
  admixturePct?: number; // %
  w_c_ratio: number;
  density: number;
  totalCementitious: number;
  proportions: {
    cementitious: number;
    fine: number;
    coarse: number;
    water: number;
  };
}

/**
 * ACI 211.1 Absolute Volume Method
 */
export function calculateACIMix(
  targets: DesignTargets,
  cement: MaterialProperties,
  sand: MaterialProperties,
  coarseAggregate: MaterialProperties,
  options?: {
    microSilicaPct?: number;
    ggbfsPct?: number;
    flyAshPct?: number;
    admixturePct?: number;
    blackSandPct?: number;
    bahasPct?: number;
  },
): MixResult {
  // 1. Water Content (Simplified ACI Table 6.3.3)
  let water = 0;
  if (targets.slump <= 50) water = 180;
  else if (targets.slump <= 100) water = 200;
  else water = 215;

  // 2. W/C Ratio (Simplified ACI Table 6.3.4a)
  let wc = 0.85 - targets.f_prime_c / 100;
  if (targets.f_prime_c >= 40) wc = 0.4;
  if (targets.f_prime_c <= 15) wc = 0.7;

  // 3. Total Cementitious Content
  const totalCementitious = water / wc;

  // Split cementitious materials
  const msWeight = (totalCementitious * (options?.microSilicaPct || 0)) / 100;
  const ggbfsWeight = (totalCementitious * (options?.ggbfsPct || 0)) / 100;
  const flyAshWeight = (totalCementitious * (options?.flyAshPct || 0)) / 100;
  const cementWeight =
    totalCementitious - (msWeight + ggbfsWeight + flyAshWeight);

  // 4. Coarse Aggregate (ACI Table 6.3.6)
  const b_b0 = 0.65;
  const baseCoarseWeight = b_b0 * (coarseAggregate.unitWeight || 1600);
  const bahasWeight = (baseCoarseWeight * (options?.bahasPct || 0)) / 100;
  const coarseWeight = baseCoarseWeight - bahasWeight;

  // 5. Admixture
  const admixtureWeight =
    (totalCementitious * (options?.admixturePct || 0)) / 100;

  // 6. Absolute Volume method for Fine Aggregate
  const volCement = cementWeight / (cement.specificGravity * 1000);
  const volMS = msWeight / (2.2 * 1000); // Specific gravity micro silica ~2.2
  const volGGBS = ggbfsWeight / (2.9 * 1000); // SG GGBS ~2.9
  const volFlyAsh = flyAshWeight / (2.3 * 1000); // SG Fly Ash ~2.3
  const volWater = water / 1000;
  const volAir = targets.airContent / 100;
  const volCoarse = coarseWeight / (coarseAggregate.specificGravity * 1000);
  const volBahas = bahasWeight / (coarseAggregate.specificGravity * 1000); // Assume same SG for Bahas for simplicity or update
  const volAdmix = admixtureWeight / (1.2 * 1000); // Admix SG ~1.2

  const volFineTotal =
    1.0 -
    (volCement +
      volMS +
      volGGBS +
      volFlyAsh +
      volWater +
      volAir +
      volCoarse +
      volBahas +
      volAdmix);

  const blackSandWeight =
    ((volFineTotal * (options?.blackSandPct || 0)) / 100) *
    sand.specificGravity *
    1000;
  const fineWeight =
    volFineTotal * sand.specificGravity * 1000 - blackSandWeight;

  const result = {
    cement: Math.round(cementWeight),
    microSilica: Math.round(msWeight),
    ggbfs: Math.round(ggbfsWeight),
    flyAsh: Math.round(flyAshWeight),
    water: Math.round(water),
    fineAggregate: Math.round(fineWeight),
    blackSand: Math.round(blackSandWeight),
    coarseAggregate: Math.round(coarseWeight),
    bahas: Math.round(bahasWeight),
    admixture: Number(admixtureWeight.toFixed(2)),
    admixturePct: options?.admixturePct || 0,
    w_c_ratio: Number(wc.toFixed(2)),
    totalCementitious: Math.round(totalCementitious),
    density: Math.round(
      totalCementitious +
        water +
        fineWeight +
        blackSandWeight +
        coarseWeight +
        bahasWeight +
        admixtureWeight,
    ),
    proportions: {
      cementitious: 1,
      fine: Number(
        ((fineWeight + blackSandWeight) / totalCementitious).toFixed(2),
      ),
      coarse: Number(
        ((coarseWeight + bahasWeight) / totalCementitious).toFixed(2),
      ),
      water: Number(wc.toFixed(2)),
    },
  };

  return result;
}

/**
 * IS 10262:2019 (Simplified)
 */
export function calculateISMix(
  targets: DesignTargets,
  cement: MaterialProperties,
  sand: MaterialProperties,
  coarseAggregate: MaterialProperties,
): MixResult {
  // 1. Target Strength for Mix Proportioning (f'ck = fck + 1.65s)
  const targetStrength = targets.f_prime_c + 8.25;

  // 2. Selection of Water-Cement Ratio
  let wc = 0.55 - (targetStrength - 20) * 0.005;
  wc = Math.max(0.35, Math.min(wc, 0.6));

  // 3. Selection of Water Content
  let water = 186; // For 20mm aggregate
  if (targets.slump > 50) {
    water += water * 0.03 * ((targets.slump - 50) / 25);
  }

  // 4. Cementitious Material Content
  const cementWeight = water / wc;

  // 5. Estimation of Coarse Aggregate Proportion
  const volCoarse = 0.62; // Simplified for Zone II sand
  const coarseWeight = volCoarse * (coarseAggregate.unitWeight || 1600);

  // 6. Absolute Volume method for Fine Aggregate
  const volCement = cementWeight / (cement.specificGravity * 1000);
  const volWater = water / 1000;
  const volAir = targets.airContent / 100;
  const volCoarseTotal =
    coarseWeight / (coarseAggregate.specificGravity * 1000);

  const volFine = 1.0 - (volCement + volWater + volAir + volCoarseTotal);
  const fineWeight = volFine * sand.specificGravity * 1000;

  return {
    cement: Math.round(cementWeight),
    water: Math.round(water),
    fineAggregate: Math.round(fineWeight),
    coarseAggregate: Math.round(coarseWeight),
    w_c_ratio: Number(wc.toFixed(2)),
    totalCementitious: Math.round(cementWeight),
    density: Math.round(cementWeight + water + fineWeight + coarseWeight),
    proportions: {
      cementitious: 1,
      fine: Number((fineWeight / cementWeight).toFixed(2)),
      coarse: Number((coarseWeight / cementWeight).toFixed(2)),
      water: Number(wc.toFixed(2)),
    },
  };
}

/**
 * EN 206 (Simplified)
 */
export function calculateENMix(
  targets: DesignTargets,
  cement: MaterialProperties,
  sand: MaterialProperties,
  coarseAggregate: MaterialProperties,
): MixResult {
  let wc = 0.5;
  if (targets.f_prime_c > 40) wc = 0.4;
  else if (targets.f_prime_c < 25) wc = 0.6;

  const water = 185;
  const cementWeight = water / wc;

  const totalVol =
    1.0 -
    (cementWeight / (cement.specificGravity * 1000) +
      water / 1000 +
      targets.airContent / 100);
  const volFine = totalVol * 0.4;
  const volCoarse = totalVol * 0.6;

  const fineWeight = volFine * sand.specificGravity * 1000;
  const coarseWeight = volCoarse * coarseAggregate.specificGravity * 1000;

  return {
    cement: Math.round(cementWeight),
    water: Math.round(water),
    fineAggregate: Math.round(fineWeight),
    coarseAggregate: Math.round(coarseWeight),
    w_c_ratio: Number(wc.toFixed(2)),
    totalCementitious: Math.round(cementWeight),
    density: Math.round(cementWeight + water + fineWeight + coarseWeight),
    proportions: {
      cementitious: 1,
      fine: Number((fineWeight / cementWeight).toFixed(2)),
      coarse: Number((coarseWeight / cementWeight).toFixed(2)),
      water: Number(wc.toFixed(2)),
    },
  };
}

/**
 * Apply Moisture and Absorption Correction
 */
export function applyMoistureCorrection(
  baseWeights: {
    cement: number;
    microSilica?: number;
    ggbfs?: number;
    flyAsh?: number;
    water: number;
    fine: number;
    blackSand?: number;
    coarse: number;
    bahas?: number;
    admixture?: number;
  },
  sand: MaterialProperties,
  coarseAggregate: MaterialProperties,
  blackSand?: MaterialProperties,
  bahas?: MaterialProperties,
) {
  // Adjusted Weights (Wet weights)
  const adjFine = baseWeights.fine * (1 + sand.moistureContent / 100);
  const adjBlackSand =
    (baseWeights.blackSand || 0) *
    (1 + (blackSand?.moistureContent || 0) / 100);
  const adjCoarse =
    baseWeights.coarse * (1 + coarseAggregate.moistureContent / 100);
  const adjBahas =
    (baseWeights.bahas || 0) * (1 + (bahas?.moistureContent || 0) / 100);

  // Surface Moisture Contribution (Free Water)
  const sandFreeWater =
    (baseWeights.fine * (sand.moistureContent - sand.absorption)) / 100;
  const blackSandFreeWater =
    ((baseWeights.blackSand || 0) *
      ((blackSand?.moistureContent || 0) - (blackSand?.absorption || 0))) /
    100;
  const coarseFreeWater =
    (baseWeights.coarse *
      (coarseAggregate.moistureContent - coarseAggregate.absorption)) /
    100;
  const bahasFreeWater =
    ((baseWeights.bahas || 0) *
      ((bahas?.moistureContent || 0) - (bahas?.absorption || 0))) /
    100;

  // Total Water Correction
  const adjWater =
    baseWeights.water -
    (sandFreeWater + blackSandFreeWater + coarseFreeWater + bahasFreeWater);

  return {
    cement: baseWeights.cement,
    microSilica: baseWeights.microSilica || 0,
    ggbfs: baseWeights.ggbfs || 0,
    flyAsh: baseWeights.flyAsh || 0,
    fine: Math.round(adjFine),
    blackSand: Math.round(adjBlackSand),
    coarse: Math.round(adjCoarse),
    bahas: Math.round(adjBahas),
    water: Math.round(adjWater),
    admixture: baseWeights.admixture || 0,
  };
}

/**
 * Packing Curve (Fuller-Andreasen)
 */
export function getIdealGrading(
  maxSize: number,
  n: number = 0.5,
  sieves: number[],
) {
  return sieves.map((d) => ({
    sieve: d,
    passing: Math.min(100, 100 * Math.pow(d / maxSize, n)),
  }));
}
