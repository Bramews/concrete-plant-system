import { getServerDictionary } from "./dictionary.server";

/**
 * Translates an API error key into the current user's language using the server dictionary.
 * Safe to use in Server Actions. If the key is not found, it returns the fallback or the key itself.
 */
export async function translateError(
  key: string,
  fallback?: string,
): Promise<string> {
  try {
    const dict = await getServerDictionary();
    if (dict?.api_errors && dict.api_errors[key]) {
      return dict.api_errors[key];
    }
  } catch {
    // If dictionary fails (e.g. no cookies), ignore and return the fallback
  }

  // Return the fallback if provided, otherwise return the raw key
  return fallback || key;
}
