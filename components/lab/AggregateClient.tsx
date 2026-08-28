"use client";

import { useState } from "react";
import { AppCard, StatusBadge } from "@/components/ui/IndustrialComponents";
import { AggregateTestForm } from "./AggregateTestForm";
import { Scale, Beaker, Archive } from "lucide-react";
import { useDictionary } from "@/lib/dictionary";

interface Material {
  id: number;
  name: string;
  code: string | null;
  stock: number;
  unit: string;
  sieveAnalyses: any[];
}

interface TestMethod {
  id: string;
  name: string;
  code: string;
  unit: string | null;
  warningMin: number | null;
  warningMax: number | null;
  rejectMin: number | null;
  rejectMax: number | null;
}

interface AggregateClientProps {
  materials: Material[];
  testMethods: TestMethod[];
}

export function AggregateClient({
  materials,
  testMethods,
}: AggregateClientProps) {
  const d = useDictionary();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );
  const [selectedMethod, setSelectedMethod] = useState<TestMethod | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Sidebar: Materials List */}
      <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
        <h3 className="text-sm font-bold font-black uppercase text-slate-400 tracking-wider">
          {d.lab?.aggregate?.stockpile || "Stockpile Materials"}
        </h3>
        {materials.map((mat) => (
          <div
            key={mat.id}
            onClick={() => {
              setSelectedMaterial(mat);
              setSelectedMethod(null);
            }}
            className={`
              cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden group
              ${
                selectedMaterial?.id === mat.id
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-900/40"
                  : "bg-card border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
              }
            `}
          >
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <h4 className="font-bold text-sm">{mat.name}</h4>
                <div className="flex items-center gap-2 mt-1 opacity-70">
                  <span className="text-sm font-bold font-mono">
                    {mat.code || "N/A"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold opacity-60">
                  {d.sidebar?.material_status || "Stock"}
                </p>
                <p className="font-mono font-black text-sm">
                  {mat.stock} {mat.unit}
                </p>
              </div>
            </div>
            {/* Soft background icon */}
            <Archive
              className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 transition-transform group-hover:scale-110 ${selectedMaterial?.id === mat.id ? "text-white" : "text-slate-900"}`}
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="lg:col-span-9 flex gap-6">
        {selectedMaterial ? (
          <>
            {/* Method Selection */}
            <div className="w-1/3 space-y-4">
              <AppCard
                title={d.lab?.aggregate?.available_tests || "Available Tests"}
                className="h-full"
              >
                <div className="space-y-2">
                  {testMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between
                        ${
                          selectedMethod?.id === method.id
                            ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50"
                            : "bg-card border-white/5 hover:bg-white/5"
                        }
                      `}
                    >
                      <span
                        className={`font-bold text-sm ${selectedMethod?.id === method.id ? "text-indigo-400" : "text-slate-400"}`}
                      >
                        {method.name}
                      </span>
                      <span className="text-sm font-bold bg-white/5 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-white/5">
                        {method.code}
                      </span>
                    </button>
                  ))}
                </div>
              </AppCard>
            </div>

            {/* Test Execution Area */}
            <div className="w-2/3">
              {selectedMethod ? (
                <AppCard
                  title={selectedMethod.name}
                  subtitle={`${selectedMaterial.name} • ${selectedMethod.code}`}
                  className="h-full border-blue-100 shadow-sm"
                >
                  <AggregateTestForm
                    material={selectedMaterial}
                    method={selectedMethod}
                    onSuccess={() => {
                      // Ideally strictly refresh data
                    }}
                  />
                </AppCard>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-background/30 rounded-[2.5rem] border-2 border-dashed border-white/5">
                  <Beaker className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-bold text-sm uppercase tracking-widest">
                    {d.lab?.aggregate?.select_test ||
                      "Select a test from the list"}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-background/30 rounded-[2.5rem] border-2 border-dashed border-white/5 min-h-[400px]">
            <Scale className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-bold text-sm uppercase tracking-widest text-center px-8 leading-loose">
              {d.lab?.aggregate?.select_material ||
                "Select a material from the left sidebar to begin testing"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
