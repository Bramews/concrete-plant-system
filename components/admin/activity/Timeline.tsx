"use client";

import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Icons } from "@/components/ui/Icons";

interface Activity {
  id: string;
  type: string;
  message: string;
  severity: string;
  createdAt: Date | string;
  user?: {
    name: string;
    email: string;
  } | null;
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <div className="relative border-l border-slate-700 ml-3 space-y-8">
      {activities.map((activity) => {
        // Safe numeral formatting for Arabic locale output
        const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
          addSuffix: true,
          locale: ar,
        }).replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

        let Icon = Icons.Activity;
        if (activity.severity === "CRITICAL") Icon = Icons.ShieldAlert;
        else if (activity.severity === "WARNING") Icon = Icons.Alert;
        else if (activity.type === "SETTING_UPDATE") Icon = Icons.Settings;
        else if (activity.type === "SECURITY_ALERT") Icon = Icons.Shield;

        return (
          <div key={activity.id} className="mb-8 ml-6 relative group">
            <span
              className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-[37px] ring-8 ring-[#0f172a] ${
                activity.severity === "CRITICAL"
                  ? "bg-red-500"
                  : activity.severity === "WARNING"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            >
              <Icon className="w-3 h-3 text-white" />
            </span>
            <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-300">
                  {activity.type}
                </span>
                <time className="text-sm font-bold text-slate-500">
                  {timeAgo}
                </time>
              </div>
              <p className="text-slate-400 text-sm mb-2">{activity.message}</p>
              {activity.user && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                    {activity.user.name[0]}
                  </div>
                  <span className="text-sm font-bold text-slate-500">
                    {activity.user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {activities.length === 0 && (
        <div className="text-slate-500 italic ml-6">No activity recorded.</div>
      )}
    </div>
  );
}
