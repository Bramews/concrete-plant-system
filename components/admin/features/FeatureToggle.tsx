"use client";

import { toggleFeature } from "@/app/actions/features";
import { useTransition } from "react";
import { Icons } from "@/components/ui/Icons";

export function FeatureToggle({
  featureId,
  isEnabled,
}: {
  featureId: string;
  isEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleFeature(featureId))}
      disabled={isPending}
      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
        isEnabled
          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
      }`}
    >
      {isPending ? (
        <Icons.Loader className="w-4 h-4 animate-spin" />
      ) : isEnabled ? (
        <>
          <Icons.CheckCircle className="w-4 h-4" />
          Enabled
        </>
      ) : (
        <>
          <Icons.XCircle className="w-4 h-4" />
          Disabled
        </>
      )}
    </button>
  );
}
