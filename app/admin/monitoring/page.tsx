import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { SovereignGuard } from "@/components/ui/SovereignGuard";

interface LocalSystemMetric {
  id: number;
  metricName: string;
  value: number;
  details: string | null;
  timestamp: Date;
}

interface LocalSystemAlert {
  id: number;
  severity: string;
  message: string;
  correlationId: string | null;
  timestamp: Date;
  resolved: boolean;
}

export default async function MonitoringPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  let metrics: LocalSystemMetric[] = [];
  let alerts: LocalSystemAlert[] = [];

  try {
    metrics = await (prisma as any).systemMetric.findMany({
      take: 20,
      orderBy: { timestamp: "desc" },
    });

    alerts = await (prisma as any).systemAlert.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
    });
  } catch (e) {
    console.error("Monitoring fetch error:", e);
  }

  return (
    <div className="p-8 min-h-screen bg-[#020617]">
      <SovereignGuard moduleName="SYSTEM_MONITORING">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
              {"مراقبة النظام"}
            </h2>
            <div className="h-1 w-20 bg-primary rounded-full mb-4"></div>
            <p className="text-slate-400 text-lg">
              {"المراقبة الفورية للبنية التحتية والأمن."}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Live Alerts Panel */}
            <div className="glass-panel p-8 border border-white/5 rounded-[2rem] bg-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-24 h-24 border-4 border-red-500 rounded-full animate-ping"></div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                {"التنبيهات الحية"}
              </h3>

              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold font-black rounded-full uppercase tracking-widest">
                        {alert.severity}
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString("en-US")}
                      </span>
                    </div>
                    <div className="text-slate-200 font-medium">
                      {alert.message}
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-500 italic">
                      No active threats detected.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Panel */}
            <div className="glass-panel p-8 border border-white/5 rounded-[2rem] bg-white/5 backdrop-blur-3xl shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">
                {"أداء النظام"}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400 uppercase text-sm font-bold font-black tracking-widest">
                    <tr>
                      <th className="py-4 px-6">Metric</th>
                      <th className="py-4 px-6">Value</th>
                      <th className="py-4 px-6 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {metrics
                      .filter((m) => m.metricName === "ACTION_LATENCY")
                      .map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-6 text-slate-300 font-medium">
                            {m.details}
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-primary font-mono font-bold group-hover:text-white transition-colors">
                              {m.value}ms
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-sm font-bold text-slate-500 font-mono">
                            {new Date(m.timestamp).toLocaleTimeString("en-US")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </SovereignGuard>
    </div>
  );
}
