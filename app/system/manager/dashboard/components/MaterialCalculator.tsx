"use client";

import { useState } from "react";

interface MaterialCalculatorProps {
  lang: "en" | "ar";
}

export default function MaterialCalculator({ lang }: MaterialCalculatorProps) {
  const [cementContent, setCementContent] = useState<string>("");
  const [volume, setVolume] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const c = parseFloat(cementContent);
    const v = parseFloat(volume);

    if (!isNaN(c) && !isNaN(v)) {
      setResult(c * v);
    } else {
      setResult(null);
    }
  };

  return (
    <div className="card glass-panel p-6 mb-6">
      <h3 className="section-title mb-4">{"حاسبة كفاية المواد (تقديري)"}</h3>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm text-gray-400 mb-1">
            {"محتوى الأسمنت (C)"}
          </label>
          <input
            type="number"
            className="form-input w-full"
            placeholder="e.g. 350"
            value={cementContent}
            onChange={(e) => setCementContent(e.target.value)}
          />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-sm text-gray-400 mb-1">
            {"الكمية (m³)"}
          </label>
          <input
            type="number"
            className="form-input w-full"
            placeholder="e.g. 10"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </div>

        <button onClick={handleCalculate} className="btn btn-primary h-10 px-6">
          {"احسب"}
        </button>
      </div>

      {result !== null && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">{"إجمالي الأسمنت المطلوب:"}</span>
            <span className="text-xl font-bold text-amber-400">
              {result.toLocaleString("en-US")} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
