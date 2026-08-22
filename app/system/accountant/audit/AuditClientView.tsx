"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface AuditRecord {
  id: number;
  companyId: number;
  userId: number | null;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  oldSnapshot: string | null;
  newSnapshot: string | null;
  reason: string;
  ipAddress: string | null;
  checksum: string | null;
  timestamp: Date | string;
}

interface AuditClientViewProps {
  initialRecords: AuditRecord[];
  totalCount: number;
  companyId: number;
  userRole: string;
}

export function AuditClientView({
  initialRecords,
  totalCount,
}: AuditClientViewProps) {
  const [records] = useState<AuditRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INVOICE_STATUS_CHANGE":
        return { label: "تغيير حالة فاتورة", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "PERIOD_LOCK":
        return { label: "إقفال فترة مالية", color: "bg-red-500/20 text-red-400 border-red-500/30" };
      case "PERIOD_UNLOCK":
        return { label: "فك قفل فترة مالية", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "EXPENSE_DELETE":
        return { label: "حذف مصروف", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
      case "VOUCHER_CANCEL":
        return { label: "إلغاء سند", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      default:
        return { label: action, color: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case "Invoice":
        return "فاتورة مبيعات";
      case "FinancialPeriod":
        return "فترة مالية";
      case "Expense":
        return "مصروف تشغيلي";
      case "LedgerEntry":
        return "قيد محاسبي";
      case "Payroll":
        return "راتب موظف";
      default:
        return type;
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEntity =
      selectedEntity === "ALL" || rec.entityType === selectedEntity;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white">
                سجل الرقابة المالي السيادي غير القابل للتعديل
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                توثيق رقابي مشفر ومحمي ببصمة رقمية لكافة التعديلات والإلغاءات المالية في النظام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 border border-emerald-500/30 rounded-xl px-4 py-2 text-xs font-black text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>سجل غير قابل للتعديل (Immutable Ledger)</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرقم، المستخدم، أو السبب..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { id: "ALL", label: "الكل" },
            { id: "Invoice", label: "الفواتير" },
            { id: "FinancialPeriod", label: "الفترات المالية" },
            { id: "Expense", label: "المصروفات" },
            { id: "LedgerEntry", label: "القيود" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedEntity(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedEntity === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-950 border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5 uppercase font-black text-[10px]">
              <tr>
                <th className="p-4">النوع والمعاملة</th>
                <th className="p-4">الإجراء</th>
                <th className="p-4">المستخدم</th>
                <th className="p-4">السبب المسجل</th>
                <th className="p-4">التوقيت</th>
                <th className="p-4">البصمة الرقمية (SHA-256)</th>
                <th className="p-4 text-center">اللقطة (Snapshot)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                    لا توجد سجلات رقابية مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const badge = getActionBadge(rec.action);
                  const isExpanded = expandedId === rec.id;

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">
                              {getEntityLabel(rec.entityType)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              #{rec.entityId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.username}</span>
                        </div>
                        {rec.ipAddress && (
                          <div className="text-[9px] text-slate-500 font-mono">
                            IP: {rec.ipAddress}
                          </div>
                        )}
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="text-slate-300 line-clamp-2">
                          {rec.reason || "—"}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {format(new Date(rec.timestamp), "yyyy/MM/dd HH:mm:ss")}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        {rec.checksum ? (
                          <div
                            className="font-mono text-[9px] text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-1 rounded max-w-[140px] truncate"
                            title={rec.checksum}
                          >
                            {rec.checksum}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {(rec.oldSnapshot || rec.newSnapshot) ? (
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : rec.id)
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1 mx-auto"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isExpanded ? "إخفاء" : "عرض الفروقات"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Diff Viewer Modal or Card */}
      {expandedId && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>لقطة البيانات قبل وبعد التعديل (Data Snapshot Diff)</span>
            </h3>
            <button
              onClick={() => setExpandedId(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              إغلاق
            </button>
          </div>

          {(() => {
            const rec = records.find((r) => r.id === expandedId);
            if (!rec) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 border border-red-500/20 rounded-xl p-4 space-y-2">
                  <div className="text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>البيانات السابقة (Before):</span>
                  </div>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {rec.oldSnapshot
                      ? JSON.stringify(JSON.parse(rec.oldSnapshot), null, 2)
                      : "لا توجد بيانات سابقة"}
                  </pre>
                </div>

                <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>البيانات الجديدة (After):</span>
                  </div>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {rec.newSnapshot
                      ? JSON.stringify(JSON.parse(rec.newSnapshot), null, 2)
                      : "لا توجد بيانات جديدة"}
                  </pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
