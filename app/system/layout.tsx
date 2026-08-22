import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getDictionary } from "@/lib/dictionary";
import { headers } from "next/headers";
import { getSystemSettings } from "@/app/actions/settings";
import { getDashboardConfig } from "@/lib/dashboard/engine";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { NetworkBroadcastListener } from "@/components/network/NetworkBroadcastListener";

export const dynamic = "force-dynamic";

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isTvPage =
    pathname === "/system/tv" || pathname.startsWith("/system/tv/");

  if (isTvPage) {
    return <>{children}</>;
  }

  const user = await getCurrentUser();

  // Prefer DB setting -> Cookie -> Default 'ar'
  // logic: RootLayout uses DB setting. We must match it.
  const { getCurrentLanguage } = await import("@/lib/locale");
  const lang = await getCurrentLanguage();

  const dict = getDictionary(lang);

  if (!user) {
    redirect("/api/auth/session-cleanup");
  }

  // --- Strict Tenant Isolation Check ---
  const { getTenantContext } = await import("@/lib/tenancy");

  // We determine if we are in a tenant context
  const tenantContext = await getTenantContext(
    user.id,
    user.role === "SYSTEM_OWNER" ? undefined : user.companyId || undefined,
  );

  let isLocked = false;

  if (tenantContext.company) {
    // If we found a company (even if suspended/mismatched/valid)

    // 1. Handle Mismatch
    if (tenantContext.error === "TENANT_MISMATCH") {
      redirect("/access-denied?reason=Tenant+mismatch");
    }

    // 2. Handle Suspended
    if (tenantContext.error === "SUSPENDED") {
      redirect("/access-denied?reason=Account+Suspended");
    }

    // 3. Handle Not Found / Reserved (Should technically not happen if we are in this block, but safety)
    if (
      tenantContext.error === "NOT_FOUND" ||
      tenantContext.error === "RESERVED"
    ) {
      // If we are on a reserved subdomain or unknown one, but trying to access system...
      // If it's localhost (no subdomain) getTenantContext returns NOT_FOUND (no subdomain), so we rely on checks.
      // The original logic skipped checks if localhost root.
      // getTenantContext returns error="NOT_FOUND" if no subdomain.
    }

    isLocked = !!tenantContext.isLocked;
  } else {
    // No company found context.
    // If we are on a subdomain that is NOT reserved, and NOT in DB -> 404
    if (tenantContext.error === "NOT_FOUND") {
      // Check if we actually HAVE a subdomain string to determine if it's a 404 vs Localhost Root
      const headerList = await headers();
      const host = headerList.get("host") || "";
      const parts = host.split(".");
      const hasSub =
        (parts.length >= 2 && parts[parts.length - 1].includes("localhost")) ||
        parts.length >= 3;

      if (hasSub && host !== "localhost:3000") {
        // Crude check, but matches logic
        redirect("/access-denied?reason=Company+not+found");
      }
    }
  }
  // -------------------------------------------------------------

  // Fetch dynamic system settings
  const settings = await getSystemSettings();

  // We need to pass the current path to support System Owner super-admin view
  // But we are in a Layout, so we don't have direct access to pathname via props.
  // HOWEVER, SystemLayout handles /system/... routes.
  // We can pass a hint that we are in the system area, or try to extract from headers if needed.
  // For now, let's pass a generic "/system" base, but getDashboardConfig needs specific path for sub-modules.
  // Actually, for Server Components, we can use `headers()` to get the URL, but it's full URL.

  // x-url header is often set by middleware, or we can use referer as fallback or just pass a flag
  // Let's assume for now we act as if we are in the system. The specific path detection
  // in engine.ts relies on `pathname.includes`.
  // Let's try to get the path from the header if available, or just pass a known system path
  // so the engine knows to look for system modules.
  // A cleaner way in Next.js 13+ layouts is tough without middleware passing the path.
  // BUT, we know this layout is ONLY for /system routes.
  // So we can pass "/system/lab" if the user is visiting lab? No we don't know that here yet.

  // WORKAROUND: We will rely on Client Component Sidebar to highlight active items,
  // BUT `engine.ts` runs on server to generate the config.
  // We need the middleware to pass the pathname in headers.
  // Let's check if we can get it from headers.
  const headerUrl =
    headersList.get("x-url") || headersList.get("referer") || "";
  const path = headerUrl ? new URL(headerUrl).pathname : "/system";

  const config = getDashboardConfig(user.role, lang, undefined, path);
  const voiceEnabled = settings["voice_assistant_enabled"] === "true";
  const isOperatorPage = pathname.startsWith("/system/operator");

  if (isOperatorPage) {
    return (
      <>
        <NetworkBroadcastListener
          companyId={user.companyId || 1}
          currentUserId={user.id}
          userRole={user.role}
        />
        {voiceEnabled && <VoiceAssistant />}
        {children}
      </>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-background font-sans antialiased flex overflow-hidden">
      <NetworkBroadcastListener
        companyId={user.companyId || 1}
        currentUserId={user.id}
        userRole={user.role}
      />
      {voiceEnabled && <VoiceAssistant />}
      <Sidebar
        config={config}
        dict={dict.sidebar}
        companyName={user.company?.name}
        settings={settings}
        lang={lang}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 w-full h-full transition-all duration-300 ease-in-out lg:ps-64`}
      >
        {isLocked && (
          <div
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2"
            dir="rtl"
          >
            <span className="text-amber-500 text-sm font-semibold">
              ⚠️ وضع القراءة فقط: هذا الحساب مقفل حالياً. الإجراءات معطلة.
            </span>
          </div>
        )}
        <Header
          user={{
            name: user.name,
            role: user.role,
            email: user.email,
            companyName: user.company?.name,
          }}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
