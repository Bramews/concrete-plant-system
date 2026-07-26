import { getSovereignData } from "@/app/actions/sovereignty";
import { SovereignView } from "@/components/sovereignty/SovereignView";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SovereigntyPage() {
  // Strict Enforcement: Only SYSTEM_OWNER can enter this layer
  await requireRole(["SYSTEM_OWNER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  const data = await getSovereignData();
  const changeRequests = await (prisma as any).changeRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-[#020617]">
      <SovereignView
        data={{
          ...data,
          changeRequests,
        }}
      />
    </div>
  );
}
