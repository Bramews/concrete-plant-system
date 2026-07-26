import { getOperationalPulse, getAttentionItems } from "@/app/actions/manager";
import { OperationalPulse } from "@/components/manager/OperationalPulse";
import { ActionableItems } from "@/components/manager/ActionableItems";
import { QuickSimulator } from "@/components/manager/QuickSimulator";
import { CommandNav } from "@/components/manager/CommandNav";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  // Fetch initial data
  // detailed error handling should be added, but for now we let error.tsx catch issues
  const pulseData = await getOperationalPulse();
  const attentionItems = await getAttentionItems();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* 1. Operational Pulse (Top Bar) */}
      <div className="sticky top-0 z-50">
        <OperationalPulse initialData={pulseData} />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 2. Command Navigation (Center Search) */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CommandNav />
        </div>

        {/* 3. Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Attention Queue (Width: 8/12) */}
          <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <ActionableItems initialItems={attentionItems} dict={dict} />
          </div>

          {/* Right Column: Quick Simulation & Tools (Width: 4/12) */}
          <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <QuickSimulator dict={dict} />

            {/* Placeholder for future widgets (e.g. recent logs) */}
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center py-12 text-slate-600 text-sm font-bold">
              مساحة لأدوات إضافية
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
