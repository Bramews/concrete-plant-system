"use client";

import { useEffect, useState, startTransition } from "react";
import { dismissBroadcastMessage } from "@/app/actions/network";

interface NetworkBroadcastListenerProps {
  companyId: number;
  currentUserId?: number;
  userRole?: string;
}

export function NetworkBroadcastListener({
  companyId,
  currentUserId,
  userRole,
}: NetworkBroadcastListenerProps) {
  const [activeMsg, setActiveMsg] = useState<{
    message: string;
    timestamp: string;
    type: "SYSTEM" | "COMPANY";
  } | null>(null);
  const [messageTitle, setMessageTitle] = useState(
    "📢 تنبيه عاجل من إدارة النظام",
  );

  useEffect(() => {
    function getCookie(name: string) {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    }

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      const pollBroadcast = async () => {
        try {
          const res = await fetch(
            `/api/network/broadcast?companyId=${companyId}`,
            {
              headers: { Accept: "application/json" },
            },
          );
          if (res.ok) {
            const data = await res.json();
            if (data.activeMsg) {
              const { message, timestamp, type } = data.activeMsg;
              const key =
                type === "SYSTEM"
                  ? "dismissed_system_broadcast_time"
                  : "dismissed_company_broadcast_time";
              const lastDismissed = localStorage.getItem(key);
              if (lastDismissed !== timestamp) {
                setMessageTitle(
                  type === "SYSTEM"
                    ? "📢 تنبيه عاجل من إدارة النظام"
                    : "📢 تنبيه عاجل من إدارة الشركة",
                );
                setActiveMsg({ message, timestamp, type });
              }
            }
          }
        } catch (e) {
          // Silent catch
        }
      };

      pollBroadcast();
      const intervalId = setInterval(pollBroadcast, 15000);
      return () => clearInterval(intervalId);
    }

    const sseUrl = `/api/network/broadcast?companyId=${companyId}`;
    let eventSource = new EventSource(sseUrl);

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);

        // Case 1: Device Kick
        if (payload.type === "EVENT" && payload.event === "KICK_DEVICE") {
          const targetUuid = payload.data?.deviceUuid;
          const myUuid = getCookie("device_uuid");

          if (targetUuid && myUuid && targetUuid === myUuid) {
            console.warn(
              "[NetworkBroadcastListener] Device kicked by manager. Terminating session...",
            );
            terminateSession(
              "تم إنهاء جلسة هذا الجهاز أو حظره من قبل الإدارة.",
            );
          }
        }

        // Case 2: User Account Status Change / Delete / Update Kick
        if (payload.type === "EVENT" && payload.event === "KICK_USER") {
          const targetUserId = payload.data?.userId;

          if (
            targetUserId &&
            currentUserId &&
            Number(targetUserId) === Number(currentUserId)
          ) {
            console.warn(
              "[NetworkBroadcastListener] User session revoked or modified by manager. Terminating session...",
            );
            terminateSession(
              "تم إنهاء جلسة حسابك أو تعديل صلاحياته من قبل الإدارة.",
            );
          }
        }

        // Case 3: System Broadcast Live Message
        if (payload.type === "EVENT" && payload.event === "SYSTEM_BROADCAST") {
          const broadcastMsg = payload.data?.message;
          const time = payload.timestamp || new Date().toISOString();
          if (broadcastMsg) {
            const lastDismissed = localStorage.getItem(
              "dismissed_system_broadcast_time",
            );
            if (lastDismissed !== time) {
              setMessageTitle("📢 تنبيه عاجل من إدارة النظام");
              setActiveMsg({
                message: broadcastMsg,
                timestamp: time,
                type: "SYSTEM",
              });
            }
          }
        }

        // Case 4: Company Broadcast Live Message
        if (payload.type === "EVENT" && payload.event === "COMPANY_BROADCAST") {
          const broadcastMsg = payload.data?.message;
          const time = payload.timestamp || new Date().toISOString();
          if (
            broadcastMsg &&
            Number(payload.companyId) === Number(companyId) &&
            userRole !== "SYSTEM_OWNER"
          ) {
            const lastDismissed = localStorage.getItem(
              "dismissed_company_broadcast_time",
            );
            if (lastDismissed !== time) {
              setMessageTitle("📢 تنبيه عاجل من إدارة الشركة");
              setActiveMsg({
                message: broadcastMsg,
                timestamp: time,
                type: "COMPANY",
              });
            }
          }
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    const terminateSession = (reason: string) => {
      // Delete all session and auth cookies
      document.cookie =
        "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.clear();

      // Redirect immediately
      window.location.href = `/access-denied?reason=${encodeURIComponent(reason)}`;
    };

    eventSource.addEventListener("message", handleMessage);

    // Reconnection handling if error occurs
    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(() => {
        eventSource = new EventSource(sseUrl);
        eventSource.addEventListener("message", handleMessage);
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [companyId, currentUserId, userRole]);

  if (!activeMsg) return null;

  const handleDismiss = () => {
    if (activeMsg) {
      const { type, timestamp } = activeMsg;

      // 1. Hide immediately in UI
      setActiveMsg(null);

      // 2. Client fallback
      if (type === "SYSTEM") {
        localStorage.setItem("dismissed_system_broadcast_time", timestamp);
      } else {
        localStorage.setItem("dismissed_company_broadcast_time", timestamp);
      }

      // 3. Database persistent storage for cross-device support (desktop/mobile app)
      startTransition(async () => {
        try {
          await dismissBroadcastMessage(type, timestamp);
        } catch (err) {
          console.error("Error dismissing broadcast in DB:", err);
        }
      });
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes customSlideDown {
          from {
            transform: translateY(-100%) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-custom-slide-down {
          animation: customSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `,
        }}
      />
      <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/30 shadow-2xl rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto ring-2 ring-amber-500/10 animate-custom-slide-down"
          dir="rtl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 animate-pulse flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-base font-black text-amber-400">
                {messageTitle}
              </h4>
              <p className="text-sm font-bold text-slate-100 leading-relaxed">
                {activeMsg.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-6 py-2.5 text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center min-w-[100px] flex-shrink-0 cursor-pointer"
          >
            موافق
          </button>
        </div>
      </div>
    </>
  );
}
