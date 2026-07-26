export type StylePhilosophy = {
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  motion: {
    fast: string;
    normal: string;
    slow: string;
  };
  elevation: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    container: string;
    gutter: string;
    section: string;
  };
};

export const darkFuturisticNeon: StylePhilosophy = {
  radius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "20px",
  },
  motion: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  elevation: {
    sm: "0 0 10px rgba(0, 0, 0, 0.5), 0 0 5px var(--color-primary-500)",
    md: "0 0 20px rgba(0, 0, 0, 0.6), 0 0 10px var(--color-primary-500)",
    lg: "0 0 30px rgba(0, 0, 0, 0.7), 0 0 15px var(--color-primary-500)",
    xl: "0 0 50px rgba(0, 0, 0, 0.8), 0 0 25px var(--color-primary-500)",
  },
  spacing: {
    container: "1400px",
    gutter: "32px",
    section: "80px",
  },
};

export const darkIndustrialUtility: StylePhilosophy = {
  radius: {
    xs: "0px",
    sm: "2px",
    md: "4px",
    lg: "6px",
    xl: "8px",
  },
  motion: {
    fast: "100ms",
    normal: "200ms",
    slow: "400ms",
  },
  elevation: {
    sm: "2px 2px 0px rgba(0, 0, 0, 1)",
    md: "4px 4px 0px rgba(0, 0, 0, 1)",
    lg: "6px 6px 0px rgba(0, 0, 0, 1)",
    xl: "8px 8px 0px rgba(0, 0, 0, 1)",
  },
  spacing: {
    container: "1200px",
    gutter: "24px",
    section: "64px",
  },
};

export const cleanEnterprise: StylePhilosophy = {
  radius: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  motion: {
    fast: "200ms",
    normal: "400ms",
    slow: "600ms",
  },
  elevation: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
  },
  spacing: {
    container: "1100px",
    gutter: "20px",
    section: "48px",
  },
};

export const styles = {
  "dark-futuristic-neon": darkFuturisticNeon,
  "dark-industrial-utility": darkIndustrialUtility,
  "clean-enterprise": cleanEnterprise,
};
