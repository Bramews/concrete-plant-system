"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { AuditLog, User, Company } from "@prisma/client";
import { DictionaryType } from "@/lib/dictionary";

type ExtendedLog = AuditLog & {
  user?: {
    name: string;
    email: string;
    company: {
      name: string;
    } | null;
  } | null;
};

export function LogsViewer({
  logs,
  companies,
  dict,
  lang = "ar",
}: {
  logs: ExtendedLog[];
  companies: Company[];
  dict: DictionaryType;
  lang?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [companyId, setCompanyId] = useState(
    searchParams.get("companyId") || "",
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      const timer = setTimeout(() => {
        setMounted(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const translateAction = (action: string) => {
    const map: Record<string, string> = {
      CREATE: dict.admin?.logs?.actions?.create || "إنشاء",
      UPDATE: dict.admin?.logs?.actions?.update || "تحديث",
      DELETE: dict.admin?.logs?.actions?.delete || "حذف",
      LOGIN: dict.admin?.logs?.actions?.login || "تسجيل دخول",
      LOGOUT: dict.admin?.logs?.actions?.logout || "تسجيل خروج",
      SUSPEND: dict.admin?.logs?.actions?.suspend || "تجميد",
      ACTIVATE: dict.admin?.logs?.actions?.activate || "تفعيل",
    };
    // Handle composed actions like USER_CREATE if needed, or just exact matches
    return map[action] || action;
  };

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    if (companyId) params.set("companyId", companyId);
    else params.delete("companyId");
    router.push(`${pathname}?${params.toString()}`);
  };

  const translateDetails = (details: string | null) => {
    if (!details) return "-";
    if (lang === "ar") {
      // Simple heuristic for Arabic
      return details
        .replace(/User/g, "المستخدم")
        .replace(/logged in securely/g, "سجل دخول بآمان")
        .replace(/Created new user/g, "تم إنشاء مستخدم جديد")
        .replace(/Updated user/g, "تم تحديث بيانات المستخدم")
        .replace(/Deleted user/g, "تم حذف المستخدم")
        .replace(/Successfully impersonated/g, "تم تقمص الشخصية بنجاح");
    }
    return details;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-slate-900/50 p-4 rounded-lg border border-white/5">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-bold text-slate-400 mb-1 block">
            {dict.admin.logs.search_placeholder}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder={
                dict.admin.logs.search_actions || "Search actions..."
              }
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm w-full text-white"
              title={dict.admin.logs.search_actions || "Search actions..."}
            />
          </div>
        </div>

        <div className="w-[200px]">
          <label className="text-sm font-bold text-slate-400 mb-1 block">
            {dict.admin.logs.company}
          </label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm w-full text-white"
            title={dict.admin.logs.filter_company || "Filter by company"}
          >
            <option value="">{dict.admin.logs.filter_company}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleFilter}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Icons.Search className="w-4 h-4" />
            {dict.common.search || "Search"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-900/20">
        <table className="w-full text-sm text-center">
          <thead className="text-sm font-bold text-slate-400 uppercase bg-slate-950/50 border-b border-white/5">
            <tr>
              <th className="px-4 py-3 text-start">
                {dict.admin.logs.table.time}
              </th>
              <th className="px-4 py-3">{dict.admin.logs.table.action}</th>
              <th className="px-4 py-3">{dict.admin.logs.table.user}</th>
              <th className="px-4 py-3">{dict.admin.logs.table.context}</th>
              <th className="px-4 py-3 text-start">
                {dict.admin.logs.table.details}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-sm font-bold font-mono text-start">
                  {mounted
                    ? new Date(log.timestamp).toLocaleString("ar-u-nu-latn")
                    : "..."}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded ${
                      log.action.includes("DELETE") ||
                      log.action.includes("REVOKE")
                        ? "bg-red-500/10 text-red-400"
                        : log.action.includes("CREATE") ||
                            log.action.includes("GRANT")
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {translateAction(log.action)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-white">
                      {log.user?.name || "النظام"}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      {(dict.common.roles as any)[log.role] || log.role}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {log.user?.company?.name || "على مستوى النظام"}
                </td>
                <td
                  className="px-4 py-3 text-slate-300 max-w-md truncate text-start"
                  title={log.details || ""}
                >
                  {translateDetails(log.details)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  {dict.common.no_results}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
