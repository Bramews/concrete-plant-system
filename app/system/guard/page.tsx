import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import GuardDashboard from "./GuardDashboard";
import { Toaster } from "sonner";

export default async function GuardPage() {
  await requireRole(["GUARD", "MANAGER"]);

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not found");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  // Fetch db user to get specific flags
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { canRegisterMaterials: true },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: user.companyId as number, status: "ACTIVE" },
    orderBy: { code: "asc" },
  });
  const materials = await prisma.material.findMany({
    where: { companyId: user.companyId as number, status: "ACTIVE" },
  });
  const materialTypes = materials.map((m) => m.name);

  return (
    <div className="container">
      <h1 className="page-title">{"محطة الحرس"}</h1>

      <GuardDashboard
        vehicles={vehicles}
        materials={materialTypes}
        canRegisterMaterials={dbUser?.canRegisterMaterials || false}
        lang={lang}
      />
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
