"use client";

import { usePreferences } from "@/context/PreferenceContext";

/**
 * Hook to access the current dictionary in client components.
 * This is a convenience wrapper around PreferenceContext's 't' property.
 */
export function useDictionary() {
  const { t } = usePreferences();
  return t;
}
