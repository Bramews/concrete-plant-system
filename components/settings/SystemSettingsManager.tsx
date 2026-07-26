"use server";

import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";

export default async function SystemSettingsManager() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = dictionary[lang];

  const settings = getSettings();
  const backups = await (prisma as any).backupRecord
    .findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
    })
    .catch(() => []);

  return (
    <SettingsClient
      dict={dict}
      initialSettings={settings}
      initialBackups={JSON.parse(JSON.stringify(backups))}
    />
  );
}
