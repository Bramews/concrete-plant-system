import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import UserCabinet from "./UserCabinet";
import { ExtendedUser } from "@/lib/auth";
import { User, AuditLog } from "@prisma/client";

type AuditLogWithUser = AuditLog & {
  user:
    | (User & {
        memberships?: Array<{
          role: {
            name: string;
          } | null;
        }>;
      })
    | null;
};

type UserWithMemberships = User & {
  memberships?: Array<{
    role: {
      name: string;
    } | null;
  }>;
};

export default async function UsersPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];

  let users: UserWithMemberships[] = [];
  let auditLogs: AuditLogWithUser[] = [];
  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: { company: true, role: true },
        },
      },
    });
    auditLogs = await prisma.auditLog.findMany({
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
    });
  } catch (e) {
    console.error("Users/Logs fetch error:", e);
  }

  // ... inside component
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  const role = session?.role || null;
  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        include: { company: true },
      })
    : null;

  // Convert Prisma User to ExtendedUser format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extendedUsers: (ExtendedUser & {
    memberships: any[];
  })[] = users.map((user) => ({
    ...user,
    role: user.memberships?.[0]?.role?.name || "OPERATOR",
    status: user.status as "ACTIVE" | "DISABLED",
    memberships: user.memberships || [],
  }));

  const extendedAuditLogs = auditLogs.map((log) => ({
    ...log,
    user: log.user
      ? {
          ...log.user,
          role: log.user.memberships?.[0]?.role?.name || "OPERATOR",
          status: log.user.status as "ACTIVE" | "DISABLED",
        }
      : null,
  }));

  let companies: { id: number; name: string; slug: string }[] = [];
  try {
    companies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true },
    });
  } catch (e) {
    console.error("Companies fetch error", e);
  }

  return (
    <UserCabinet
      initialUsers={extendedUsers}
      auditLogs={extendedAuditLogs}
      lang={lang}
      translations={{
        ...t.admin.users,
        roles: t.common.roles,
        na: t.common.na,
      }}
      currentUserRole={role || "OPERATOR"}
      currentUserId={currentUser?.id || 0}
      companies={companies}
      companySlug={currentUser?.company?.slug || undefined}
    />
  );
}
