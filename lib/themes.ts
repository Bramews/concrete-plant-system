export type LayoutType =
  | "LAYOUT_SIDEBAR"
  | "LAYOUT_TOPNAV"
  | "LAYOUT_FLOATING"
  | "LAYOUT_MINIMAL";

export interface ThemeConfig {
  id: string;
  name: string;
  layout: LayoutType;
  density: "high" | "medium" | "low" | "extreme";
}

export const THEMES: ThemeConfig[] = [
  { id: "01", name: "Monolith", layout: "LAYOUT_SIDEBAR", density: "high" },
  { id: "02", name: "Forge", layout: "LAYOUT_FLOATING", density: "medium" },
  { id: "03", name: "Blueprint", layout: "LAYOUT_TOPNAV", density: "medium" },
  { id: "04", name: "Steel Mill", layout: "LAYOUT_SIDEBAR", density: "high" },
  { id: "05", name: "Refinery", layout: "LAYOUT_SIDEBAR", density: "medium" },
  { id: "06", name: "Lab", layout: "LAYOUT_TOPNAV", density: "extreme" },
  { id: "07", name: "Quarry", layout: "LAYOUT_FLOATING", density: "low" },
  { id: "08", name: "Terminal", layout: "LAYOUT_MINIMAL", density: "extreme" },
  { id: "09", name: "Assembly", layout: "LAYOUT_SIDEBAR", density: "high" },
  { id: "10", name: "Hydraulic", layout: "LAYOUT_SIDEBAR", density: "high" },
  { id: "11", name: "Aero", layout: "LAYOUT_TOPNAV", density: "medium" },
  { id: "12", name: "Foundry", layout: "LAYOUT_SIDEBAR", density: "medium" },
  { id: "13", name: "Depot", layout: "LAYOUT_SIDEBAR", density: "high" },
  { id: "14", name: "Carbon", layout: "LAYOUT_FLOATING", density: "high" },
  { id: "15", name: "Core", layout: "LAYOUT_MINIMAL", density: "medium" },
];

export function getThemeConfig(id: string): ThemeConfig {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
