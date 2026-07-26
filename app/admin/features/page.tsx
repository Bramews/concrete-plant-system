import { prisma } from "@/lib/prisma";
import { FeatureToggle } from "@/components/admin/features/FeatureToggle";

export default async function AdminFeaturesPage() {
  const features = await prisma.feature.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] min-h-screen text-slate-200">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Feature Flags
        </h1>
        {/* "Add feature" button removed as it was cosmetic */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="p-6 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{feature.id}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {feature.description}
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${
                  feature.globalEnabled
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : "bg-slate-600"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
              {/* Configure button removed as it was cosmetic */}

              <FeatureToggle
                featureId={feature.id}
                isEnabled={feature.globalEnabled}
              />
            </div>
          </div>
        ))}

        {features.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-slate-700 rounded-xl">
            <p className="text-slate-500">No feature flags defined.</p>
          </div>
        )}
      </div>
    </div>
  );
}
