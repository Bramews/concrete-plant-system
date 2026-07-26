"use client";

import { useState } from "react";

interface LabNotification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

// Mock data - replace with real data fetching if available in schema later
const MOCK_NOTIFICATIONS: LabNotification[] = [
  {
    id: "1",
    message: "Mix Design #404 Approved",
    date: "2024-02-01",
    read: false,
  },
  {
    id: "2",
    message: "Cube Test Result: Passed",
    date: "2024-01-30",
    read: true,
  },
];

interface LabNotificationsProps {
  lang: "en" | "ar";
}

export default function LabNotifications({ lang }: LabNotificationsProps) {
  const [notifications, setNotifications] =
    useState<LabNotification[]>(MOCK_NOTIFICATIONS);

  const handleAck = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <div className="card glass-panel p-6 h-full">
      <h3 className="section-title mb-4">{"تبليغات المختبر"}</h3>

      <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            {"لا توجد تبليغات"}
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-md border ${n.read ? "border-gray-800 bg-gray-900/30 opacity-60" : "border-blue-500/30 bg-blue-900/10"}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${n.read ? "text-gray-400" : "text-blue-100"}`}
                >
                  {n.message}
                </span>
                <span className="text-sm font-bold text-gray-500">
                  {n.date}
                </span>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleAck(n.id)}
                  className="text-sm font-bold text-blue-400 hover:text-blue-300 underline mt-1"
                >
                  {"تأكيد القراءة"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
