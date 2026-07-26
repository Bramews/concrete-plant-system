"use client";

import { useState, useEffect } from "react";
import {
  rollbackToLedgerPoint,
  rollforwardToLedgerPoint,
  setupDatabaseTriggers,
  getLedgerList,
  verifyLedgerChain,
  simulateTimeTravel,
  archiveOldLedger,
} from "@/app/actions/ledger";
import {
  Clock,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Terminal,
  Search,
  ChevronLeft,
  HelpCircle,
  ShieldAlert,
  Play,
  ArrowLeftRight,
  Archive,
  Calendar,
  HelpCircle as HelpIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LedgerLog {
  id: number;
  timestamp: string;
  tableName: string;
  recordId: string;
  actionType: string;
  oldValues: string | null;
  newValues: string | null;
  changedColumns: string | null;
  userId: number | null;
  sessionId: string | null;
  sourceType: string;
  sourceMachine: string | null;
  sourceIp: string | null;
  checksum: string | null;
  hashChain: string | null;
}

interface LedgerManagementClientProps {
  dict: any;
  initialLogs: LedgerLog[];
  initialChainStatus: {
    status: string;
    corruptedCount: number;
  };
  currentLedgerId: number;
}

export function LedgerManagementClient({
  dict,
  initialLogs,
  initialChainStatus,
  currentLedgerId: initialCurrentLedgerId,
}: LedgerManagementClientProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<LedgerLog[]>(initialLogs);
  const [chainStatus, setChainStatus] = useState(initialChainStatus);
  const [currentLedgerId, setCurrentLedgerId] = useState(
    initialCurrentLedgerId,
  );
  const [selectedLog, setSelectedLog] = useState<LedgerLog | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  // Execution states
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingUpTriggers, setIsSettingUpTriggers] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMode, setModalMode] = useState<"ROLLBACK" | "ROLLFORWARD">(
    "ROLLBACK",
  );
  const [confirmInput, setConfirmInput] = useState("");
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Archiving State
  const [archiveDate, setArchiveDate] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  // Multi-Point Comparison State
  const [compareMode, setCompareMode] = useState(false);
  const [compareStartId, setCompareStartId] = useState<number | null>(null);
  const [compareEndId, setCompareEndId] = useState<number | null>(null);

  const isSelectedLogFuture = selectedLog
    ? selectedLog.id > currentLedgerId
    : false;

  const refreshLogs = async () => {
    setLoading(true);
    try {
      const res = await getLedgerList({
        tableName: tableFilter || undefined,
        actionType: actionFilter || undefined,
      });
      if (res.success && res.logs) {
        setLogs(
          res.logs.map((log: any) => ({
            ...log,
            timestamp: log.timestamp.toISOString(),
          })),
        );
        if ("currentLedgerId" in res) {
          setCurrentLedgerId((res as any).currentLedgerId);
        }
      }
    } catch {}
    setLoading(false);
  };

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyLedgerChain();
      if (res.success) {
        setChainStatus({
          status: res.status || "SECURE",
          corruptedCount: res.corruptedCount || 0,
        });
        toast.success("اكتمل فحص السلسلة التاريخية: السجل آمن وسليم 🟢");
      } else {
        setChainStatus({
          status: "TAMPERED_ALERT",
          corruptedCount: res.corruptedCount || 1,
        });
        toast.error("تنبيه أمني: تم الكشف عن تلاعب في السجلات القديمة 🔴");
      }
    } catch (e: unknown) {
      toast.error("فشل إتمام عملية الفحص المشفر");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetupTriggers = async () => {
    setIsSettingUpTriggers(true);
    try {
      const res = await setupDatabaseTriggers();
      if (res.success) {
        toast.success("تم تثبيت وتحديث مشغلات تتبع قاعدة البيانات بنجاح 🟢");
        await refreshLogs();
      } else {
        toast.error("فشل تثبيت المشغلات: " + res.error);
      }
    } catch (e: unknown) {
      toast.error("حدث خطأ غير متوقع أثناء تثبيت المشغلات");
    } finally {
      setIsSettingUpTriggers(false);
    }
  };

  const handleArchiveLedger = async () => {
    if (!archiveDate) {
      toast.error("يرجى اختيار تاريخ لبدء الأرشفة");
      return;
    }
    setIsArchiving(true);
    try {
      const res = await archiveOldLedger(archiveDate);
      if (res.success) {
        if (res.count && res.count > 0) {
          toast.success(
            `تمت أرشفة وضغط ${res.count} سجلات بنجاح وحفظها كملف: ${res.filename} 📦`,
          );
        } else {
          toast.info(res.message || "لا توجد سجلات مؤرشفة قبل هذا التاريخ.");
        }
        await refreshLogs();
      } else {
        toast.error("فشل الأرشفة: " + res.error);
      }
    } catch (e: unknown) {
      toast.error("حدث خطأ أثناء أرشفة السجلات القديمة");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleActionClick = async (mode: "ROLLBACK" | "ROLLFORWARD") => {
    if (!selectedLog) return;
    setModalMode(mode);
    setConfirmInput("");
    setDryRunResult(null);
    setShowConfirmModal(true);
    setIsSimulating(true);

    try {
      const res = await simulateTimeTravel(selectedLog.id, mode);
      if (res.success) {
        setDryRunResult(res);
      } else {
        toast.error("فشل توليد محاكاة التأثير: " + res.error);
      }
    } catch {
      toast.error("فشل محاكاة التغييرات");
    } finally {
      setIsSimulating(false);
    }
  };

  const executeAction = async () => {
    if (!selectedLog) return;

    const requiredConfirmation =
      modalMode === "ROLLBACK" ? "تأكيد التراجع" : "تأكيد التقدم";
    if (confirmInput !== requiredConfirmation) {
      toast.error("يرجى كتابة جملة التأكيد بشكل صحيح");
      return;
    }

    setLoading(true);
    setShowConfirmModal(false);
    setConfirmInput("");

    try {
      let res;
      if (modalMode === "ROLLBACK") {
        res = await rollbackToLedgerPoint(selectedLog.id);
      } else {
        res = await rollforwardToLedgerPoint(selectedLog.id);
      }

      if (res.success) {
        toast.success(
          modalMode === "ROLLBACK"
            ? `تم التراجع بالنظام بنجاح إلى ما قبل الخطوة #${selectedLog.id} 🟢`
            : `تم التقدم وتطبيق الخطوات بالنظام بنجاح حتى الخطوة #${selectedLog.id} 🟢`,
        );
        setSelectedLog(null);
        router.refresh();
        await refreshLogs();
      } else {
        toast.error(res.error || "فشل تنفيذ العملية التاريخية");
      }
    } catch (e: unknown) {
      toast.error("حدث خطأ غير متوقع أثناء العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleLogClick = (log: LedgerLog) => {
    if (compareMode) {
      if (compareStartId === null) {
        setCompareStartId(log.id);
      } else if (compareEndId === null) {
        if (log.id < compareStartId) {
          setCompareEndId(compareStartId);
          setCompareStartId(log.id);
        } else {
          setCompareEndId(log.id);
        }
      } else {
        setCompareStartId(log.id);
        setCompareEndId(null);
      }
    } else {
      setSelectedLog(log);
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recordId.includes(searchQuery) ||
      log.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.newValues && log.newValues.includes(searchQuery)) ||
      (log.oldValues && log.oldValues.includes(searchQuery));

    const matchesTable = tableFilter ? log.tableName === tableFilter : true;
    const matchesAction = actionFilter ? log.actionType === actionFilter : true;

    return matchesSearch && matchesTable && matchesAction;
  });

  // Helper to parse JSON values safely
  const parseJson = (str: string | null) => {
    if (!str) return {};
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  };

  // Render Diff side-by-side
  const renderDiff = (log: LedgerLog) => {
    const oldVal = parseJson(log.oldValues);
    const newVal = parseJson(log.newValues);

    const allKeys = Array.from(
      new Set([...Object.keys(oldVal), ...Object.keys(newVal)]),
    ).filter((k) => k !== "createdAt" && k !== "updatedAt");

    return (
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/60 text-sm font-bold font-mono leading-relaxed">
        <div className="grid grid-cols-2 bg-slate-900 px-4 py-3 border-b border-white/10 text-slate-300 font-bold text-sm">
          <div>القيم التاريخية السابقة (Old Values)</div>
          <div>القيم الجديدة الناتجة (New Values)</div>
        </div>
        <div className="divide-y divide-white/5">
          {allKeys.map((key) => {
            const hasOld = key in oldVal;
            const hasNew = key in newVal;
            const valOld = oldVal[key];
            const valNew = newVal[key];
            const isDifferent =
              JSON.stringify(valOld) !== JSON.stringify(valNew);

            let oldClass = "text-slate-300";
            let newClass = "text-slate-300";

            if (isDifferent) {
              oldClass = "text-rose-400 bg-rose-500/10 font-bold";
              newClass = "text-emerald-400 bg-emerald-500/10 font-bold";
            } else if (!hasOld) {
              newClass = "text-emerald-400 font-bold";
            } else if (!hasNew) {
              oldClass = "text-rose-400 font-bold";
            }

            return (
              <div
                key={key}
                className="grid grid-cols-2 px-4 py-2.5 hover:bg-white/[0.02]"
              >
                <div className={`p-1.5 rounded break-all ${oldClass}`}>
                  <span className="text-slate-400 mr-1 font-semibold">
                    {key}:
                  </span>
                  {hasOld ? String(valOld) : "—"}
                </div>
                <div
                  className={`p-1.5 rounded break-all border-r border-white/5 ${newClass}`}
                >
                  <span className="text-slate-400 mr-1 font-semibold">
                    {key}:
                  </span>
                  {hasNew ? String(valNew) : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Compute Multi-Point combined net diff
  const getCombinedDiffData = () => {
    if (compareStartId === null || compareEndId === null) return [];

    // Get logs in chronological order between start and end (inclusive)
    const rangeLogs = logs
      .filter((l) => l.id >= compareStartId && l.id <= compareEndId)
      .sort((a, b) => a.id - b.id);

    const recordGroups: Record<
      string,
      { tableName: string; recordId: string; logs: LedgerLog[] }
    > = {};
    for (const log of rangeLogs) {
      const key = `${log.tableName}:${log.recordId}`;
      if (!recordGroups[key]) {
        recordGroups[key] = {
          tableName: log.tableName,
          recordId: log.recordId,
          logs: [],
        };
      }
      recordGroups[key].logs.push(log);
    }

    const diffs: Array<{
      tableName: string;
      recordId: string;
      oldValues: string | null;
      newValues: string | null;
    }> = [];

    for (const key of Object.keys(recordGroups)) {
      const group = recordGroups[key];
      const oldestLog = group.logs[0];
      const newestLog = group.logs[group.logs.length - 1];

      // Net change calculation: oldest oldValues -> newest newValues
      diffs.push({
        tableName: group.tableName,
        recordId: group.recordId,
        oldValues: oldestLog.oldValues,
        newValues: newestLog.newValues,
      });
    }

    return diffs;
  };

  const combinedDiffs = getCombinedDiffData();

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start md:items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400 shrink-0 mt-1 md:mt-0" />
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-normal md:leading-relaxed">
                مركز السجل الزمني والتحكم التاريخي للنظام
              </h1>
              <bdi className="font-sans text-xl md:text-2xl text-slate-300 tracking-wide font-bold">
                (System Time-Travel)
              </bdi>
            </div>
          </div>
          <p className="text-sm md:text-base text-slate-400 font-bold mt-3 leading-relaxed max-w-3xl">
            صندوق أسود متكامل لرصد وتتبع كافة تفاصيل وتغييرات قاعدة البيانات
            والتحكم الزمني بها
          </p>
        </div>

        {/* Security / Chain status display */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${
              chainStatus.status === "SECURE"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
            }`}
          >
            {chainStatus.status === "SECURE" ? (
              <>
                <ShieldCheck className="w-6 h-6" />
                <div className="text-base leading-relaxed">
                  <span className="font-bold block">سلسلة البيانات آمنة</span>
                  <span className="text-sm text-slate-300 block">
                    سجل التغييرات مشفر وسليم 100%
                  </span>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="w-6 h-6 text-rose-500" />
                <div className="text-base leading-relaxed">
                  <span className="font-bold block">تنبيه: تم كشف تلاعب!</span>
                  <span className="text-sm text-slate-300 block">
                    تم تعديل {chainStatus.corruptedCount} سجلات خارجية
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying || loading}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all disabled:opacity-50"
            title="إعادة فحص سلامة التشفير للسلسلة التاريخية"
          >
            <RefreshCw
              className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Advanced Tools Panel: Archive & Comparison Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
        {/* Pruning & Compression Tool */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 leading-relaxed">
              <Archive className="w-5 h-5 text-amber-400" />
              أرشفة وضغط السجلات القديمة
            </h3>
            <p className="text-sm text-slate-400 leading-loose">
              قم بترحيل وضغط السجلات التاريخية القديمة وتفريغ مساحة SQLite مع
              الحفاظ على سلامة تشفير السلسلة.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <input
              type="date"
              value={archiveDate}
              onChange={(e) => setArchiveDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
            />
            <button
              onClick={handleArchiveLedger}
              disabled={isArchiving || !archiveDate}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isArchiving ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              أرشفة وضغط
            </button>
          </div>
        </div>

        {/* Multi-point Comparison Setup */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-100 flex flex-wrap items-center gap-2 leading-relaxed">
              <ArrowLeftRight className="w-5 h-5 text-blue-400 shrink-0" />
              <span>مقارنة لحظتين زمنيتين</span>
              <bdi className="font-sans text-sm text-slate-300 opacity-90">
                (Multi-Point Diff)
              </bdi>
            </h3>
            <p className="text-sm text-slate-400 leading-loose">
              اختر خطوة بداية وخطوة نهاية لحساب التعديلات الصافية بين اللحظتين
              الزمنيتين وعرضها.
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-end md:self-center">
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareStartId(null);
                setCompareEndId(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                compareMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {compareMode ? "تعطيل وضع المقارنة" : "تفعيل وضع المقارنة"}
            </button>
            {compareMode &&
              (compareStartId !== null || compareEndId !== null) && (
                <button
                  onClick={() => {
                    setCompareStartId(null);
                    setCompareEndId(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm transition-all"
                >
                  إعادة تعيين
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Main Grid: List vs Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Logs List & Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث بالمعرف أو قيمة البيانات..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="px-3 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
            >
              <option value="">جميع الجداول</option>
              {[
                "User",
                "Company",
                "Order",
                "MixDesign",
                "CubeTest",
                "SieveAnalysis",
                "LabApproval",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
            >
              <option value="">جميع العمليات</option>
              <option value="INSERT">إضافة (INSERT)</option>
              <option value="UPDATE">تعديل (UPDATE)</option>
              <option value="DELETE">حذف (DELETE)</option>
            </select>
          </div>

          {/* Setup / Sync helper banner when empty */}
          {logs.length === 0 && (
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-8 text-center space-y-4">
              <Database className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  مشغلات التتبع غير مثبتة أو السجل فارغ
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  يتطلب السجل تثبيت مشغلات قاعدة البيانات (Database Triggers)
                  لرصد الحركات والتغيرات التاريخية تلقائياً.
                </p>
              </div>
              <button
                onClick={handleSetupTriggers}
                disabled={isSettingUpTriggers}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {isSettingUpTriggers ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    جاري تثبيت المشغلات...
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" />
                    تثبيت وتهيية مشغلات التتبع بقاعدة البيانات
                  </>
                )}
              </button>
            </div>
          )}

          {/* Logs Table / List */}
          {logs.length > 0 && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              {compareMode && (
                <div className="bg-blue-600/10 border-b border-white/10 px-4 py-3 text-sm text-blue-300 font-bold flex justify-between items-center">
                  <span>
                    وضع مقارنة اللحظات الزمنية نشط. انقر على خطوة البداية ثم
                    خطوة النهاية.
                  </span>
                  <div className="flex gap-2">
                    <span className="bg-slate-950 px-2.5 py-1 rounded text-sm font-bold">
                      البداية:{" "}
                      {compareStartId ? `#${compareStartId}` : "لم يحدد"}
                    </span>
                    <span className="bg-slate-950 px-2.5 py-1 rounded text-sm font-bold">
                      النهاية: {compareEndId ? `#${compareEndId}` : "لم يحدد"}
                    </span>
                  </div>
                </div>
              )}
              <div className="max-h-[600px] overflow-y-auto divide-y divide-white/5 font-sans">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const isFuture = log.id > currentLedgerId;
                  const isCompareStart = compareStartId === log.id;
                  const isCompareEnd = compareEndId === log.id;
                  const isInCompareRange =
                    compareStartId !== null &&
                    compareEndId !== null &&
                    log.id >= compareStartId &&
                    log.id <= compareEndId;

                  return (
                    <button
                      key={log.id}
                      onClick={() => handleLogClick(log)}
                      className={`w-full text-right p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                        isCompareStart || isCompareEnd
                          ? "bg-blue-600/20 border-r-4 border-blue-400"
                          : isInCompareRange
                            ? "bg-blue-600/5 border-r-4 border-blue-900/30"
                            : isSelected
                              ? "bg-blue-600/10 border-r-4 border-blue-500"
                              : isFuture
                                ? "bg-white/[0.01] opacity-60 border-r-4 border-dashed border-slate-700 hover:opacity-80"
                                : "hover:bg-white/[0.02] border-r-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl mt-0.5 ${
                            isCompareStart || isCompareEnd
                              ? "bg-blue-500/20 text-blue-400"
                              : isFuture
                                ? "bg-slate-800 text-slate-400"
                                : log.actionType === "INSERT"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : log.actionType === "DELETE"
                                    ? "bg-rose-500/10 text-rose-400"
                                    : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          <Database className="w-4 h-4" />
                        </div>
                        <div className="text-base min-w-0 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-400 text-sm">
                              #{log.id}
                            </span>
                            <span className="font-black text-white">
                              {log.tableName}
                            </span>
                            <span className="text-sm text-slate-400 font-mono">
                              ID: {log.recordId}
                            </span>
                            {isFuture && (
                              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-sm font-bold border border-blue-500/20">
                                خطوة مسترجعة
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-300 line-clamp-1 leading-relaxed">
                            {log.actionType === "INSERT" && "إدخال سجل جديد"}
                            {log.actionType === "DELETE" && "حذف السجل بالكامل"}
                            {log.actionType === "UPDATE" &&
                              `تعديل الأعمدة: ${log.changedColumns ? JSON.parse(log.changedColumns).filter(Boolean).join(", ") : "غير محدد"}`}
                          </div>
                          <div className="text-sm text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                              <Clock className="w-4 h-4" />{" "}
                              <bdi className="font-sans text-slate-300">
                                {new Date(log.timestamp).toLocaleString(
                                  "en-GB",
                                )}
                              </bdi>
                            </span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                              <Terminal className="w-4 h-4" /> {log.sourceType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <span
                          className={`px-2.5 py-1 rounded text-sm font-bold ${
                            isFuture
                              ? "bg-slate-800 text-slate-400"
                              : log.actionType === "INSERT"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : log.actionType === "DELETE"
                                  ? "bg-rose-500/15 text-rose-400"
                                  : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {log.actionType}
                        </span>
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Inspector / Diff Viewer / Comparison Result */}
        <div className="space-y-4 font-sans">
          {compareMode ? (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2 leading-relaxed">
                  <ArrowLeftRight className="w-6 h-6 text-blue-400" />
                  تحليل مقارنة اللحظات الزمنية المتعددة
                </h3>
                <p className="text-sm text-slate-400 font-bold mt-2 leading-relaxed">
                  يعرض الفروقات الصافية للبيانات من خطوة البداية حتى خطوة
                  النهاية
                </p>
              </div>

              {compareStartId !== null && compareEndId !== null ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>المدى المقارن:</span>
                      <span className="font-bold text-white">
                        من خطوة #{compareStartId} إلى #{compareEndId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الخطوات الزمنية المشمولة:</span>
                      <span className="font-bold text-white">
                        {compareEndId - compareStartId + 1} عمليات
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد السجلات المتأثرة بشكل صافٍ:</span>
                      <span className="font-bold text-blue-400">
                        {combinedDiffs.length} سجلات
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300">
                      التغييرات الصافية في قاعدة البيانات (Combined Net Diff):
                    </h4>

                    {combinedDiffs.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-sm">
                        لا توجد اختلافات صافية (قد تكون التعديلات أعادت القيم
                        لأصلها).
                      </div>
                    ) : (
                      <div className="space-y-4 divide-y divide-white/5">
                        {combinedDiffs.map((diff, idx) => (
                          <div key={idx} className="space-y-2 pt-3 first:pt-0">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-white">
                                {diff.tableName}
                              </span>
                              <span className="text-slate-400 font-mono text-sm font-bold">
                                ID: {diff.recordId}
                              </span>
                            </div>
                            {renderDiff(diff as any)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3 text-slate-400 text-sm">
                  <ArrowLeftRight className="w-10 h-10 mx-auto text-slate-600" />
                  <p>
                    الرجاء النقر واختيار خطوتين زمنيتين من الجدول الزمني لمقارنة
                    الفروقات الصافية بينهما.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-xl font-black text-white leading-relaxed">
                  معاين السجل التاريخي والتحكم
                </h3>
                <p className="text-sm text-slate-400 font-bold mt-2 leading-relaxed">
                  استعرض تفاصيل التغيير وتحكم في الزمن
                </p>
              </div>

              {selectedLog ? (
                <div className="space-y-6 animate-fadeIn">
                  {/* Meta details */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        رقم السجل التاريخي:
                      </span>
                      <span className="text-white font-mono font-bold">
                        #{selectedLog.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        تاريخ وتوقيت العملية:
                      </span>
                      <span className="text-slate-200 font-bold">
                        {new Date(selectedLog.timestamp).toLocaleString(
                          "ar-EG",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الجدول المتأثر:</span>
                      <span className="text-blue-400 font-bold">
                        {selectedLog.tableName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">مصدر تنفيذ الحركة:</span>
                      <span className="text-white font-bold">
                        {selectedLog.sourceType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">حالة خطوة الزمن:</span>
                      <span
                        className={`font-bold ${isSelectedLogFuture ? "text-blue-400" : "text-emerald-400"}`}
                      >
                        {isSelectedLogFuture
                          ? "تم التراجع عنها (في المستقبل)"
                          : "نشطة حالياً (في الماضي)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">حالة الختم المشفر:</span>
                      <span
                        className={`font-bold ${selectedLog.hashChain ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {selectedLog.hashChain ? "مختوم وسليم 🔐" : "غير مختوم"}
                      </span>
                    </div>
                  </div>

                  {/* Diff Viewer Component */}
                  <div className="space-y-2">
                    <span className="text-sm font-bold text-slate-300 block">
                      فروقات البيانات بالتفصيل (Diff):
                    </span>
                    {renderDiff(selectedLog)}
                  </div>

                  {/* Control Action buttons */}
                  <div className="pt-4 border-t border-white/5 space-y-3 font-sans">
                    {isSelectedLogFuture ? (
                      <>
                        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 text-sm font-bold text-blue-200">
                          <Play className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-bold">
                            التقدم بالزمن: سيقوم النظام بإعادة تطبيق هذه الخطوة
                            وكافة الخطوات السابقة لها بالترتيب الزمني الصحيح
                            للوصول لهذه الحالة التاريخية.
                          </p>
                        </div>

                        <button
                          onClick={() => handleActionClick("ROLLFORWARD")}
                          disabled={loading}
                          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4 rotate-180" />
                          إعادة تطبيق والتقدم لهذه الخطوة
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-sm font-bold text-amber-200">
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-medium">
                            التراجع بالزمن: عند التراجع إلى هذه الخطوة، سيقوم
                            النظام بالتراجع عن جميع العمليات اللاحقة لها، مع أخذ
                            نسخة حماية أوتوماتيكية للبيانات الحالية.
                          </p>
                        </div>

                        <button
                          onClick={() => handleActionClick("ROLLBACK")}
                          disabled={loading}
                          className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          إرجاع حالة النظام لهذه النقطة
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3 text-slate-400 text-sm">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-medium">
                    الرجاء النقر على إحدى العمليات في السجل لمشاهدة تحليل
                    التغيرات وخيارات التحكم التاريخي.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom inline Modal for Confirmation (includes Dry-Run Simulation Results) */}
      {showConfirmModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${modalMode === "ROLLBACK" ? "bg-amber-500/10" : "bg-blue-500/10"}`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${modalMode === "ROLLBACK" ? "text-amber-400" : "text-blue-400"}`}
                />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  {modalMode === "ROLLBACK"
                    ? "تأكيد التراجع التاريخي بالنظام"
                    : "تأكيد التقدم التاريخي وإعادة التطبيق"}
                </h4>
                <p className="text-sm font-bold text-slate-400 font-medium">
                  عملية حساسة جداً لقاعدة البيانات
                </p>
              </div>
            </div>

            {/* Dry Run simulation preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-3">
              <span className="text-sm font-bold text-slate-300 block flex items-center gap-2">
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin text-blue-400" : "text-emerald-400"}`}
                />
                تقرير محاكاة التأثير الفعلي (Dry Run Report):
              </span>

              {isSimulating ? (
                <div className="py-3 text-center text-sm text-slate-400">
                  جاري حساب التغييرات المتوقعة بقاعدة البيانات...
                </div>
              ) : dryRunResult ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2 rounded bg-emerald-500/5 text-emerald-400 font-bold border border-emerald-500/10">
                      إضافة: {dryRunResult.totalInserts}
                    </div>
                    <div className="p-2 rounded bg-amber-500/5 text-amber-400 font-bold border border-amber-500/10">
                      تعديل: {dryRunResult.totalUpdates}
                    </div>
                    <div className="p-2 rounded bg-rose-500/5 text-rose-400 font-bold border border-rose-500/10">
                      حذف: {dryRunResult.totalDeletes}
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-300 space-y-1.5">
                    <span className="font-bold text-slate-200">
                      ملخص التأثير حسب الجدول:
                    </span>
                    <ul className="list-disc pr-4 space-y-1">
                      {Object.keys(dryRunResult.summary).map((tbl) => {
                        const sum = dryRunResult.summary[tbl];
                        return (
                          <li key={tbl}>
                            جدول{" "}
                            <span className="text-white font-bold">{tbl}</span>:
                            ({sum.inserts > 0 && `إضافة ${sum.inserts} `}
                            {sum.updates > 0 && `تعديل ${sum.updates} `}
                            {sum.deletes > 0 && `حذف ${sum.deletes} `})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center text-sm text-rose-400 font-medium">
                  تعذر حساب تفاصيل المحاكاة.
                </div>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {modalMode === "ROLLBACK" ? (
                <>
                  أنت على وشك التراجع بوضع قاعدة البيانات بالكامل إلى ما قبل
                  الخطوة{" "}
                  <span className="font-bold text-white font-mono">
                    #{selectedLog.id}
                  </span>
                  . سيقوم السيرفر بإلغاء كافة العمليات التي تمت بعد هذا الوقت
                  بترتيب عكسي آمن.
                </>
              ) : (
                <>
                  أنت على وشك التقدم وإعادة تطبيق كافة العمليات التي تم التراجع
                  عنها سابقاً حتى الخطوة{" "}
                  <span className="font-bold text-white font-mono">
                    #{selectedLog.id}
                  </span>
                  . سيتم تطبيق التغييرات بالترتيب الزمني الصحيح.
                </>
              )}
            </p>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300 block">
                يرجى كتابة العبارة التالية للتأكيد:{" "}
                <span className="text-blue-400 font-bold select-all">
                  {modalMode === "ROLLBACK" ? "تأكيد التراجع" : "تأكيد التقدم"}
                </span>
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="اكتب التوكيد هنا..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInput("");
                  setDryRunResult(null);
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all"
              >
                إلغاء الإجراء
              </button>
              <button
                onClick={executeAction}
                disabled={
                  confirmInput !==
                    (modalMode === "ROLLBACK"
                      ? "تأكيد التراجع"
                      : "تأكيد التقدم") ||
                  loading ||
                  isSimulating
                }
                className={`flex-1 py-3 rounded-xl text-white text-sm font-black transition-all disabled:opacity-50 ${
                  modalMode === "ROLLBACK"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {modalMode === "ROLLBACK"
                  ? "تنفيذ التراجع التاريخي"
                  : "تنفيذ التقدم وإعادة التطبيق"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
