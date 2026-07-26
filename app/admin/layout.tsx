import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import "@/app/globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { NetworkBroadcastListener } from "@/components/network/NetworkBroadcastListener";

import { getSystemSettings } from "@/app/actions/settings";
import { getDashboardConfig } from "@/lib/dashboard/engine";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/session-cleanup");
  }

  // Strict Role Guard for Admin Route
  if (user.role !== "SYSTEM_OWNER") {
    redirect("/access-denied");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  // Fetch dynamic system settings
  const settings = await getSystemSettings();

  // Pass current path (we are in a layout, so we need a way to know context,
  // but Server Components in Layout don't know exact segment easily without headers)
  // HOWEVER, for AdminLayout, we know base is /admin.
  // Wait, the user wants this to work when visiting /system/...
  // AdminLayout is ONLY for /admin.
  // The user will be hitting SystemLayout for /system routes.
  // We need to update SystemLayout as well.

  const config = getDashboardConfig(user.role, lang, undefined, "/admin");
  const isRtl = lang === "ar";

  return (
    <div
      className="fixed inset-0 w-full h-full flex overflow-hidden bg-background font-sans antialiased"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <NetworkBroadcastListener
        companyId={user.companyId || 1}
        currentUserId={user.id}
        userRole={user.role}
      />
      <Sidebar
        config={config}
        dict={dict.sidebar}
        settings={settings}
        lang={lang}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 w-full h-full transition-all duration-300 ease-in-out lg:ps-64`}
      >
        <Header
          user={{
            name: user.name,
            role: user.role,
            email: user.email,
            companyName: user.company?.name,
          }}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          <div className="flex-1 p-4 sm:p-6 pb-20">{children}</div>
        </main>
      </div>
    </div>
  );
}
