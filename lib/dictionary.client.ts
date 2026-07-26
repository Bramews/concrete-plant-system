import { dictionary, Locale } from "./dictionary.base";

export function getClientDictionary(locale: Locale) {
  return dictionary[locale] ?? dictionary.en;
}
