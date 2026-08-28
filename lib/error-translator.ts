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
    const apiErrors = dict?.api_errors as Record<string, string> | undefined;
    if (apiErrors && apiErrors[key]) {
      return apiErrors[key];
    }
  } catch {
    // If dictionary fails (e.g. no cookies), ignore and return the fallback
  }

  // Return the fallback if provided, otherwise return the raw key
  return fallback || key;
}
