export type ThemeColors = {
  primary: string[];
  success: string[];
  error: string[];
  warning: string[];
  info: string[];
  background: {
    default: string;
    paper: string;
    subtle: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  border: {
    main: string;
    subtle: string;
  };
};

export const neonBlue: ThemeColors = {
  primary: [
    "#E0F2FE",
    "#BAE6FD",
    "#7DD3FC",
    "#38BDF8",
    "#0EA5E9",
    "#0284C7",
    "#0369A1",
    "#075985",
    "#0C4A6E",
    "#082F49",
    "#020617",
  ],
  success: ["#DCFCE7", "#22C55E", "#15803D"],
  error: ["#FEE2E2", "#EF4444", "#B91C1C"],
  warning: ["#FEF3C7", "#F59E0B", "#B45309"],
  info: ["#E0F2FE", "#0EA5E9", "#0369A1"],
  background: {
    default: "#020617",
    paper: "#0F172A",
    subtle: "#1E293B",
  },
  text: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
  },
  border: {
    main: "#1E293B",
    subtle: "#0F172A",
  },
};

export const neonPurple: ThemeColors = {
  primary: [
    "#F5F3FF",
    "#EDE9FE",
    "#DDD6FE",
    "#C4B5FD",
    "#A78BFA",
    "#8B5CF6",
    "#7C3AED",
    "#6D28D9",
    "#5B21B6",
    "#4C1D95",
    "#2E1065",
  ],
  success: ["#DCFCE7", "#22C55E", "#15803D"],
  error: ["#FEE2E2", "#EF4444", "#B91C1C"],
  warning: ["#FEF3C7", "#F59E0B", "#B45309"],
  info: ["#F5F3FF", "#8B5CF6", "#6D28D9"],
  background: {
    default: "#0F0720",
    paper: "#1A1033",
    subtle: "#2D1B4D",
  },
  text: {
    primary: "#F5F3FF",
    secondary: "#A78BFA",
  },
  border: {
    main: "#2D1B4D",
    subtle: "#1A1033",
  },
};

export const industrialBlue: ThemeColors = {
  primary: [
    "#F0F9FF",
    "#E0F2FE",
    "#BAE6FD",
    "#7DD3FC",
    "#38BDF8",
    "#0EA5E9",
    "#0284C7",
    "#0369A1",
    "#075985",
    "#0C4A6E",
    "#082F49",
  ],
  success: ["#F0FDF4", "#22C55E", "#166534"],
  error: ["#FEF2F2", "#EF4444", "#991B1B"],
  warning: ["#FFFBEB", "#F59E0B", "#92400E"],
  info: ["#F0F9FF", "#0EA5E9", "#075985"],
  background: {
    default: "#0B1120",
    paper: "#111827",
    subtle: "#1F2937",
  },
  text: {
    primary: "#F9FAFB",
    secondary: "#9CA3AF",
  },
  border: {
    main: "#374151",
    subtle: "#1F2937",
  },
};

export const industrialBlueLight: ThemeColors = {
  primary: [
    "#082F49",
    "#0C4A6E",
    "#075985",
    "#0369A1",
    "#0284C7",
    "#0EA5E9",
    "#38BDF8",
    "#7DD3FC",
    "#BAE6FD",
    "#E0F2FE",
    "#F0F9FF",
  ].reverse(), // Invert scale for light mode
  success: ["#F0FDF4", "#22C55E", "#166534"],
  error: ["#FEF2F2", "#EF4444", "#991B1B"],
  warning: ["#FFFBEB", "#F59E0B", "#92400E"],
  info: ["#F0F9FF", "#0EA5E9", "#075985"],
  background: {
    default: "#F9FAFB",
    paper: "#FFFFFF",
    subtle: "#F3F4F6",
  },
  text: {
    primary: "#111827",
    secondary: "#4B5563",
  },
  border: {
    main: "#E5E7EB",
    subtle: "#F3F4F6",
  },
};

export const themes = {
  "neon-blue": neonBlue,
  "neon-purple": neonPurple,
  "industrial-blue": industrialBlue,
  "industrial-blue-light": industrialBlueLight,
};
