"use client";

import { useEffect } from "react";
import { Logger } from "@/lib/logging";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our central logger (which prints to console/stderr for monitoring)
    // Note: Logger is isomorphic or Client safe?
    // Console.error works on client. The Logger class calls console.error.
    Logger.error("Global Application Error", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div className="glass-card p-8 md:p-12 max-w-lg w-full rounded-2xl border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-bold text-destructive mb-4">
              خطأ في النظام
            </h1>
            <p className="text-muted-foreground mb-8">
              نعتذر، حدث خطأ غير متوقع في نظام إدارة المصنع. يرجى المحاولة مرة
              أخرى.
            </p>

            {process.env.NODE_ENV !== "production" && (
              <div className="mb-8 p-4 bg-black/20 rounded-lg border border-white/5 text-left dir-ltr">
                <pre className="text-sm font-bold font-mono text-destructive/80 whitespace-pre-wrap break-all">
                  {error.message}
                </pre>
              </div>
            )}

            <button
              onClick={() => reset()}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
