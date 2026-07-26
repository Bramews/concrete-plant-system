import { getUserPreferences } from "@/app/actions/preferences";
import { getCurrentUser } from "@/lib/auth";
import { ProfileSettingsClient } from "./ProfileSettingsClient";
import { redirect } from "next/navigation";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/session-cleanup");
  }
  const prefs = await getUserPreferences();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">User Profile</h2>
        <p className="text-muted-foreground text-sm">
          Personalize your experience.
        </p>
      </div>
      <ProfileSettingsClient user={user} initialPrefs={prefs} />
    </div>
  );
}
