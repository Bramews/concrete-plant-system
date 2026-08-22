"use client";

import { Material } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ScadaSiloSVG } from "./ScadaSiloSVG";

interface UnifiedSiloDisplayProps {
  materials: Material[];
  compact?: boolean;
  className?: string;
}

export function UnifiedSiloDisplay({
  materials,
  compact = false,
  className,
}: UnifiedSiloDisplayProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        compact
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      dir="rtl"
    >
      {materials.map((m) => {
        const maxCapacity =
          (m as unknown as { maxCapacity?: number }).maxCapacity || 50000;
        
        return (
          <ScadaSiloSVG
            key={m.id}
            id={m.id}
            name={m.name}
            stock={m.stock}
            maxCapacity={maxCapacity}
            unit={m.unit}
            showLabel={true}
          />
        );
      })}

      {materials.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-500 italic text-sm font-bold">
          لا توجد بيانات صوامع أو مواد مسجلة حالياً
        </div>
      )}
    </div>
  );
}
