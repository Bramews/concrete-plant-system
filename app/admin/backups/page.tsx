import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBackups } from "@/app/actions/backup";
import { BackupManager } from "../_components/BackupManager";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export default async function BackupsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") redirect("/");

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  const backups = await getBackups();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {dict.admin.backup.title}
          </h1>
          <p className="text-slate-400">{dict.admin.backup.desc}</p>
        </div>
      </div>

      <BackupManager backups={backups} dict={dict} />
    </div>
  );
}
