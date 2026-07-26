import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import UserCabinet from "@/app/admin/users/UserCabinet";
import { getCurrentRole, ExtendedUser, getCurrentUser } from "@/lib/auth";
import { User, AuditLog } from "@prisma/client";

type AuditLogWithUser = AuditLog & {
  User: User;
};

export default async function ManagerUsersPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const t = dictionary[lang];

  let users: User[] = [];
  let auditLogs: AuditLogWithUser[] = [];

  // Get current user first
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return <div className="p-8 text-rose-500 font-bold">Unauthorized</div>;
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      company: true,
      memberships: {
        include: { role: true },
      },
    },
  });

  if (!currentUser) {
    return <div className="p-8 text-rose-500 font-bold">Unauthorized</div>;
  }

  const role = await getCurrentRole();

  try {
    const whereFilter: any = {
      companyId: currentUser.companyId,
    };

    if (role === "COMPANY_ADMIN" || role === "MANAGER") {
      // Company Admin/Manager only sees manager roles and the operator
      whereFilter.memberships = {
        some: {
          role: {
            name: {
              in: [
                "MANAGER",
                "DEPARTMENT_MANAGER",
                "LAB_MANAGER",
                "SALES_MANAGER",
                "OPERATOR",
              ],
            },
          },
        },
      };
    } else {
      // Other managers see users in their department or created by them
      const userDeptId =
        currentUser.departmentId ||
        currentUser.memberships?.[0]?.role?.departmentId ||
        null;
      whereFilter.OR = [
        { departmentId: userDeptId },
        { createdById: currentUser.id },
      ];
    }

    // Filter by company and creator (hierarchical)
    users = (await prisma.user.findMany({
      where: whereFilter,
      orderBy: { id: "desc" },
      include: {
        memberships: {
          include: { company: true, role: true },
        },
      },
    })) as any;

    auditLogs = (await prisma.auditLog.findMany({
      where: {
        entity: "User",
        companyId: currentUser.companyId,
        user: whereFilter, // Only see logs for visible users
      },
      take: 10,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          include: {
            memberships: {
              include: { role: true },
            },
          },
        },
      },
    })) as any;
  } catch (e) {
    console.error("Users/Logs fetch error:", e);
  }

  // Convert Prisma User to ExtendedUser format
  const extendedUsers: (ExtendedUser & { memberships: any[] })[] = users.map(
    (user: any) => ({
      ...user,
      role: user.memberships?.[0]?.role?.name || "OPERATOR",
      status: user.status as "ACTIVE" | "DISABLED",
      memberships: user.memberships || [],
    }),
  );

  const extendedAuditLogs = auditLogs.map((log: any) => ({
    ...log,
    user: {
      ...log.user,
      role: log.user?.memberships?.[0]?.role?.name || "OPERATOR",
      status: log.user?.status as "ACTIVE" | "DISABLED",
      memberships: log.user?.memberships || [],
    },
  }));

  return (
    <UserCabinet
      initialUsers={extendedUsers}
      auditLogs={extendedAuditLogs}
      lang={lang}
      translations={t.common}
      currentUserRole={role || "MANAGER"}
      currentUserId={currentUser?.id || 0}
      companies={
        currentUser?.company
          ? [
              {
                id: currentUser.company.id,
                name: currentUser.company.name,
                slug: currentUser.company.slug,
              },
            ]
          : []
      }
      companySlug={currentUser?.company?.slug || undefined}
    />
  );
}
