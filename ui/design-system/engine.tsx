"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { themes } from "./themes";
import { styles } from "./styles";

type SystemDesignContextType = {
  style: keyof typeof styles;
  theme: keyof typeof themes;
  setStyle: (style: keyof typeof styles) => void;
  setTheme: (theme: keyof typeof themes) => void;
};

const SystemDesignContext = createContext<SystemDesignContextType | undefined>(
  undefined,
);

export function SystemDesignProvider({
  children,
  initialStyle = "dark-industrial-utility",
  initialTheme = "industrial-blue",
}: {
  children: React.ReactNode;
  initialStyle?: string;
  initialTheme?: string;
}) {
  const [currentStyle, setCurrentStyle] = React.useState<keyof typeof styles>(
    (initialStyle as keyof typeof styles) || "dark-industrial-utility",
  );
  const [currentTheme, setCurrentTheme] = React.useState<keyof typeof themes>(
    (initialTheme as keyof typeof themes) || "industrial-blue",
  );

  const cssVariables = useMemo(() => {
    const styleDef = styles[currentStyle] || styles["dark-industrial-utility"];
    const themeDef = themes[currentTheme] || themes["industrial-blue"];

    const vars: Record<string, string> = {
      // Philosophy / Style
      "--radius-xs": styleDef.radius.xs,
      "--radius-sm": styleDef.radius.sm,
      "--radius-md": styleDef.radius.md,
      "--radius-lg": styleDef.radius.lg,
      "--radius-xl": styleDef.radius.xl,

      "--motion-duration-fast": styleDef.motion.fast,
      "--motion-duration-normal": styleDef.motion.normal,
      "--motion-duration-slow": styleDef.motion.slow,

      "--elevation-sm": styleDef.elevation.sm,
      "--elevation-md": styleDef.elevation.md,
      "--elevation-lg": styleDef.elevation.lg,
      "--elevation-xl": styleDef.elevation.xl,

      "--spacing-container": styleDef.spacing.container,
      "--spacing-gutter": styleDef.spacing.gutter,
      "--spacing-section": styleDef.spacing.section,

      // Colors / Theme
      "--color-bg-default": themeDef.background.default,
      "--color-bg-paper": themeDef.background.paper,
      "--color-bg-subtle": themeDef.background.subtle,

      "--color-text-primary": themeDef.text.primary,
      "--color-text-secondary": themeDef.text.secondary,

      "--color-border-main": themeDef.border.main,
      "--color-border-subtle": themeDef.border.subtle,
    };

    // Primary Palette
    themeDef.primary.forEach((hex, index) => {
      vars[
        `--color-primary-${index === 10 ? 950 : index === 0 ? 50 : index * 100}`
      ] = hex;
    });

    // Semantic Colors (Simplification for now, can be expanded)
    vars["--color-success-main"] = themeDef.success[1];
    vars["--color-success-light"] = themeDef.success[0];
    vars["--color-success-dark"] = themeDef.success[2];

    vars["--color-error-main"] = themeDef.error[1];
    vars["--color-error-light"] = themeDef.error[0];
    vars["--color-error-dark"] = themeDef.error[2];

    vars["--color-warning-main"] = themeDef.warning[1];
    vars["--color-warning-light"] = themeDef.warning[0];
    vars["--color-warning-dark"] = themeDef.warning[2];

    vars["--color-info-main"] = themeDef.info[1];
    vars["--color-info-light"] = themeDef.info[0];
    vars["--color-info-dark"] = themeDef.info[2];

    return vars;
  }, [currentStyle, currentTheme]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update theme-color meta for browser UI
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        cssVariables["--color-bg-default"],
      );
    }
  }, [cssVariables]);

  return (
    <SystemDesignContext.Provider
      value={{
        style: currentStyle,
        theme: currentTheme,
        setStyle: setCurrentStyle,
        setTheme: setCurrentTheme,
      }}
    >
      {children}
    </SystemDesignContext.Provider>
  );
}

export function useSystemDesign() {
  const context = useContext(SystemDesignContext);
  if (context === undefined) {
    throw new Error(
      "useSystemDesign must be used within a SystemDesignProvider",
    );
  }
  return context;
}
