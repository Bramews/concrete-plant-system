import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";
import { Icons } from "@/components/ui/Icons";
import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";

async function getApprovedMixDesigns() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  return prisma.mixDesign.findMany({
    where: { companyId: user.companyId, status: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}

async function getApprovedCubeTests() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  const tests = await prisma.cubeTest.findMany({
    where: { order: { companyId: user.companyId }, status: "APPROVED" },
    include: { order: { include: { mixDesign: true } } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return tests.map((t) => ({
    ...t,
    order: t.order
      ? {
          ...t.order,
          mixDesign: t.order.mixDesign,
        }
      : null,
  })) as any;
}

export default async function LabArchivePage() {
  // Fetch data
  const mixDesigns = (await getApprovedMixDesigns()) || [];
  const cubeTests = (await getApprovedCubeTests()) || [];

  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Icons.FileText className="w-5 h-5" />{" "}
          {dict.lab.archive.recent_actions}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* APPROVED MIXES */}
          <div className="border rounded-xl p-4 bg-muted/10">
            <h3 className="font-bold text-sm uppercase text-muted-foreground mb-4">
              {dict.lab.archive.mix_designs}
            </h3>
            <ul className="space-y-2">
              {mixDesigns.map((mix) => (
                <li
                  key={mix.id}
                  className="bg-card p-3 rounded-lg border border-border flex justify-between items-center text-sm"
                >
                  <div>
                    <div className="font-bold font-mono text-primary">
                      {mix.code}
                    </div>
                    <div className="text-sm font-bold text-muted-foreground">
                      {mix.name}
                    </div>
                  </div>
                  <div className="text-sm font-bold font-mono">
                    {format(mix.updatedAt, "dd/MM/yyyy")}
                  </div>
                </li>
              ))}
              {mixDesigns.length === 0 && (
                <li className="text-muted-foreground text-sm italic">
                  {dict.lab.archive.no_mixes}
                </li>
              )}
            </ul>
          </div>

          {/* APPROVED TESTS */}
          <div className="border rounded-xl p-4 bg-muted/10">
            <h3 className="font-bold text-sm uppercase text-muted-foreground mb-4">
              {dict.lab.archive.cube_results}
            </h3>
            <ul className="space-y-2">
              {cubeTests.map((test: any) => (
                <li
                  key={test.id}
                  className="bg-card p-3 rounded-lg border border-border flex justify-between items-center text-sm"
                >
                  <div>
                    <div className="font-bold flex gap-2">
                      <span>{test.mpa} MPa</span>
                      <span
                        className={
                          test.result === "PASS"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {test.result}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-muted-foreground">
                      Order #{test.orderId} • {test.age} Days
                    </div>
                  </div>
                  <div className="text-sm font-bold font-mono">
                    {format(test.updatedAt, "dd/MM/yyyy")}
                  </div>
                </li>
              ))}
              {cubeTests.length === 0 && (
                <li className="text-muted-foreground text-sm italic">
                  {dict.lab.archive.no_tests}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
