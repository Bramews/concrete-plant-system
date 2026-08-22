"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Share2,
  Copy,
  Power,
  RefreshCw,
  CheckCircle2,
  QrCode,
  Calendar,
  History,
  Trash2,
  Plus,
  AlertTriangle,
  Activity,
  UserPlus,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTunnelStatus,
  startTunnel,
  stopTunnel,
  saveTunnelSchedule,
  getTunnelLog,
  getNetworkAccessLogs,
  saveCustomTunnelSettings,
  getActiveDevices,
  LogEntry,
} from "@/app/actions/tunnel";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  getCustomers,
} from "@/app/actions/invitations";
import { DictionaryType } from "@/lib/dictionary.base";

interface TunnelTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function TunnelTab({ dict, settings, onUpdate }: TunnelTabProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("INACTIVE");
  const [activeUrl, setActiveUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  // Exponential Backoff States
  const [retryCount, setRetryCount] = useState(0);

  // Health Indicator State
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  // Scope Settings States
  const [scope, setScope] = useState("FULL");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Scheduling States
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedStart, setSchedStart] = useState("09:00");
  const [schedStop, setSchedStop] = useState("17:00");

  // Activity Logs States
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Network Access Logs States
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  const [showNetworkLogs, setShowNetworkLogs] = useState(true);

  // Custom Tunnel Configuration States
  const [customToken, setCustomToken] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // Live Active Devices States
  const [liveDevices, setLiveDevices] = useState<any[]>([]);
  const [networkTab, setNetworkTab] = useState("live");

  // Invitation System States
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteDuration, setInviteDuration] = useState(24);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await getTunnelStatus();
      if (!res.success && res.error === "NOT_AUTHENTICATED") {
        window.location.href = "/api/auth/session-cleanup";
        return;
      }
      setIsActive(res.isActive);
      setStatus(res.status);
      setActiveUrl(res.url);
      setScope(res.scope || "FULL");
      if (res.scope && res.scope.startsWith("CUSTOMER:")) {
        setSelectedCustomerId(res.scope.split(":")[1]);
      }
      setSchedEnabled(res.scheduleEnabled || false);
      setSchedStart(res.scheduleStart || "09:00");
      setSchedStop(res.scheduleStop || "17:00");
      setCustomToken(res.tunnelToken || "");
      setCustomDomain(res.tunnelCustomDomain || "");

      onUpdate("tunnel_active_url", res.url);
      onUpdate("tunnel_status", res.status);
    } catch (err) {
      console.error("[TunnelTab] loadStatus failed:", err);
    }
  };

  const loadLogsAndInvites = async () => {
    try {
      const [logsData, invitesData, customersData, networkLogsData] =
        await Promise.all([
          getTunnelLog(),
          listInvitations(),
          getCustomers(),
          getNetworkAccessLogs(),
        ]);
      setLogs(logsData);
      setInvitations(invitesData);
      setCustomers(customersData);
      setNetworkLogs(networkLogsData);
    } catch (err) {
      console.error("[TunnelTab] loadLogsAndInvites failed:", err);
    }
  };

  // Initial load
  useEffect(() => {
    loadStatus();
    loadLogsAndInvites();
  }, []);

  const loadLiveDevices = async () => {
    try {
      const devices = await getActiveDevices();
      setLiveDevices(devices);
    } catch (err) {
      console.error("[TunnelTab] loadLiveDevices failed:", err);
    }
  };

  const refreshNetworkLogs = async () => {
    try {
      const logsData = await getNetworkAccessLogs();
      setNetworkLogs(logsData);
    } catch (err) {
      console.error("[TunnelTab] refreshNetworkLogs failed:", err);
    }
  };

  const handleSaveCustomSettings = async () => {
    setIsSavingCustom(true);
    try {
      const res = await saveCustomTunnelSettings(
        customToken.trim(),
        customDomain.trim(),
      );
      if (res.success) {
        toast.success("تم حفظ إعدادات النفق المخصص بنجاح");
        loadStatus();
      } else {
        toast.error(`فشل الحفظ: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(`حدث خطأ أثناء الحفظ: ${err.message}`);
    } finally {
      setIsSavingCustom(false);
    }
  };

  useEffect(() => {
    if (showNetworkLogs && networkTab === "live") {
      loadLiveDevices();
    }
    const interval = setInterval(() => {
      if (showNetworkLogs && networkTab === "live") {
        loadLiveDevices();
      }
    }, 4000); // Poll every 4 seconds for immediate responsiveness

    return () => clearInterval(interval);
  }, [showNetworkLogs, networkTab]);

  // Polling with Exponential Backoff
  useEffect(() => {
    if (status === "STARTING") {
      const delays = [1000, 2000, 4000, 8000, 16000, 16000, 16000];
      const currentDelay = delays[retryCount] || 16000;

      const timer = setTimeout(async () => {
        try {
          const res = await getTunnelStatus();
          if (!res.success && res.error === "NOT_AUTHENTICATED") {
            window.location.href = "/api/auth/session-cleanup";
            return;
          }

          if (res.status === "ACTIVE" && res.url) {
            setIsActive(true);
            setStatus("ACTIVE");
            setActiveUrl(res.url);
            onUpdate("tunnel_active_url", res.url);
            onUpdate("tunnel_status", "ACTIVE");
            toast.success("تم تشغيل نفق البث بنجاح");
            loadLogsAndInvites();
          } else {
            const totalElapsed = delays
              .slice(0, retryCount + 1)
              .reduce((a, b) => a + b, 0);
            if (totalElapsed >= 60000) {
              setStatus("TIMEOUT");
              toast.error("انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى");
              loadLogsAndInvites();
            } else {
              setRetryCount((prev) => prev + 1);
            }
          }
        } catch (err) {
          console.error("[TunnelTab] Polling failed:", err);
        }
      }, currentDelay);

      return () => clearTimeout(timer);
    } else {
      setRetryCount(0);
    }
  }, [status, retryCount]);

  // Connection Health Check
  useEffect(() => {
    if (status === "ACTIVE" && activeUrl) {
      const checkHealth = () => {
        fetch(activeUrl + "/api/health", { method: "HEAD", mode: "no-cors" })
          .then(() => setIsHealthy(true))
          .catch(() => setIsHealthy(false));
      };

      checkHealth();
      const interval = setInterval(checkHealth, 30000);
      return () => clearInterval(interval);
    } else {
      setIsHealthy(null);
    }
  }, [status, activeUrl]);

  const handleToggle = () => {
    startTransition(async () => {
      if (isActive || status === "ACTIVE") {
        const res = await stopTunnel();
        if (!res.success && res.error === "NOT_AUTHENTICATED") {
          window.location.href = "/api/auth/session-cleanup";
          return;
        }

        if (res.success) {
          setIsActive(false);
          setStatus("INACTIVE");
          setActiveUrl("");
          onUpdate("tunnel_active_url", "");
          onUpdate("tunnel_status", "INACTIVE");
          toast.success("تم إيقاف نفق البث للضيوف بنجاح");
          loadLogsAndInvites();
        } else {
          toast.error(res.error || "فشل إيقاف النفق");
        }
      } else {
        setStatus("STARTING");
        const targetScope =
          scope === "CUSTOMER" ? `CUSTOMER:${selectedCustomerId}` : "FULL";
        if (scope === "CUSTOMER" && !selectedCustomerId) {
          toast.error("يرجى اختيار العميل أولاً لتحديد النطاق");
          setStatus("INACTIVE");
          return;
        }

        const res = await startTunnel(targetScope);
        if (!res.success && res.error === "NOT_AUTHENTICATED") {
          window.location.href = "/api/auth/session-cleanup";
          return;
        }

        if (res.success) {
          if (res.url) {
            setIsActive(true);
            setStatus("ACTIVE");
            setActiveUrl(res.url);
            onUpdate("tunnel_active_url", res.url);
            onUpdate("tunnel_status", "ACTIVE");
            toast.success("تم تشغيل نفق البث وتوليد رابط الضيوف");
          } else {
            toast.info(res.message || "جاري تفعيل النفق وتوليد الرابط...");
          }
          loadLogsAndInvites();
        } else {
          setStatus("INACTIVE");
          toast.error(res.error || "فشل تشغيل النفق");
        }
      }
    });
  };

  const handleSaveSchedule = async () => {
    try {
      const res = await saveTunnelSchedule(schedStart, schedStop, schedEnabled);
      if (!res.success && res.error === "NOT_AUTHENTICATED") {
        window.location.href = "/api/auth/session-cleanup";
        return;
      }

      if (res.success) {
        toast.success("تم حفظ جدول النفق بنجاح");
        loadStatus();
        loadLogsAndInvites();
      } else {
        toast.error(res.error || "فشل حفظ جدول تشغيل النفق");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "خطأ غير متوقع");
    }
  };

  const handleCreateInvite = async () => {
    if (!inviteLabel.trim()) {
      toast.error("يرجى اختيار أو كتابة اسم المقاول/العميل");
      return;
    }
    setIsCreatingInvite(true);
    try {
      const res = await createInvitation(inviteLabel, inviteDuration);
      if (!res.success && res.error === "NOT_AUTHENTICATED") {
        window.location.href = "/api/auth/session-cleanup";
        return;
      }

      if (res.success) {
        toast.success("تم إنشاء رابط الدعوة المؤقت بنجاح");
        setInviteLabel("");
        loadLogsAndInvites();
      } else {
        toast.error(res.error || "فشل إنشاء الدعوة");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "فشل إنشاء الدعوة");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      const res = await revokeInvitation(id);
      if (!res.success && res.error === "NOT_AUTHENTICATED") {
        window.location.href = "/api/auth/session-cleanup";
        return;
      }

      if (res.success) {
        toast.success("تم إلغاء الدعوة بنجاح");
        loadLogsAndInvites();
      } else {
        toast.error(res.error || "فشل إلغاء الدعوة");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "فشل إلغاء الدعوة");
    }
  };

  const handleCopy = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط إلى الحافظة");
  };

  function getRelativeTime(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }

  const qrUrl = activeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeUrl)}`
    : "";

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 justify-start">
          <Share2 className="w-5 h-5 text-blue-500 animate-pulse" />
          نفق البث البيني للضيوف والمقاولين (Cloudflare Tunnel)
        </h2>
        <p className="text-sm text-slate-400">
          تتيح هذه الميزة تشغيل نفق بث آمن ومؤقت لمشاركة لوحة التحكم، الإنتاج،
          أو نتائج خلطات محددة مع المقاولين والعملاء الخارجيين دون فتح أي منافذ
          جدار حماية محلي.
        </p>
      </div>

      {/* Main Controls Card */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-700/60 p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-300">
                حالة نفق البث الحالية:
              </span>
              {status === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  نشط ويعمل
                </span>
              ) : status === "STARTING" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  جاري تشغيل النفق وتوليد الرابط (محاولة {retryCount + 1})...
                </span>
              ) : status === "TIMEOUT" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-bounce">
                  <AlertTriangle className="w-3 h-3" />
                  انتهت المهلة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  متوقف تماماً
                </span>
              )}
            </div>

            {/* Live Connection Health Badge */}
            {status === "ACTIVE" && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">
                  حالة جودة الاتصال:
                </span>
                {isHealthy === true ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    الاتصال مستقر
                  </span>
                ) : isHealthy === false ? (
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    🔴 يبدو أن الاتصال منقطع
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> جاري الفحص...
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleToggle}
            disabled={isPending || status === "STARTING"}
            className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 shadow-md ${
              status === "ACTIVE"
                ? "bg-rose-600 hover:bg-rose-500 text-white hover:shadow-rose-600/20"
                : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-600/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPending || status === "STARTING" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {status === "ACTIVE" ? "إيقاف نفق البث" : "تفعيل نفق البث"}
          </button>
        </div>

        {/* Scope selector */}
        {status !== "ACTIVE" && status !== "STARTING" && (
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <label className="block text-sm font-bold text-slate-350">
              نطاق البث ومشاركة البيانات:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={scope === "FULL" ? "FULL" : "CUSTOMER"}
                onChange={(e) => setScope(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-300"
              >
                <option value="FULL">
                  الوصول الكامل للنظام (SYSTEM_OWNER)
                </option>
                <option value="CUSTOMER">وصول مقيد لعميل محدد فقط</option>
              </select>

              {scope === "CUSTOMER" && (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-300"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[11px] text-slate-450">
              * وضع العميل المحدد سيقوم بإعادة توجيه أي بث قادم من النفق
              تلقائياً إلى لوحة قراءة فقط لهذا العميل لحماية سرية البيانات
              الأخرى.
            </p>
          </div>
        )}

        {/* Guest Link Details & QR Code */}
        {status === "ACTIVE" && activeUrl && (
          <div className="space-y-4 pt-6 border-t border-slate-800/80 animate-slide-up">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-300">
                رابط البث الخارجي النشط:
              </label>
              <div className="flex items-center gap-2 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <span className="text-sm font-semibold text-blue-400 select-all truncate flex-1 dir-ltr text-left">
                  {activeUrl}
                </span>
                <button
                  onClick={() => handleCopy(activeUrl)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="bg-white p-2 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="رابط الاستجابة السريعة للنفق"
                  className="w-[150px] h-[150px]"
                />
              </div>
              <div className="space-y-2 text-center md:text-right">
                <h4 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  مشاركة سريعة عبر QR Code
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  امسح الرمز ضوئياً لفتح رابط البث فوراً على الهواتف أو الأجهزة
                  اللوحية دون الحاجة لكتابة الرابط.
                </p>
                <button
                  onClick={() => window.open(qrUrl, "_blank")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all mt-2"
                >
                  تحميل صورة الرمز (QR)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Tunnel Configuration Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 text-right">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 justify-start">
          <Settings className="w-4 h-4 text-blue-500" />
          إعدادات النفق المخصص الثابت (اختياري)
        </h3>
        <p className="text-[11px] text-slate-400">
          إذا كنت تمتلك حساب Cloudflare ونفقاً مخصصاً، يمكنك إدخال الرمز الخاص
          بك (Token) والنطاق المخصص هنا لتشغيل رابط ثابت لا يتغير في كل مرة.
          اتركه فارغاً لتشغيل النفق المؤقت الافتراضي.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-right">
            <label
              htmlFor="tunnel-token-input"
              className="block text-[11px] text-slate-350"
            >
              رمز النفق الخاص بك (Token):
            </label>
            <input
              id="tunnel-token-input"
              type="text"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              placeholder="أدخل رمز النفق (Token)..."
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono"
            />
          </div>
          <div className="space-y-2 text-right">
            <label
              htmlFor="tunnel-domain-input"
              className="block text-[11px] text-slate-350"
            >
              النطاق المخصص (Custom Domain):
            </label>
            <input
              id="tunnel-domain-input"
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="مثال: system.myplant.com"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={handleSaveCustomSettings}
            disabled={isSavingCustom}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
          >
            {isSavingCustom ? "جاري الحفظ..." : "حفظ إعدادات النفق المخصص"}
          </button>
        </div>
      </div>

      {/* Auto-Scheduling Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-md font-bold text-white flex items-center gap-2 justify-start">
          <Calendar className="w-4 h-4 text-blue-500" />
          الجدولة التلقائية لنفق البث
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <span className="text-xs text-slate-400">تفعيل الجدولة:</span>
            <select
              value={schedEnabled ? "true" : "false"}
              onChange={(e) => setSchedEnabled(e.target.value === "true")}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-300"
            >
              <option value="false">معطل</option>
              <option value="true">مفعل</option>
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-slate-400">وقت التشغيل:</span>
            <input
              type="time"
              value={schedStart}
              onChange={(e) => setSchedStart(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm text-slate-300 text-center"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs text-slate-400">وقت الإيقاف:</span>
            <input
              type="time"
              value={schedStop}
              onChange={(e) => setSchedStop(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm text-slate-300 text-center"
            />
          </div>

          <button
            onClick={handleSaveSchedule}
            className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl font-bold text-xs transition-all"
          >
            حفظ إعدادات الجدولة
          </button>
        </div>
        <p className="text-[11px] text-slate-450">
          * الجدولة تعمل تلقائياً مع زيارات المالك وتتحقق من مطابقة الوقت الحالي
          لإدارة الاتصال بنشاط.
        </p>
      </div>

      {/* Guest Invitation Panel */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <button
          onClick={() => setShowInvites(!showInvites)}
          className="w-full flex items-center justify-between text-white font-bold"
        >
          <span className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            نظام الدعوات المؤقتة للمقاولين ({invitations.length})
          </span>
          <span className="text-xs text-blue-400">
            {showInvites ? "إخفاء" : "عرض وإدارة"}
          </span>
        </button>

        {showInvites && (
          <div className="pt-4 border-t border-slate-800/80 space-y-6">
            {/* Create Invite form */}
            {status !== "ACTIVE" ? (
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center text-xs text-amber-400">
                ⚠️ يرجى تشغيل نفق البث أولاً لتتمكن من إصدار دعوات مؤقتة
                للمقاولين.
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-300">
                  إصدار رابط دعوة مؤقت جديد:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <span className="text-xs text-slate-400">
                      العميل / المقاول:
                    </span>
                    <select
                      value={inviteLabel}
                      onChange={(e) => setInviteLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm text-slate-350"
                    >
                      <option value="">-- اختر المقاول --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-400">
                      مدة الصلاحية:
                    </span>
                    <select
                      value={inviteDuration}
                      onChange={(e) =>
                        setInviteDuration(Number(e.target.value))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm text-slate-350"
                    >
                      <option value={1}>ساعة واحدة</option>
                      <option value={8}>8 ساعات</option>
                      <option value={24}>24 ساعة</option>
                      <option value={168}>7 أيام</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreateInvite}
                    disabled={isCreatingInvite}
                    className="w-full md:col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {isCreatingInvite
                      ? "جاري الإنشاء..."
                      : "إصدار رابط دعوة آمن"}
                  </button>
                </div>
              </div>
            )}

            {/* List Invites */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300">
                الروابط النشطة حالياً:
              </h4>
              {invitations.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  لا توجد دعوات نشطة في الوقت الحالي.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <th className="px-4 py-2">المقاول/العميل</th>
                        <th className="px-4 py-2">الرابط المولد</th>
                        <th className="px-4 py-2">تاريخ الانتهاء</th>
                        <th className="px-4 py-2 text-center">الزيارات</th>
                        <th className="px-4 py-2 text-center">العمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {invitations.map((invite) => {
                        const isExpired =
                          new Date() > new Date(invite.expiresAt);
                        const fullInviteUrl = `${window.location.origin}/invite/${invite.token}`;

                        return (
                          <tr key={invite.id} className="hover:bg-slate-900/10">
                            <td className="px-4 py-3 font-bold text-white">
                              {invite.label}
                            </td>
                            <td className="px-4 py-3 truncate max-w-[200px] text-blue-400 font-mono">
                              {fullInviteUrl}
                            </td>
                            <td
                              className={`px-4 py-3 ${isExpired ? "text-rose-500 font-bold" : "text-slate-400"}`}
                            >
                              {isExpired
                                ? "منتهي الصلاحية"
                                : new Date(invite.expiresAt).toLocaleString(
                                    "ar-EG",
                                  )}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-300">
                              {invite.viewCount}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleCopy(fullInviteUrl)}
                                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 rounded border border-blue-500/10"
                                  title="نسخ الرابط"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRevokeInvite(invite.id)}
                                  className="p-1 text-rose-450 hover:text-rose-450 transition-colors bg-rose-500/5 rounded border border-rose-500/10"
                                  title="إلغاء وتدمير"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Log Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between text-white font-bold"
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            سجل نشاط نفق البث ({logs.length})
          </span>
          <span className="text-xs text-blue-400">
            {showLogs ? "إخفاء" : "عرض السجلات"}
          </span>
        </button>

        {showLogs && (
          <div className="pt-4 border-t border-slate-800/80 max-h-[300px] overflow-y-auto space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">
                لا توجد سجلات نشاط مسجلة بعد.
              </p>
            ) : (
              <div className="relative border-r-2 border-slate-800 mr-2 pr-4 space-y-4">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-start gap-1"
                  >
                    <span className="absolute -right-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-200 font-medium">
                      {log.event}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {getRelativeTime(log.timestamp)} (
                      {new Date(log.timestamp).toLocaleTimeString("ar-EG")})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Access Log Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => setShowNetworkLogs(!showNetworkLogs)}
            className="flex items-center gap-2 text-white font-bold"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            مراقبة اتصالات ودخول الشبكة (المحلي والخارجي)
          </button>

          {showNetworkLogs && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setNetworkTab("live")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  networkTab === "live"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                المتصلون حالياً (الحي) ({liveDevices.length})
              </button>
              <button
                onClick={() => {
                  setNetworkTab("log");
                  refreshNetworkLogs();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  networkTab === "log"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                سجل الوصول الكامل ({networkLogs.length})
              </button>
            </div>
          )}
        </div>

        {showNetworkLogs && (
          <div className="pt-4 border-t border-slate-800/80 space-y-4 text-right">
            {/* MAC Address warning/explanation */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[11px] text-blue-450 leading-relaxed">
              ℹ️ <strong>ملاحظة تقنية وأمنية:</strong> العناوين الفيزيائية (MAC
              Addresses) تعمل في الطبقة الثانية من نموذج OSI (Link Layer) ولا
              يتم تمريرها بروتوكولياً عبر طلبات الويب (HTTP) لحماية الخصوصية
              والأمن؛ لذلك يتم تتبع عناوين الـ IP، نوع المتصفح، بصمة الجهاز
              (Device UUID)، والموقع الجغرافي عوضاً عنها.
            </div>

            {networkTab === "live" ? (
              /* Live Tab Table */
              liveDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                  </span>
                  <p className="text-xs text-slate-500 text-center">
                    لا يوجد مستخدمون نشطون في الوقت الحالي.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <th className="px-4 py-2">آخر نشاط</th>
                        <th className="px-4 py-2">المستخدم</th>
                        <th className="px-4 py-2">النظام المفتوح (الدور)</th>
                        <th className="px-4 py-2">عنوان IP / MAC</th>
                        <th className="px-4 py-2 text-center">نوع الشبكة</th>
                        <th className="px-4 py-2">المنصة / المتصفح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {liveDevices.map((device) => (
                        <tr
                          key={device.deviceUuid}
                          className="hover:bg-slate-900/10"
                        >
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {new Date(device.lastActive).toLocaleTimeString(
                              "ar-EG",
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            {device.username}
                          </td>
                          <td className="px-4 py-3 font-medium text-blue-400">
                            {device.roleName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-350">
                            <div>{device.ipAddress || "127.0.0.1"}</div>
                            <div className="text-[10px] text-slate-500">
                              MAC: غير متاح للويب
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {device.connectionType === "LOCAL" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                محلي (LOCAL)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                خارجي (GLOBAL)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {device.deviceType === "MOBILE"
                              ? "📱 هاتف ذكي"
                              : device.deviceType === "TABLET"
                                ? "📟 جهاز لوحي"
                                : "💻 حاسوب محمول/مكتبي"}
                            <span className="block text-[10px] text-slate-500 font-mono">
                              {device.userAgent
                                ? device.userAgent
                                    .split(" ")
                                    .slice(-2)
                                    .join(" ")
                                : "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : /* Historical Log Tab Table */
            networkLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                لا توجد سجلات اتصال مسجلة بعد.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <th className="px-4 py-2">وقت الاتصال</th>
                      <th className="px-4 py-2">المستخدم وجهازه</th>
                      <th className="px-4 py-2">النظام المفتوح (الدور)</th>
                      <th className="px-4 py-2">عنوان IP / MAC</th>
                      <th className="px-4 py-2 text-center">نوع الشبكة</th>
                      <th className="px-4 py-2">الموقع الجغرافي</th>
                      <th className="px-4 py-2">الصفحة المطلوبة</th>
                      <th className="px-4 py-2 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {networkLogs.map((log) => {
                      let detailsObj: any = {};
                      try {
                        detailsObj = JSON.parse(log.reason || "{}");
                      } catch (e) {
                        detailsObj = { pathname: log.reason };
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-900/10">
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("ar-EG")}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            {log.username}
                            {detailsObj.browser && (
                              <span className="block text-[10px] font-normal text-slate-500">
                                {detailsObj.browser}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-blue-400 font-medium">
                            {detailsObj.userRole ||
                              (log.username === "ضيف مؤقت (رابط خارجي)"
                                ? "رابط خارجي للضيوف"
                                : "زائر")}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">
                            <div>{log.ipAddress || "127.0.0.1"}</div>
                            <div className="text-[10px] text-slate-500">
                              MAC: غير متاح للويب
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.connectionType === "LOCAL" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                محلي (LOCAL)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                خارجي (GLOBAL)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-350">
                            {detailsObj.location ||
                              (log.connectionType === "LOCAL"
                                ? "الشبكة الداخلية"
                                : "غير معروف")}
                          </td>
                          <td
                            className="px-4 py-3 text-slate-350 font-mono truncate max-w-[150px]"
                            title={detailsObj.pathname}
                          >
                            {detailsObj.pathname || "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.status === "SUCCESS" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                مسموح
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-450 border border-rose-500/20"
                                title={detailsObj.blockReason || undefined}
                              >
                                محجوب
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
