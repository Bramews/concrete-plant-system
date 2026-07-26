import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientUserSettingRow from "./ClientUserSettingRow";

// Helper to determine lock status
async function getUserSettingMeta(
  userId: number,
  companyId: number | null,
  key: string,
) {
  // 1. System Lock
  const sys = await prisma.systemSetting.findUnique({ where: { key } });
  if (sys?.locked) return { value: sys.value, locked: true, source: "SYSTEM" };

  // 2. Company Lock
  if (companyId) {
    const comp = await prisma.companySetting.findUnique({
      where: { companyId_key: { companyId, key } },
    });
    if (comp?.locked)
      return { value: comp.value, locked: true, source: "COMPANY" };
  }

  // 3. User Value
  const userSetting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key } },
  });

  return {
    value: userSetting?.value || "",
    locked: false,
    source: "USER",
  };
}

export default async function UserProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const meta = {
    THEME: await getUserSettingMeta(user.id, user.companyId ?? null, "THEME"),
    LANGUAGE: await getUserSettingMeta(
      user.id,
      user.companyId ?? null,
      "LANGUAGE",
    ),
    NOTIFY_EMAIL: await getUserSettingMeta(
      user.id,
      user.companyId ?? null,
      "NOTIFY_EMAIL",
    ),
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">👤 User Profile</h1>
      <p className="text-gray-500 mb-8">Personalize your experience.</p>

      <div className="bg-white rounded-lg shadow border p-6 space-y-6">
        <h3 className="font-bold text-lg border-b pb-2">Appearance</h3>
        <ClientUserSettingRow
          label="Theme"
          settingKey="THEME"
          meta={meta.THEME}
        />
        <ClientUserSettingRow
          label="Language"
          settingKey="LANGUAGE"
          meta={meta.LANGUAGE}
        />

        <h3 className="font-bold text-lg border-b pb-2 pt-4">Notifications</h3>
        <ClientUserSettingRow
          label="Email Notifications (true/false)"
          settingKey="NOTIFY_EMAIL"
          meta={meta.NOTIFY_EMAIL}
        />
      </div>
    </div>
  );
}
