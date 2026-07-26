"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const DEFAULT_PREFERENCES = {
  theme: "industrial",
  mode: "light",
  language: "ar",
  sidebar: "open",
};

export async function updateUserPreferences(data: {
  theme?: string;
  mode?: string;
  language?: string;
  sidebar?: string;
}) {
  try {
    const session = await getSession();
    if (!session || !session.userId) throw new Error("Unauthorized");

    // Use Prisma ORM for safe, portable operations
    await prisma.userPreference.upsert({
      where: { userId: session.userId },
      update: {
        theme: data.theme,
        mode: data.mode,
        language: data.language,
        sidebar: data.sidebar,
      },
      create: {
        userId: session.userId,
        theme: data.theme || "industrial",
        mode: data.mode || "light",
        language: data.language || "ar",
        sidebar: data.sidebar || "open",
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getUserPreferences() {
  try {
    const session = await getSession().catch(() => null);
    if (!session || !session.userId) return DEFAULT_PREFERENCES;

    try {
      // STANDARD PRISMA QUERY - Much safer than raw SQL
      const pref = await prisma.userPreference.findUnique({
        where: { userId: session.userId },
      });

      if (pref) {
        return {
          theme: pref.theme,
          mode: pref.mode,
          language: pref.language,
          sidebar: pref.sidebar,
        };
      }
    } catch (dbError) {
      console.warn("UserPreferences Prisma query failed:", dbError);
    }

    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Critical failure in getUserPreferences:", error);
    return DEFAULT_PREFERENCES;
  }
}
