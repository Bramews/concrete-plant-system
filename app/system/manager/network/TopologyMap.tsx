import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { pingDeviceAction } from "@/app/actions/network";

interface TopologyMapProps {
  devices: any[];
}

export function TopologyMap({ devices }: TopologyMapProps) {
  const [mounted, setMounted] = useState(false);
  const [latencies, setLatencies] = useState<
    Record<string, { latency: number; success: boolean }>
  >({});

  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const pingAll = async () => {
      const results: Record<string, { latency: number; success: boolean }> = {};
      await Promise.all(
        devices.map(async (d) => {
          if (d.ipAddress) {
            try {
              const res = await pingDeviceAction(d.ipAddress);
              results[d.deviceUuid] = res;
            } catch {
              results[d.deviceUuid] = { success: false, latency: 9999 };
            }
          }
        }),
      );
      setLatencies(results);
    };

    pingAll();
    const interval = setInterval(pingAll, 5000);
    return () => clearInterval(interval);
  }, [devices]);

  if (!mounted) return null;

  const localDevices = devices.filter((d) => d.connectionType === "LOCAL");
  const globalDevices = devices.filter((d) => d.connectionType === "GLOBAL");

  return (
    <div
      className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl mt-8 overflow-hidden"
      dir="rtl"
    >
      <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
        <Icons.Activity className="w-5 h-5 text-indigo-400" />
        الخريطة الطبوغرافية للشبكة (Topology Map)
      </h2>

      <div className="relative w-full h-[400px] flex items-center justify-center bg-slate-950/50 rounded-3xl border border-white/5">
        <style>{`
          @keyframes pulseLine {
            to {
              stroke-dashoffset: -120;
            }
          }
        `}</style>

        {/* SVG Laser Connecting Lines */}
        <div className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none z-0">
          <svg className="overflow-visible" style={{ width: 0, height: 0 }}>
            <defs>
              <linearGradient
                id="glowGreen"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="glowRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient
                id="glowAmber"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {localDevices.map((d, i) => {
              const angle = (i / (localDevices.length || 1)) * 360;
              const radius = 150;
              const x = Math.cos(angle * (Math.PI / 180)) * radius;
              const y = Math.sin(angle * (Math.PI / 180)) * radius;
              const ping = latencies[d.deviceUuid];

              let strokeColor = "url(#glowGreen)";
              if (ping) {
                if (!ping.success || ping.latency >= 1000)
                  strokeColor = "url(#glowRed)";
                else if (ping.latency >= 200) strokeColor = "url(#glowAmber)";
              }

              return (
                <line
                  key={`line-local-${d.deviceUuid}`}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="8, 8"
                  className="animate-[pulseLine_30s_linear_infinite]"
                />
              );
            })}

            {globalDevices.map((d, i) => {
              const angle = (i / (globalDevices.length || 1)) * 360;
              const radius = 250;
              const x = Math.cos(angle * (Math.PI / 180)) * radius;
              const y = Math.sin(angle * (Math.PI / 180)) * radius;
              const ping = latencies[d.deviceUuid];

              let strokeColor = "url(#glowAmber)";
              if (ping) {
                if (!ping.success || ping.latency >= 1000)
                  strokeColor = "url(#glowRed)";
                else if (ping.latency >= 200) strokeColor = "url(#glowRed)";
              }

              return (
                <line
                  key={`line-global-${d.deviceUuid}`}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="8, 8"
                  className="animate-[pulseLine_30s_linear_infinite]"
                />
              );
            })}
          </svg>
        </div>

        {/* Core Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.5)] flex items-center justify-center animate-pulse">
            <Icons.Server className="w-10 h-10 text-white" />
          </div>
          <div className="mt-4 font-black text-white bg-slate-900 px-4 py-1 rounded-full text-xs border border-white/10">
            المحور المركزي (Hub)
          </div>
        </div>

        {/* Local Network Ring */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-2 border-dashed border-emerald-500/30 rounded-full animate-[spin_60s_linear_infinite]" />

        {/* Global Network Ring */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-2 border-dashed border-amber-500/30 rounded-full animate-[spin_90s_linear_infinite_reverse]" />

        {/* Devices Placement */}
        {localDevices.map((d, i) => {
          const angle = (i / (localDevices.length || 1)) * 360;
          const radius = 150;
          const x = Math.cos(angle * (Math.PI / 180)) * radius;
          const y = Math.sin(angle * (Math.PI / 180)) * radius;

          const ping = latencies[d.deviceUuid];
          let colorClass =
            "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
          let labelSuffix = "";
          if (ping) {
            if (!ping.success || ping.latency >= 1000) {
              colorClass = "bg-rose-500/10 border-rose-500/40 text-rose-400";
              labelSuffix = " (غير متصل)";
            } else if (ping.latency >= 200) {
              colorClass = "bg-amber-500/10 border-amber-500/40 text-amber-400";
              labelSuffix = ` (${ping.latency}ms)`;
            } else {
              colorClass =
                "bg-emerald-500/20 border-emerald-500 text-emerald-400";
              labelSuffix = ` (${ping.latency}ms)`;
            }
          }

          return (
            <div
              key={d.deviceUuid}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group z-20"
              style={{ marginLeft: `${x}px`, marginTop: `${y}px` }}
            >
              <div
                onClick={() =>
                  setSelectedDevice({
                    ...d,
                    lastPing: ping?.latency || 0,
                    isLocal: true,
                  })
                }
                className={`w-10 h-10 border rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all ${colorClass}`}
              >
                <Icons.Monitor className="w-5 h-5" />
              </div>

              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                {d.name || "محلي"}
                {labelSuffix}
                <br />
                <span className="text-slate-400 font-mono">{d.ipAddress}</span>
              </div>
            </div>
          );
        })}

        {globalDevices.map((d, i) => {
          const angle = (i / (globalDevices.length || 1)) * 360;
          const radius = 250;
          const x = Math.cos(angle * (Math.PI / 180)) * radius;
          const y = Math.sin(angle * (Math.PI / 180)) * radius;

          const ping = latencies[d.deviceUuid];
          let colorClass = "bg-amber-500/10 border-amber-500/40 text-amber-400";
          let labelSuffix = "";
          if (ping) {
            if (!ping.success || ping.latency >= 1000) {
              colorClass = "bg-rose-500/10 border-rose-500/40 text-rose-400";
              labelSuffix = " (غير متصل)";
            } else if (ping.latency >= 200) {
              colorClass = "bg-rose-500/20 border-rose-500 text-rose-400";
              labelSuffix = ` (${ping.latency}ms)`;
            } else {
              colorClass = "bg-amber-500/20 border-amber-500 text-amber-400";
              labelSuffix = ` (${ping.latency}ms)`;
            }
          }

          return (
            <div
              key={d.deviceUuid}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group z-20"
              style={{ marginLeft: `${x}px`, marginTop: `${y}px` }}
            >
              <div
                onClick={() =>
                  setSelectedDevice({
                    ...d,
                    lastPing: ping?.latency || 0,
                    isLocal: false,
                  })
                }
                className={`w-10 h-10 border rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all ${colorClass}`}
              >
                <Icons.Globe className="w-5 h-5" />
              </div>

              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                {d.name || "خارجي"}
                {labelSuffix}
                <br />
                <span className="text-slate-400 font-mono">{d.ipAddress}</span>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/80 p-3 rounded-2xl border border-white/10 flex flex-col gap-2 z-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></span>
            شبكة محلية (LAN) - انقر للتشخيص
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
            <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></span>
            شبكة خارجية (WAN) - انقر للتشخيص
          </div>
        </div>
      </div>

      {/* Diagnostics Modal */}
      {selectedDevice && (
        <DiagnosticsModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}

function DiagnosticsModal({
  device,
  onClose,
}: {
  device: any;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<number[]>([device.lastPing]);
  const [currentPing, setCurrentPing] = useState<number>(device.lastPing);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const runPing = async () => {
      if (!device.ipAddress) return;
      try {
        const res = await pingDeviceAction(device.ipAddress);
        setCurrentPing(res.success ? res.latency : 9999);
        setIsOnline(res.success && res.latency < 1000);
        setHistory((prev) => {
          const next = [...prev];
          if (next.length >= 15) next.shift();
          next.push(res.success ? res.latency : 0);
          return next;
        });
      } catch {
        setCurrentPing(9999);
        setIsOnline(false);
        setHistory((prev) => {
          const next = [...prev];
          if (next.length >= 15) next.shift();
          next.push(0);
          return next;
        });
      }
    };

    const interval = setInterval(runPing, 1500);
    return () => clearInterval(interval);
  }, [device]);

  // Statistics
  const validHistory = history.filter((v) => v > 0);
  const avgPing =
    validHistory.length > 0
      ? Math.round(
          validHistory.reduce((a, b) => a + b, 0) / validHistory.length,
        )
      : 0;
  const maxPing = validHistory.length > 0 ? Math.max(...validHistory) : 0;
  const minPing = validHistory.length > 0 ? Math.min(...validHistory) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Icons.Activity className="w-5 h-5 text-indigo-400" />
              محلل الشبكة الحي (Live Diagnostics)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {device.name || "جهاز مجهول"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* IP and Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              عنوان IP
            </span>
            <span className="text-sm font-black font-mono text-white">
              {device.ipAddress || "—"}
            </span>
          </div>
          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              الحالة اللحظية
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`}
              />
              <span
                className={`text-sm font-bold ${isOnline ? "text-emerald-400" : "text-rose-400"}`}
              >
                {isOnline ? "متصل (نشط)" : "غير متصل (Offline)"}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Graph */}
        <div className="mb-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            سرعة الاستجابة بالملي ثانية (Latency History)
          </span>
          <LivePingChart data={history} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center mb-2">
          <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block mb-1">
              الأدنى (Min)
            </span>
            <span className="text-sm font-mono font-black text-indigo-300">
              {minPing}ms
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block mb-1">
              المتوسط (Avg)
            </span>
            <span className="text-sm font-mono font-black text-emerald-300">
              {avgPing}ms
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block mb-1">
              الأقصى (Max)
            </span>
            <span className="text-sm font-mono font-black text-rose-300">
              {maxPing}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LivePingChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 100);
  const min = 0;
  const range = max - min;
  const width = 500;
  const height = 150;

  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - ((val - min) / (range || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const pathD =
    data.length > 0
      ? `M ${data
          .map((val, index) => {
            const x = (index / (data.length - 1 || 1)) * width;
            const y = height - ((val - min) / (range || 1)) * height;
            return `${x} ${y}`;
          })
          .join(" L ")}`
      : "";

  const areaD =
    data.length > 0 ? `${pathD} L ${width} ${height} L 0 ${height} Z` : "";

  return (
    <div className="relative w-full h-[160px] bg-slate-950/70 border border-white/5 rounded-2xl p-4 overflow-hidden">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
        <div className="border-b border-white w-full h-0"></div>
        <div className="border-b border-white w-full h-0"></div>
        <div className="border-b border-white w-full h-0"></div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Area fill under line */}
        {areaD && <path d={areaD} fill="url(#chartGradient)" />}
        {/* Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Point circles */}
        {data.map((val, index) => {
          const x = (index / (data.length - 1 || 1)) * width;
          const y = height - ((val - min) / (range || 1)) * height;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              className="fill-indigo-400 stroke-slate-950 stroke-[2px]"
            />
          );
        })}
      </svg>
    </div>
  );
}
