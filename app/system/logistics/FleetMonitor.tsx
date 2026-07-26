"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Truck {
  id: string;
  truckNumber: string;
  status: "LOADING" | "EN_ROUTE" | "ON_SITE" | "RETURNING";
  driverName: string;
  projectName: string;
  batchTime: Date;
  lat: number;
  lng: number;
  volume: number;
}

export function FleetMonitor({ initialTrucks = [] }: { initialTrucks: any[] }) {
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks || []);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);

  // Simulated movement for the "WOW" effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks((prev) =>
        prev.map((t) => ({
          ...t,
          lat:
            t.status === "EN_ROUTE"
              ? t.lat + (Math.random() - 0.5) * 0.001
              : t.lat,
          lng:
            t.status === "EN_ROUTE"
              ? t.lng + (Math.random() - 0.5) * 0.001
              : t.lng,
        })),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getAgeColor = (batchTime: Date) => {
    const diff = (new Date().getTime() - new Date(batchTime).getTime()) / 60000;
    if (diff > 90) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (diff > 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const getAgePercent = (batchTime: Date) => {
    const diff = (new Date().getTime() - new Date(batchTime).getTime()) / 60000;
    return Math.min((diff / 90) * 100, 100);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] overflow-hidden">
      {/* Sidebar: Fleet List */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Icons.Truck className="w-6 h-6 text-indigo-400" />
            مراقبة الأسطول
          </h2>
          <span className="px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-bold font-black border border-indigo-500/20">
            {trucks.length} شاحنة نشطة
          </span>
        </div>

        {trucks.map((truck) => (
          <motion.div
            key={truck.id}
            layoutId={truck.id}
            onClick={() => setSelectedTruck(truck)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
              selectedTruck?.id === truck.id
                ? "bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/50 border-white/5 hover:bg-white/5"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    truck.status === "EN_ROUTE"
                      ? "bg-indigo-500/20 text-indigo-400"
                      : truck.status === "ON_SITE"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icons.Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {truck.truckNumber}
                  </h3>
                  <p className="text-sm font-bold text-slate-500">
                    {truck.driverName}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-lg text-sm font-bold font-black uppercase tracking-tight ${getAgeColor(truck.batchTime)}`}
              >
                عمر الخرسانة:{" "}
                {Math.floor(
                  (new Date().getTime() - new Date(truck.batchTime).getTime()) /
                    60000,
                )}{" "}
                د
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400 flex items-center gap-1">
                  <Icons.Navigation className="w-3 h-3" />
                  {truck.projectName}
                </span>
                <span className="text-slate-300 font-bold">
                  {truck.volume} m³
                </span>
              </div>

              {/* Age Progress Bar */}
              <div className="space-y-1">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getAgePercent(truck.batchTime)}%` }}
                    className={`h-full ${
                      getAgePercent(truck.batchTime) > 80
                        ? "bg-red-500"
                        : getAgePercent(truck.batchTime) > 60
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main: Map & Details */}
      <div className="lg:col-span-8 bg-slate-950/50 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none">
            <path
              d="M50 50L750 50L750 550L50 550Z"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <path
              d="M100 100C200 150 400 50 600 100S700 400 500 500"
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.1"
            />
          </svg>
        </div>

        {/* Dynamic Truck Markers on Map */}
        <div className="absolute inset-0">
          {trucks.map((truck) => (
            <motion.div
              key={`marker-${truck.id}`}
              animate={{
                x: 100 + (truck.lng - 55.1) * 2000,
                y: 100 + (25.3 - truck.lat) * 2000,
              }}
              className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
              onClick={() => setSelectedTruck(truck)}
            >
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-2xl transition-all ${
                    selectedTruck?.id === truck.id
                      ? "bg-indigo-500 border-white scale-125 z-50"
                      : "bg-slate-900 border-indigo-500/50"
                  }`}
                >
                  <Icons.Truck
                    className={`w-4 h-4 ${selectedTruck?.id === truck.id ? "text-white" : "text-indigo-400"}`}
                  />
                </div>
                {/* Pulsing effect for late trucks */}
                {getAgePercent(truck.batchTime) > 80 && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                )}

                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 rounded-lg p-2 text-sm font-bold whitespace-nowrap z-50">
                  <p className="text-white font-bold">{truck.truckNumber}</p>
                  <p className="text-slate-400">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(truck.batchTime).getTime()) /
                        60000,
                    )}{" "}
                    min age
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend / Stats overlay */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-slate-400 font-bold">
                طبيعي
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-bold text-slate-400 font-bold">
                تحذير
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-bold text-slate-400 font-bold">
                خطر (تصلب)
              </span>
            </div>
          </div>
        </div>

        {/* Selected Truck Detail Overlay */}
        <AnimatePresence>
          {selectedTruck && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 inset-x-6 h-48 bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl flex flex-col sm:flex-row"
            >
              <div className="sm:w-1/3 p-6 border-b sm:border-b-0 sm:border-l border-white/5 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Icons.Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">
                      {selectedTruck.truckNumber}
                    </h4>
                    <p className="text-sm text-indigo-400 font-bold uppercase tracking-widest ltr">
                      {selectedTruck.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-500 font-black uppercase tracking-widest">
                    السائق
                  </p>
                  <p className="text-sm text-slate-200 font-bold">
                    {selectedTruck.driverName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-500 font-black uppercase tracking-widest">
                    الموقع
                  </p>
                  <p className="text-sm text-slate-200 font-bold truncate">
                    {selectedTruck.projectName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-400 font-black uppercase tracking-widest">
                    توقيت التحميل
                  </p>
                  <p className="text-sm font-bold text-slate-300 font-mono">
                    {formatDistanceToNow(new Date(selectedTruck.batchTime), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-slate-400 font-bold">
                      مؤشر جودة الخرسانة (الزمني)
                    </span>
                    <span
                      className={`text-sm font-bold font-black ${
                        getAgePercent(selectedTruck.batchTime) > 80
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {100 - Math.floor(getAgePercent(selectedTruck.batchTime))}
                      % Fresh
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${100 - getAgePercent(selectedTruck.batchTime)}%`,
                      }}
                      className={`h-full ${
                        getAgePercent(selectedTruck.batchTime) > 80
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTruck(null)}
                className="absolute top-4 left-4 p-2 text-slate-500 hover:text-white"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
