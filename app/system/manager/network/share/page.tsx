import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { FileShareClient } from "./FileShareClient";
import { redirect } from "next/navigation";

export default async function FileSharePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const resolvedCompanyId = user.companyId || 1;

  const sharedFiles = await prisma.localFileShare.findMany({
    where: { companyId: resolvedCompanyId, scope: "manager" },
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
      scope="manager"
      initialFiles={sharedFiles}
      userName={user.name}
      users={users}
      isManager={isManager}
    />
  );
}
