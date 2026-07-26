import { PlanEditor } from "@/components/admin/plans/PlanEditor";

import { prisma } from "@/lib/prisma";

export default async function NewPlanPage() {
  const features = await prisma.feature.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-8 min-h-screen bg-[#0f172a]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          Create New Plan
        </h1>
        <p className="text-slate-400">
          Define a new subscription tier for your tenants.
        </p>
      </div>
      <PlanEditor isNew={true} availableFeatures={features} />
    </div>
  );
}
