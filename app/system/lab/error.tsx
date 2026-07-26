"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[LabError] Error in /system/lab:", error.message);

    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Failed to load chunk") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("failed to load");

    if (isChunkError) {
      try {
        const hasReloaded = sessionStorage.getItem("chunk-error-reloaded");
        if (!hasReloaded) {
          sessionStorage.setItem("chunk-error-reloaded", "true");
          window.location.reload();
        } else {
          setTimeout(() => {
            sessionStorage.removeItem("chunk-error-reloaded");
          }, 5000);
        }
      } catch (e) {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        color: "#e2e8f0",
        padding: "2rem",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "2.5rem",
          borderRadius: "1.25rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(239,68,68,0.2)",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>🧪</div>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: "0.5rem",
          }}
        >
          خطأ في وحدة المختبر
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "#94a3b8",
            marginBottom: "1.75rem",
            lineHeight: 1.7,
          }}
        >
          حدث خطأ غير متوقع في هذه الصفحة. بياناتك محفوظة بأمان. يمكنك إعادة
          المحاولة أو العودة للقائمة الرئيسية.
        </p>
        <div
          style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
        >
          <button
            onClick={reset}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "0.65rem",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => router.push("/system/lab")}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "0.65rem",
              background: "rgba(255,255,255,0.05)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.1)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            قائمة المختبر
          </button>
        </div>
      </div>
    </div>
  );
}
