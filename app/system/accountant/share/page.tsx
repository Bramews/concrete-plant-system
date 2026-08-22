import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { FileShareClient } from "@/app/system/manager/network/share/FileShareClient";
import { redirect } from "next/navigation";

export default async function AccountantFileSharePage() {
  await requireRole(["ACCOUNTANT", "MANAGER", "SYSTEM_OWNER"]);

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة
      </div>
    );
  }

  const sharedFiles = await prisma.localFileShare.findMany({
    where: { companyId: user.companyId, scope: "accountant" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-2 md:p-6 space-y-6 animate-fade-in">
      <FileShareClient
        companyId={user.companyId}
        scope="accountant"
        initialFiles={sharedFiles}
        userName={user.name}
        backUrl="/system/accountant/invoices"
        sectionLabel="العودة للحسابات"
      />
    </div>
  );
}

