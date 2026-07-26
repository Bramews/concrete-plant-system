/**
 * مخصص لمطابقة معادلات ملف Excel (TM9) المرسل من المستخدم.
 * d:\concrete-plant-system\exel\T1 - 300 cement.xlsx
 */

export interface MaterialInput {
  weight: number | null; // Kg/m3 (Theoretical)
  sg: number | null; // Specific Gravity
  absorption?: number | null; // %
  moisture?: number | null; // %
}

export interface MixDesignInputs {
  trialLiters: number | null;
  cement: MaterialInput;
  microsilica: MaterialInput;
  ggbfs: MaterialInput;
  flyAsh: MaterialInput;
  filler: MaterialInput;
  sand: MaterialInput;
  naturalSand: MaterialInput;
  ca10mm: MaterialInput;
  ca20mm: MaterialInput;
  water: number | null; // Target Water (L)
  admixture: {
    dosage: number | null; // L/m3 or % of cementitious
    sg: number | null;
  };
  airContent: number | null; // Volume Liter (e.g. 20L for 2%)
}

export interface CalculationResult {
  cement: CalculatedComponent;
  microsilica: CalculatedComponent;
  ggbfs: CalculatedComponent;
  flyAsh: CalculatedComponent;
  filler: CalculatedComponent;
  sand: CalculatedComponent;
  naturalSand: CalculatedComponent;
  ca10mm: CalculatedComponent;
  ca20mm: CalculatedComponent;
  water: CalculatedComponent;
  admixture: CalculatedComponent;
  air: {
    volume: number;
  };
  summary: {
    totalCementitious: number;
    totalWeight: number;
    totalVolume: number;
    wcRatio: number;
    volumeTolerance: number;
    density: number;
    waterCorrection: number;
  };
}

export interface CalculatedComponent {
  baseWeight: number; // E31 (الهدف)
  ssdWeight: number; // I31 (الفعلي SSD - يعتمد على الامتصاص فقط)
  correctedWeight: number; // F31 (المصحح للتجربة - يعتمد على الرطوبة)
  trialBatchWeight: number; // الوزن لحجم الخلطة المراد (L)
  volume: number; // الحجم (L)
}

export function calculateExcelMix(inputs: MixDesignInputs): CalculationResult {
  const trialLiters = inputs.trialLiters || 0;
  const trialFactor = trialLiters / 1000;

  // 1. حساب المواد الأسمنتية
  const totalCementitious =
    (inputs.cement.weight || 0) +
    (inputs.microsilica.weight || 0) +
    (inputs.ggbfs.weight || 0) +
    (inputs.flyAsh.weight || 0);

  // معادلات الإكسيل الدقيقة:
  // Absorption Contribution (للوصول إلى I31)
  const getAbsContribution = (inp: MaterialInput) => {
    return (inp.weight || 0) * ((inp.absorption || 0) / 100);
  };

  // Moisture Correction (L31 - للوصول إلى F31)
  // L27 = (Moisture - Absorption) * Weight / 100
  const getMoistureCorrection = (inp: MaterialInput) => {
    return (
      (inp.weight || 0) * (((inp.moisture || 0) - (inp.absorption || 0)) / 100)
    );
  };

  // الماء المستهدف هو نفسه الماء في حالة SSD (Free Water)
  const totalAbsContribution =
    getAbsContribution(inputs.sand) +
    getAbsContribution(inputs.naturalSand) +
    getAbsContribution(inputs.ca10mm) +
    getAbsContribution(inputs.ca20mm);

  const ssdWater = (inputs.water || 0) - totalAbsContribution; // I31 = Target Water - Total Absorption

  // L31 = مجموع تصحيحات الرطوبة
  const totalMoistureCorrection =
    getMoistureCorrection(inputs.sand) +
    getMoistureCorrection(inputs.naturalSand) +
    getMoistureCorrection(inputs.ca10mm) +
    getMoistureCorrection(inputs.ca20mm);

  const trialWater = ssdWater - totalMoistureCorrection; // F31 (المصحح للتجربة)

  // 4. دالة مساعدة لحساب المكونات
  const calcComp = (
    inp: MaterialInput,
    isWater = false,
  ): CalculatedComponent => {
    const weight = inp.weight || 0;
    const sg = inp.sg || 0;
    let ssd = weight;
    let corrected = weight;

    if (!isWater) {
      // الركام: الوزن الأساسي SSD لا يتأثر بالامتصاص (لأنه SSD أصلاً)
      // لكن الوزن "المصحح" في التجربة يتأثر بحالة الرطوبة (L-columns)
      ssd = weight;
      corrected = weight + getMoistureCorrection(inp);
    } else {
      // الماء:
      ssd = ssdWater; // I31
      corrected = trialWater; // F31
    }

    const vol = sg > 0 ? (isWater ? ssdWater : weight) / sg : 0;

    return {
      baseWeight: weight,
      ssdWeight: ssd,
      correctedWeight: corrected,
      trialBatchWeight: corrected * trialFactor,
      volume: vol,
    };
  };

  const admixtureWeight =
    totalCementitious * ((inputs.admixture?.dosage || 0) / 100);

  const res: any = {
    cement: calcComp(inputs.cement),
    microsilica: calcComp(inputs.microsilica),
    ggbfs: calcComp(inputs.ggbfs),
    flyAsh: calcComp(inputs.flyAsh),
    filler: calcComp(inputs.filler),
    sand: calcComp(inputs.sand),
    naturalSand: calcComp(inputs.naturalSand),
    ca10mm: calcComp(inputs.ca10mm),
    ca20mm: calcComp(inputs.ca20mm),
    water: calcComp({ weight: inputs.water || 0, sg: 1 }, true),
    admixture: {
      baseWeight: admixtureWeight,
      ssdWeight: admixtureWeight,
      correctedWeight: admixtureWeight,
      trialBatchWeight: admixtureWeight * trialFactor,
      volume:
        (inputs.admixture?.sg || 1) > 0
          ? admixtureWeight / (inputs.admixture?.sg || 1)
          : 0,
    },
    air: {
      volume: inputs.airContent ?? 0,
    },
  };

  // 5. المجاميع
  const totalVolume =
    res.cement.volume +
    res.microsilica.volume +
    res.ggbfs.volume +
    res.flyAsh.volume +
    res.filler.volume +
    res.sand.volume +
    res.naturalSand.volume +
    res.ca10mm.volume +
    res.ca20mm.volume +
    res.water.volume +
    res.admixture.volume +
    (res.air.volume || 0);

  const totalWeight =
    res.cement.baseWeight +
    res.microsilica.baseWeight +
    res.ggbfs.baseWeight +
    res.flyAsh.baseWeight +
    res.filler.baseWeight +
    res.sand.baseWeight +
    res.naturalSand.baseWeight +
    res.ca10mm.baseWeight +
    res.ca20mm.baseWeight +
    (inputs.water || 0) +
    admixtureWeight;

  const density = totalVolume > 0 ? (totalWeight / totalVolume) * 1000 : 0;

  const targetVol = inputs.trialLiters || 1000;

  res.summary = {
    totalCementitious,
    totalWeight,
    totalVolume,
    wcRatio:
      totalCementitious > 0 ? (inputs.water || 0) / totalCementitious : 0,
    volumeTolerance: targetVol - totalVolume,
    density,
    waterCorrection: totalMoistureCorrection,
    absContribution: totalAbsContribution,
    ssdWater: ssdWater,
    trialWater: trialWater,
  };

  return res as CalculationResult;
}
