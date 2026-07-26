import type { Metadata } from "next";

import { getUserPreferences } from "@/app/actions/preferences";
import { PreferenceProvider } from "@/context/PreferenceContext";
import { getSession } from "@/lib/auth";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { getCurrentLanguage } from "@/lib/locale";
import "./globals.css";

// Fonts are imported via @import in globals.css to prevent offline compilation errors
const inter = { variable: "" };
const cairo = { variable: "" };

import { getGlobalAppearance } from "@/app/actions/settings";
import { SystemDesignProvider } from "@/ui/design-system/engine";
import { Toaster } from "@/components/ui/sonner";
import { OfflineLockoutOverlay } from "@/components/system/OfflineLockoutOverlay";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Concrete Plant System",
    description: "Concrete Plant System",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Safe session fetch with fallback
  let session = null;
  try {
    session = await getSession();
  } catch (e) {
    console.error("[RootLayout] Failed to get session:", e);
  }

  // Safe preferences fetch with fallback
  let dbPreferences = null;
  try {
    dbPreferences = await getUserPreferences();
  } catch (e) {
    console.error("[RootLayout] Failed to get user preferences:", e);
  }

  // Safe global appearance fetch with fallback
  let globalAppearance = {
    style: "dark-industrial-utility",
    theme: "industrial-blue",
  };
  try {
    globalAppearance = await getGlobalAppearance();
  } catch (e) {
    console.error("[RootLayout] Failed to get global appearance:", e);
  }

  const preferences = {
    theme:
      (dbPreferences?.theme as
        | "neon"
        | "monolith"
        | "executive"
        | "industrial") || "industrial",
    mode: (dbPreferences?.mode as "light" | "dark") || "dark",
    language: await getCurrentLanguage(),
    sidebar: (dbPreferences?.sidebar as "open" | "closed") || "open",
  };

  // Allow dynamic language/direction based on preferences
  const lang = preferences.language;
  const dir = preferences.language === "ar" ? "rtl" : "ltr";
  // ar-u-nu-latn = Arabic language but FORCE Latin numerals (Unicode Locale Extension)
  // This is the only reliable way to prevent the browser from converting to Hindi numerals
  const htmlLang = preferences.language === "ar" ? "ar-u-nu-latn" : lang;

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={`bg-background ${preferences.mode === "dark" ? "dark" : ""} ${inter.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="/leaflet/leaflet.css" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#070b14" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Clean up the URL parameter immediately on successful load
                if (typeof window !== 'undefined' && window.location.search.indexOf('chunk-retry=true') !== -1) {
                  try {
                    var cleanSearch = window.location.search.replace(/[?&]chunk-retry=true/, '').replace(/^&/, '?');
                    var newUrl = window.location.pathname + cleanSearch + window.location.hash;
                    window.history.replaceState({}, '', newUrl);
                  } catch (e) {}
                }

                function reloadOnChunkError(isChunkError) {
                  if (isChunkError && typeof window !== 'undefined') {
                    try {
                      var isRetry = window.location.search.indexOf('chunk-retry=true') !== -1;
                      if (!isRetry) {
                        var separator = window.location.search ? '&' : '?';
                        window.location.href = window.location.pathname + window.location.search + separator + 'chunk-retry=true' + window.location.hash;
                      }
                    } catch (e) {
                      window.location.reload();
                    }
                  }
                }
                
                window.addEventListener('error', function(event) {
                  var target = event.target;
                  var isResourceError = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK');
                  var url = target ? (target.src || target.href || "") : "";
                  
                  var isChunkError = false;
                  
                  if (isResourceError && url.indexOf('/_next/') !== -1) {
                    isChunkError = true;
                  } else {
                    var message = event.message || (event.error && event.error.message) || "";
                    isChunkError = 
                      message.indexOf("ChunkLoadError") !== -1 || 
                      message.indexOf("Failed to load chunk") !== -1 || 
                      message.indexOf("Loading chunk") !== -1 || 
                      message.indexOf("failed to load") !== -1;
                  }
                  
                  reloadOnChunkError(isChunkError);
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  var message = (reason && reason.message) || "";
                  var name = (reason && reason.name) || "";
                  var isChunkError = 
                    name === "ChunkLoadError" ||
                    message.indexOf("ChunkLoadError") !== -1 || 
                    message.indexOf("Failed to load chunk") !== -1 || 
                    message.indexOf("Loading chunk") !== -1 || 
                    message.indexOf("failed to load") !== -1;
                  reloadOnChunkError(isChunkError);
                });

                // GLOBAL FIX FOR HINDI NUMERALS - FORCE LATIN
                function forceLatinNumerals() {
                  var inputs = document.querySelectorAll('input[type="number"], input[type="date"], input[type="time"], input[type="datetime-local"]');
                  for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].getAttribute('lang') !== 'en') {
                      inputs[i].setAttribute('lang', 'en');
                      inputs[i].setAttribute('dir', 'ltr');
                    }
                  }
                }
                
                // Run only after the page is fully loaded and hydrated to prevent Next.js hydration errors
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    forceLatinNumerals();
                    var debounceTimer;
                    var observer = new MutationObserver(function() {
                      clearTimeout(debounceTimer);
                      debounceTimer = setTimeout(forceLatinNumerals, 300);
                    });
                    observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });
                  }, 2000);
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans selection:bg-primary/30 selection:text-primary"
        suppressHydrationWarning
      >
        <SystemDesignProvider
          initialStyle={globalAppearance.style}
          initialTheme={globalAppearance.theme}
        >
          <PreferenceProvider initialPreferences={preferences}>
            {session?.impersonatedBy && (
              <ImpersonationBanner
                impersonatorName={session.impersonatedBy.toString()}
              />
            )}
            {children}
            <Toaster />
            <OfflineLockoutOverlay />
          </PreferenceProvider>
        </SystemDesignProvider>
      </body>
    </html>
  );
}
