import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { FileShareClient } from "@/app/system/manager/network/share/FileShareClient";
import { redirect } from "next/navigation";

export default async function SalesFileSharePage() {
  await requireRole(["SALES", "SALES_REP", "SALES_MANAGER", "COMPANY_ADMIN"]);
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const resolvedCompanyId = user.companyId || 1;

  const sharedFiles = await prisma.localFileShare.findMany({
    where: { companyId: resolvedCompanyId, scope: "sales" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <FileShareClient
      companyId={resolvedCompanyId}
      scope="sales"
      initialFiles={sharedFiles}
      userName={user.name}
      backUrl="/system/sales"
      sectionLabel="العودة للمبيعات"
    />
  );
}
