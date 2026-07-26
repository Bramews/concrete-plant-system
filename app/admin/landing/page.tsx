import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { getLandingPageConfig } from "@/app/actions/landing-page";
import { LandingPageForm } from "./landing-form";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const config = await getLandingPageConfig();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-100">
        {dict.sidebar.landing_page_control}
      </h1>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <LandingPageForm startConfig={config} dict={dict.settings.landing} />
      </div>
    </div>
  );
}
