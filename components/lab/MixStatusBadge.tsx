"use client";

import { useEffect, useState } from "react";

export default function MixStatusBadge({ status }: { status: string }) {
  const [isArabic, setIsArabic] = useState(true);

  useEffect(() => {
    const arabic =
      document.documentElement.dir === "rtl" ||
      window.location.pathname.includes("/ar/");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsArabic(arabic);
  }, []);

  const getText = (status: string) => {
    switch (status) {
      case "DRAFT":
        return isArabic ? "مسودة" : "DRAFT";
      case "APPROVED":
        return isArabic ? "معتمد" : "APPROVED";
      case "ARCHIVED":
        return isArabic ? "مؤرشف" : "ARCHIVED";
      default:
        return status;
    }
  };

  const map: Record<string, string> = {
    DRAFT: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    ARCHIVED: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-md ${map[status] || "bg-white/5 border border-white/10 text-slate-400"}`}
    >
      {getText(status)}
    </span>
  );
}
