import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import Link from "next/link";

export default async function SalesProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["SALES", "SALES_REP", "SALES_MANAGER", "COMPANY_ADMIN"]);

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const companyId = user?.companyId || 1;

  const resolvedSearchParams = await searchParams;
  const customerIdParam = resolvedSearchParams?.customerId;
  const customerId = customerIdParam
    ? parseInt(customerIdParam as string)
    : undefined;

  const projects = await prisma.project.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(customerId
        ? { orders: { some: { customerId, deletedAt: null } } }
        : {}),
    },
    include: {
      _count: { select: { orders: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const totalOrders = projects.reduce((acc, p) => acc + p._count.orders, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-1">
      {/* ━━━ Hero Header ━━━ */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-card/30 border border-white/5 p-10 shadow-2xl backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              {isRtl ? "إدارة المشاريع" : "Projects Management"}
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              {isRtl
                ? `${projects.length} مشروع • ${activeCount} نشط • ${totalOrders} طلب مرتبط`
                : `${projects.length} projects • ${activeCount} active • ${totalOrders} linked orders`}
            </p>
          </div>
        </div>
      </div>

      {/* ━━━ Projects Grid ━━━ */}
      {projects.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-16 text-center backdrop-blur-sm">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-4 text-slate-700"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <p className="text-slate-400 font-bold">
            {isRtl ? "لا توجد مشاريع بعد" : "No projects yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isActive = project.status === "ACTIVE";
            return (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-[2rem] bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-7 transition-all duration-500"
              >
                {/* Gradient hover background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${isActive ? "from-emerald-500 to-teal-500" : "from-slate-500 to-zinc-500"} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${isActive ? "from-emerald-500 to-teal-500" : "from-slate-600 to-zinc-600"} shadow-lg`}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2"
                          y="7"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {isActive
                        ? isRtl
                          ? "نشط"
                          : "Active"
                        : isRtl
                          ? "متوقف"
                          : "Inactive"}
                    </span>
                  </div>

                  {/* Project name */}
                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-white/95 transition-colors truncate">
                    {project.name}
                  </h3>

                  {/* Location */}
                  {project.location && (
                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5 truncate">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="flex-shrink-0"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {project.location}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-indigo-400"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-bold text-slate-300">
                        {project._count.orders}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {isRtl ? "طلب" : "orders"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-slate-600"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-slate-500 text-xs">
                        {project.createdAt.toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
