"use server";

import { cookies } from "next/headers";

export async function setTheme(themeId: string) {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_THEME", themeId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}
