// ==========================================
// FACADE FILE - DO NOT IMPORT next/headers
// ==========================================
// This file re-exports from Split-Brain Architecture
// to maintain compatibility with existing imports

import { dictionary as dictionaryBase, Locale } from "./dictionary.base";

// Re-export the pure dictionary and types from base
export {
  dictionary,
  type Dictionary,
  type Locale,
  type DictionaryType,
} from "./dictionary.base";

// Re-export client dictionary function (safe for client components)
export { getClientDictionary } from "./dictionary.client";
export { useDictionary } from "./dictionary-hooks";

// Simple getDictionary function that works in client components
// For server components, use getServerDictionary directly
export function getDictionary(locale: Locale) {
  return dictionaryBase[locale] ?? dictionaryBase.en;
}
