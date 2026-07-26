import { cookies } from "next/headers";
import { dictionary, Locale } from "./dictionary.base";

export async function getServerDictionary() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  return dictionary[locale];
}
