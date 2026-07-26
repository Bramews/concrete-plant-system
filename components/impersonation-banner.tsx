"use client";

import { stopImpersonation } from "@/app/actions/sovereign-user-actions";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { useState } from "react";

export function ImpersonationBanner({
  impersonatorName,
}: {
  impersonatorName?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    setLoading(true);
    await stopImpersonation();
    router.refresh(); // Refresh server components
    setLoading(false);
  };

  return (
    <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-center gap-4 text-sm font-bold shadow-lg z-[9999] relative">
      <div className="flex items-center gap-2">
        <Icons.Shield className="w-5 h-5" />
        <span>
          IMPERSONATION MODE ACTIVE
          {impersonatorName && (
            <span className="opacity-80 font-normal ml-1">
              {" "}
              (Admin: {impersonatorName})
            </span>
          )}
        </span>
      </div>
      <button
        onClick={handleStop}
        disabled={loading}
        className="bg-black/20 hover:bg-black/30 px-3 py-1 rounded text-sm font-bold transition-colors border border-black/10 flex items-center gap-2"
      >
        {loading && <Icons.Loader className="w-3 h-3 animate-spin" />}
        STOP IMPERSONATION
      </button>
    </div>
  );
}
