"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { dictionary, Locale, DictionaryType } from "@/lib/dictionary";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useSystemDesign } from "@/ui/design-system/engine";
import { NetworkEngine } from "@/lib/network/NetworkEngine";

type Theme = "neon" | "monolith" | "executive" | "industrial";

interface UserPreferences {
  theme: Theme;
  mode: "light" | "dark";
  language: Locale;
  sidebar: "open" | "closed";
}

interface PreferenceContextType {
  preferences: UserPreferences;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  updatePreference: (
    key: keyof UserPreferences,
    value: string,
  ) => Promise<void>;
  t: DictionaryType;
  dir: "rtl" | "ltr";
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(
  undefined,
);

export function PreferenceProvider({
  children,
  initialPreferences,
}: {
  children: React.ReactNode;
  initialPreferences: UserPreferences;
}) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(initialPreferences);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { setStyle, setTheme } = useSystemDesign();
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Detect visitor's language by geolocation on first visit (when no cookie is set)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cookiesArr = document.cookie.split(";");
      const hasLocaleCookie = cookiesArr.some((item) =>
        item.trim().startsWith("NEXT_LOCALE="),
      );
      const hasLanguageCookie = cookiesArr.some((item) =>
        item.trim().startsWith("language="),
      );

      if (!hasLocaleCookie && !hasLanguageCookie) {
        const detectGeoLocation = async () => {
          try {
            const res = await NetworkEngine.fetch("https://ipapi.co/json/", {
              timeout: 5000,
              maxRetries: 2,
            });
            const data = await res.json();
            const country = data.country_code; // e.g. "IQ", "FR", "US"

            // Arab countries codes list
            const arabCountries = [
              "IQ",
              "EG",
              "SA",
              "JO",
              "AE",
              "QA",
              "OM",
              "BH",
              "KW",
              "YE",
              "SY",
              "LB",
              "PS",
              "DZ",
              "MA",
              "TN",
              "LY",
              "SD",
              "SO",
              "DJ",
              "MR",
            ];

            let detectedLang: "en" | "ar" = "en";
            if (country && arabCountries.includes(country.toUpperCase())) {
              detectedLang = "ar";
            }

            // Apply language preference and cookie
            const { setLanguage } = await import("@/app/actions/language");
            await setLanguage(detectedLang);

            if (detectedLang !== preferences.language) {
              // Hard reload to apply the language change for server components
              window.location.reload();
            }
          } catch (err) {
            // Silently ignore to prevent Next.js Error Overlay on mobile ad-blockers
          }
        };
        detectGeoLocation();
      }
    }
  }, [preferences.language]);

  useEffect(() => {
    console.log("PreferenceContext useEffect running", preferences);

    // Apply theme and mode to document
    document.documentElement.setAttribute("data-theme", preferences.theme);

    if (preferences.mode === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("industrial-blue");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("industrial-blue-light" as any);
    }

    document.documentElement.dir =
      preferences.language === "ar" ? "rtl" : "ltr";

    // CRITICAL: Force Latin numerals by using ar-u-nu-latn locale extension
    // This prevents the browser from converting numbers to Arabic-Indic numerals
    document.documentElement.lang =
      preferences.language === "ar" ? "ar-u-nu-latn" : preferences.language;
  }, [preferences, setTheme]);

  const updatePreference = async (
    key: keyof UserPreferences,
    value: string,
  ) => {
    console.log("updatePreference called", key, value);

    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      if (key === "language") {
        // Special handling for language to sync cookies and DB
        const { toggleLanguage } = await import("@/app/actions/language");
        await toggleLanguage();
        // Hard reload to sync all server components and dictionary
        window.location.reload();
        return;
      }

      await updateUserPreferences({ [key]: value });
    } catch (e) {
      console.error("Failed to save preferences", e);
    }
  };

  const t = dictionary[preferences.language];
  const dir = preferences.language === "ar" ? "rtl" : "ltr";

  return (
    <PreferenceContext.Provider
      value={{
        preferences,
        isMobileSidebarOpen,
        setMobileSidebarOpen,
        updatePreference,
        t,
        dir,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
}

export const usePreferences = () => {
  const context = useContext(PreferenceContext);
  if (!context)
    throw new Error("usePreferences must be used within PreferenceProvider");
  return context;
};
