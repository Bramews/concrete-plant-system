import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaterialsClient } from "./MaterialsClient";
import { Icons } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function ManagerMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();

  if (!user || !user.companyId) {
    throw new Error("Unauthorized: Company association required");
  }

  // Fetch materials for current company
  const materials = await prisma.material.findMany({
    where: {
      companyId: user.companyId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Icons.Box className="w-6 h-6 text-white" />
          </div>
          {"إدارة الموارد والمواد"}
        </h1>
        <p className="text-slate-500 text-sm font-medium mr-14">
          أرصدة المخزون والتحكم في توريد المواد
        </p>
      </div>

      <MaterialsClient initialMaterials={materials} initialSearch={q || ""} />
    </div>
  );
}
