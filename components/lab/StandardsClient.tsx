"use client";

import { StandardCard } from "./StandardCard";

interface StandardsClientProps {
  standards: any[];
}

export function StandardsClient({ standards }: StandardsClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {standards.map((standard) => (
          <StandardCard key={standard.id} standard={standard} />
        ))}
      </div>

      {standards.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">
            لا توجد مواصفات قياسية مسجلة.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            يرجى تشغيل سكربت التهيئة أو الاتصال بالدعم الفني.
          </p>
        </div>
      )}
    </div>
  );
}
