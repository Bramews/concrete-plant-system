import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ActivityTimeline } from "@/components/admin/activity/Timeline";

export default async function AdminActivityPage() {
  const logs = await prisma.companyActivityLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      user: true,
    },
  });

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] min-h-screen text-slate-200">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">
          System Activity Log
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-400">Timeline Events</h2>
          {/* Timeline View */}
          <ActivityTimeline
            activities={logs.map((log) => ({
              id: log.id,
              type: log.type,
              message: log.message,
              severity: log.severity,
              createdAt: log.createdAt,
              user: log.user
                ? { name: log.user.name, email: log.user.email }
                : null,
            }))}
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-400">Recent Raw Logs</h2>
          <div className="rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden text-sm font-bold">
            {logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex justify-between mb-1">
                  <span
                    className={`font-bold ${
                      log.severity === "CRITICAL"
                        ? "text-red-400"
                        : log.severity === "WARNING"
                          ? "text-amber-400"
                          : "text-blue-400"
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className="text-slate-500">
                    {format(log.createdAt, "HH:mm")}
                  </span>
                </div>
                <p className="text-slate-400 line-clamp-2">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
