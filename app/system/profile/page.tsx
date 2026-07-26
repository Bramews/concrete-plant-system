import { getCurrentUser } from "@/lib/auth";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Profile | Neon Lab",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/?error=expired");

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-white tracking-tight">
          {dict.profile.title}
        </h1>
        <p className="text-slate-400 text-sm">{dict.profile.subtitle}</p>
      </div>

      <ProfileForm user={user} dict={dict} />
    </div>
  );
}
