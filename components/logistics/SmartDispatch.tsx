"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  MapPin,
  Gauge,
  AlertTriangle,
  Play,
  RefreshCw,
} from "lucide-react";
import { simulateTruckMovement } from "@/app/actions/logistics";

interface Vehicle {
  id: number;
  code: string;
  name: string | null;
  type: string;
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  odometer: number | null;
  totalHours: number | null;
  nextServiceHours: number | null;
}

export function SmartDispatch({
  vehicles: initialVehicles,
}: {
  vehicles: Vehicle[];
}) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(async () => {
        // Randomly simulate one truck every 5 seconds
        const randomIdx = Math.floor(Math.random() * vehicles.length);
        const v = vehicles[randomIdx];
        if (v) {
          await simulateTruckMovement(v.id);
          // In a real app we'd use a subscription/polling, but for this demo
          // we mock the state update for visual smoothness.
          setVehicles((prev) =>
            prev.map((item) =>
              item.id === v.id
                ? {
                    ...item,
                    currentLat: (item.currentLat || 33.3) + 0.001,
                    odometer: (item.odometer || 0) + 0.5,
                  }
                : item,
            ),
          );
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, vehicles]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-blue-500" />
          <h3 className="font-black text-white text-sm uppercase tracking-widest">
            متابعة الأسطول (Live Fleet Analytics)
          </h3>
        </div>
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-4 py-2 rounded-xl text-sm font-bold font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            isSimulating
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {isSimulating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {isSimulating ? "إيقاف المحاكاة" : "بدء المحاكاة المباشرة"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => {
          const maintenanceProgress =
            ((vehicle.totalHours || 0) / (vehicle.nextServiceHours || 500)) *
            100;
          const isLow = maintenanceProgress > 85;

          return (
            <div
              key={vehicle.id}
              className="glass-panel p-6 rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-all overflow-hidden relative"
            >
              {/* Background Radar Effect if simulating */}
              {isSimulating && (
                <div className="absolute top-0 right-0 p-4">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-bold text-slate-500 font-black uppercase tracking-widest mb-1">
                    Truck Code
                  </p>
                  <h4 className="text-xl font-black text-white font-mono">
                    {vehicle.code}
                  </h4>
                </div>
                {isLow && (
                  <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-400 font-bold">الموقع:</span>
                  <span className="text-white font-black font-mono text-sm font-bold">
                    {vehicle.currentLat?.toFixed(4)},{" "}
                    {vehicle.currentLng?.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-400 font-bold">المسافة:</span>
                  <span className="text-white font-black">
                    {vehicle.odometer} km
                  </span>
                </div>

                {/* Maintenance Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mb-1">
                    <span>Service Integrity</span>
                    <span
                      className={isLow ? "text-rose-400" : "text-emerald-400"}
                    >
                      {maintenanceProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${isLow ? "bg-rose-500" : "bg-blue-500"}`}
                      style={{
                        width: `${Math.min(maintenanceProgress, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
