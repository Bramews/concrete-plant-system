import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SieveAnalysisClient from "./SieveAnalysisClient";
import SieveDashboard from "@/components/lab/SieveDashboard";
import SieveArchive from "@/components/lab/SieveArchive";
import SieveSettingsWrapper from "./SieveSettingsWrapper";
import { getSieveTests } from "@/app/actions/lab";
import { getSieveStandards } from "@/app/actions/sieve-standards";

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function SieveAnalysisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const view = searchParams.view;

  const user = await getCurrentUser();
  if (!user || !user.companyId) return <div>Unauthorized</div>;

  // Initial data loading
  const [materials, tests, branding, standardsResponse] = await Promise.all([
    prisma.material.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    getSieveTests(),
    prisma.companyBranding.findUnique({
      where: { companyId: user.companyId },
    }),
    getSieveStandards(),
  ]);

  const standards = Array.isArray(standardsResponse)
    ? standardsResponse
    : standardsResponse &&
        (standardsResponse as any).success &&
        Array.isArray((standardsResponse as any).data)
      ? (standardsResponse as any).data
      : [];

  // Dashboard Stats
  const stats = {
    totalTests: tests.length,
    pendingTests: 0,
    lastFM:
      tests.length > 0 ? (tests[0] as any).finenessModulus || "0.00" : "0.00",
  };

  const { getCurrentLanguage } = await import("@/lib/locale");
  const lang = await getCurrentLanguage();

  if (view === "add") {
    return (
      <SieveAnalysisClient
        initialTests={tests}
        branding={branding}
        lang={lang}
      />
    );
  }

  if (view === "archive") {
    return <SieveArchive tests={tests} />;
  }

  if (view === "settings") {
    return (
      <div className="w-full h-full relative">
        <SieveDashboard stats={stats} />
        <SieveSettingsWrapper standards={standards} materials={materials} />
      </div>
    );
  }

  // Fallback to Dashboard
  return <SieveDashboard stats={stats} />;
}
