"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Search,
  Filter,
  User as UserIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getAuditLogs } from "@/app/actions/audit";
import { ExportUtils } from "@/lib/export-utils";

/**
 * ActivityLogClient
 * Provides a high-fidelity interface for monitoring system-wide actions.
 */
export function ActivityLogClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(page);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  const handleExport = () => {
    ExportUtils.toExcel(
      logs,
      [
        { header: "التوقيت", key: "timestamp" },
        { header: "المستخدم", key: "userName" },
        { header: "الإجراء", key: "action" },
        { header: "الجهة", key: "entity" },
        { header: "التفاصيل", key: "details" },
      ],
      { filename: `Audit_Log_${new Date().toISOString()}`, rtl: true },
    );
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.entity.toLowerCase().includes(filter.toLowerCase()) ||
      log.details?.toLowerCase().includes(filter.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              سجل النشاطات
            </h1>
            <p className="text-slate-500 text-sm">
              مراقبة وتدقيق كافة التغييرات والعمليات الحساسة في النظام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-medium border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="البحث في السجلات..."
              className="pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "إجمالي السجلات",
            value: total,
            icon: <Activity className="w-4 h-4" />,
            color: "text-blue-500",
          },
          {
            label: "سجلات اليوم",
            value: loading ? "..." : logs.length,
            icon: <Clock className="w-4 h-4" />,
            color: "text-amber-500",
          },
          {
            label: "المسؤولون النشطون",
            value: "3",
            icon: <UserIcon className="w-4 h-4" />,
            color: "text-emerald-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">
                {stat.label}
              </p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
            <div
              className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-950 ${stat.color}`}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                التوقيت
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                المستخدم
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                الإجراء
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                الكيان
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                التفاصيل
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-400">
                    {format(new Date(log.timestamp), "yyyy/MM/dd HH:mm", {
                      locale: ar,
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500">
                        {log.user?.name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {log.user?.name || "مستخدم محذوف"}
                        </p>
                        {log.user?.username && (
                          <p className="text-sm font-bold text-slate-500">
                            @{log.user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded inline-block ${
                        log.action.includes("DELETE")
                          ? "bg-red-50 text-red-600 dark:bg-red-950/20"
                          : log.action.includes("CREATE")
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/20"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[300px] truncate group-hover:whitespace-normal">
                    {log.details}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-emerald-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span className="text-sm font-bold">SUCCESS</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <AlertCircle className="w-12 h-12 opacity-20" />
                    <p>لا توجد سجلات مطابقة للبحث</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-500">
            العرض {(page - 1) * 50 + 1} إلى {Math.min(page * 50, total)} من أصل{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 px-4 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold">
              صفحة {page}
            </div>
            <button
              disabled={page * 50 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
