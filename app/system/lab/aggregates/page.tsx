import { Metadata } from "next";
import { getMaterialsForTesting } from "@/app/actions/lab-aggregates";
import { prisma } from "@/lib/prisma";
import { AggregateClient } from "@/components/lab/AggregateClient";

export const metadata: Metadata = {
  title: "Aggregate Quality Control",
};

async function getAggregateTestMethods() {
  "use server";
  try {
    const methods = await prisma.testMethod.findMany({
      where: {
        labStandard: { isActive: true },
        code: {
          in: ["MOISTURE", "SPECIFIC_GRAVITY", "ABSORPTION", "GRADATION"],
        },
      },
      include: {
        labStandard: true,
      },
    });
    return methods.map((m) => ({
      ...m,
      standard: m.labStandard,
    })) as any;
  } catch (e) {
    return [];
  }
}

export default async function AggregatePage() {
  const [materialsResult, methods] = await Promise.all([
    getMaterialsForTesting(),
    getAggregateTestMethods(),
  ]);

  const materials = materialsResult.success ? materialsResult.data : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Aggregate Quality Control
          </h1>
          <p className="text-slate-500 mt-1">
            Periodical tests for Sand and Gravel (Moisture, Grading, Specific
            Gravity).
          </p>
        </div>
      </div>

      <AggregateClient
        materials={materials || []}
        testMethods={methods || []}
      />
    </div>
  );
}
