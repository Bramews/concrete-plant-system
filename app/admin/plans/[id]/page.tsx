import { PlanEditor } from "@/components/admin/plans/PlanEditor";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) {
    notFound();
  }
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) notFound();

  const features = await prisma.feature.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-8 min-h-screen bg-[#0f172a]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          Edit Plan: {plan.name}
        </h1>
        <p className="text-slate-400">
          Modify subscription limits and details.
        </p>
      </div>
      <PlanEditor
        key={plan.updatedAt.toString()}
        plan={plan as any}
        availableFeatures={features}
      />
    </div>
  );
}
