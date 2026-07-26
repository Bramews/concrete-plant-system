/**
 * Concrete Strength Intelligence Engine
 * Standards: ACI 209R-92 / Eurocode 2
 */
export class StrengthEngine {
  /**
   * Predicts 28-day strength (MPa) based on an early sample.
   * @param age Age of the sample in days (e.g., 7)
   * @param mpa Measured strength at that age
   * @param cementType Type of cement (I, II, III)
   */
  static predict28Day(
    age: number,
    mpa: number,
    cementType: "I" | "II" | "III" = "I",
  ): number {
    if (age >= 28) return mpa;
    if (age <= 0) return 0;

    // ACI 209R-92 Constants
    const constants = {
      I: { a: 4.0, b: 0.85 }, // Normal
      II: { a: 4.0, b: 0.85 }, // Moderate (simplified)
      III: { a: 2.3, b: 0.92 }, // High Early Strength
    };

    const { a, b } = constants[cementType];

    // Formula: f'(t) = f'(28) * (t / (a + b*t))
    // Therefore: f'(28) = f'(t) / (t / (a + b*t))
    const ratio = age / (a + b * age);
    const predicted = mpa / ratio;

    return Number(predicted.toFixed(2));
  }

  /**
   * Calculates the current "Maturity" percentage of concrete.
   */
  static getMaturityPercentage(
    age: number,
    cementType: "I" | "II" | "III" = "I",
  ): number {
    const constants = {
      I: { a: 4.0, b: 0.85 },
      II: { a: 4.0, b: 0.85 },
      III: { a: 2.3, b: 0.92 },
    };
    const { a, b } = constants[cementType];
    const ratio = age / (a + b * age);
    return Number((ratio * 100).toFixed(1));
  }

  /**
   * Estimates Margin and Profitability for a batch.
   * Based on real material costs vs selling price.
   */
  static calculateBatchHealth(sellingPrice: number, costPrice: number) {
    const margin = sellingPrice - costPrice;
    const percentage = (margin / sellingPrice) * 100;

    return {
      margin,
      percentage: Number(percentage.toFixed(2)),
      status:
        percentage > 25 ? "HEALTHY" : percentage > 15 ? "WARNING" : "CRITICAL",
    };
  }
}
