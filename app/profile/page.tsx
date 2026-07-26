import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import { getCurrentRole } from "@/lib/auth";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const role = await getCurrentRole();
  const t = dictionary[lang];

  return (
    <div>
      <h1 className="page-title">{t.account?.profile || "الملف الشخصي"}</h1>

      <div className="glass-panel p-8 max-w-[600px]">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-[2rem] font-extrabold text-white">
            {role?.[0] || "U"}
          </div>
          <div>
            <h2 className="m-0 text-xl font-bold">System User</h2>
            <p className="text-primary m-0 uppercase tracking-widest text-[0.9rem] font-bold">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(role &&
                ((t.roles || (t as any).common?.roles) as any)?.[role]) ||
                role ||
                "USER"}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="form-group">
            <label className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1 block">
              {"البريد الإلكتروني"}
            </label>
            <div className="form-input bg-white/[0.02] border border-white/[0.05]">
              admin@concreteos.system
            </div>
          </div>

          <div className="form-group">
            <label className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1 block">
              {"تفضيلات اللغة"}
            </label>
            <div className="form-input bg-white/[0.02] border border-white/[0.05]">
              {"العربية"}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <button className="btn btn-secondary" disabled>
            {"تعديل الملف الشخصي"}
          </button>
        </div>
      </div>
    </div>
  );
}
