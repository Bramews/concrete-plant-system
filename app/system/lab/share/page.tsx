import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { FileShareClient } from "@/app/system/manager/network/share/FileShareClient";
import { redirect } from "next/navigation";

export default async function LabFileSharePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const resolvedCompanyId = user.companyId || 1;

  const sharedFiles = await prisma.localFileShare.findMany({
    where: { companyId: resolvedCompanyId, scope: "lab" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const users = await prisma.user.findMany({
    where: { companyId: resolvedCompanyId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const isManager = [
    "SYSTEM_OWNER",
    "COMPANY_ADMIN",
    "DEPARTMENT_MANAGER",
    "MANAGER",
    "LAB_MANAGER",
  ].includes(user.role);

  return (
    <FileShareClient
      companyId={resolvedCompanyId}
      scope="lab"
      initialFiles={sharedFiles}
      userName={user.name}
      backUrl="/system/lab"
      sectionLabel="العودة للمختبر"
      users={users}
      isManager={isManager}
    />
  );
}
