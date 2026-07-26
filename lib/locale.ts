import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getUserPreferences } from "@/app/actions/preferences";
import { Locale } from "@/lib/dictionary";

export async function getCurrentLanguage(): Promise<Locale> {
  // 1. Try to get from authenticated user preferences (DB)
  try {
    const session = await getSession().catch(() => null);
    if (session && session.userId) {
      const prefs = await getUserPreferences();
      if (prefs?.language) {
        return prefs.language as Locale;
      }
    }
  } catch (error) {
    // Ignore DB errors, fall through
  }

  // 2. Try to get from cookies (NEXT_LOCALE is standard for Next.js i18n)
  const cookieStore = await cookies();
  const nextLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (nextLocale === "ar" || nextLocale === "en") {
    return nextLocale as Locale;
  }

  // 3. Fallback to Arabic (Default for this user/region)
  return "ar";
}
