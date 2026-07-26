import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { FileShareClient } from "@/app/system/manager/network/share/FileShareClient";
import { redirect } from "next/navigation";

export default async function AccountantFileSharePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const resolvedCompanyId = user.companyId || 1;

  const sharedFiles = await prisma.localFileShare.findMany({
    where: { companyId: resolvedCompanyId, scope: "accountant" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <FileShareClient
      companyId={resolvedCompanyId}
      scope="accountant"
      initialFiles={sharedFiles}
      userName={user.name}
      backUrl="/system/accountant"
      sectionLabel="العودة للحسابات"
    />
  );
}
