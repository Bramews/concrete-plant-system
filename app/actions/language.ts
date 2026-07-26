"use server";

import { cookies } from "next/headers";

export async function toggleLanguage() {
  const cookieStore = await cookies();
  const currentLang = cookieStore.get("language")?.value || "ar";
  const newLang = currentLang === "ar" ? "en" : "ar";

  cookieStore.set("language", newLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // Set NEXT_LOCALE as well for compatibility
  cookieStore.set("NEXT_LOCALE", newLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function setLanguage(lang: string) {
  const cookieStore = await cookies();
  // Validate language input
  const validLang = ["en", "ar"].includes(lang) ? lang : "ar";

  cookieStore.set("language", validLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // Set NEXT_LOCALE as well for compatibility
  cookieStore.set("NEXT_LOCALE", validLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
