// Stub for AI Service to prevent build errors after purge
// This file can be expanded if AI features are reintroduced

export interface PlantEfficiencyScore {
  score: number;
  trend: "up" | "down" | "stable";
}

export async function getPlantEfficiencyScore(): Promise<PlantEfficiencyScore> {
  return { score: 85, trend: "stable" };
}

export async function getAIOptimizationTips(): Promise<string[]> {
  return [
    "System running optimally.",
    "No AI recommendations available.", // Placeholder
  ];
}
