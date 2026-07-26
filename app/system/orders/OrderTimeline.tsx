"use client";

import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  status: string;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const steps = [
    { key: "PENDING", label: "جدولة", icon: Icons.Clock },
    { key: "PRODUCTION", label: "إنتاج", icon: Icons.Activity },
    { key: "DISPATCHED", label: "شحن", icon: Icons.Truck },
    { key: "DELIVERED", label: "تسليم", icon: Icons.CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1.5" dir="rtl">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-700 shadow-lg",
                isCompleted
                  ? "bg-indigo-600 text-white"
                  : isCurrent
                    ? "bg-amber-600 text-white animate-pulse"
                    : "bg-white/5 text-slate-700 border border-white/5",
              )}
            >
              <step.icon className="w-3.5 h-3.5" />
            </div>

            {!isLast && (
              <div className="w-4 h-[1px] mx-1 bg-white/5 overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-indigo-500 transition-all duration-1000",
                    isCompleted ? "w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
