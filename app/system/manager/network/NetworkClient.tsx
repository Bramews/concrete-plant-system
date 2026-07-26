"use client";

import { useState, useTransition, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "@/lib/toast";
import {
  updateNetworkSettings,
  toggleDeviceAccess,
  revokeDeviceSession,
  generateGuestLink,
  revokeGuestLink,
  getConnectedDevices,
  getAccessLogs,
} from "@/app/actions/network";
import { PrintersPanel } from "./PrintersPanel";
import { TopologyMap } from "./TopologyMap";
import { ScreenBroadcast } from "./ScreenBroadcast";
import { CompanyBroadcast } from "./CompanyBroadcast";

interface NetworkClientProps {
  userRole: string;
  companyId: number;
  initialSettings: any;
  initialDevices: any[];
  initialLogs: any[];
  initialGuestLinks: any[];
  orders: any[];
  mixes: any[];
}

export function NetworkClient({
  userRole,
  companyId,
  initialSettings,
  initialDevices,
  initialLogs,
  initialGuestLinks,
  orders,
  mixes,
}: NetworkClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [devices, setDevices] = useState(initialDevices);
  const [logs, setLogs] = useState(initialLogs);
  const [guestLinks, setGuestLinks] = useState(initialGuestLinks || []);

  // Guest Link Generator State
  const [durationHours, setDurationHours] = useState(4);
  const [restrictOrder, setRestrictOrder] = useState("");
  const [restrictMix, setRestrictMix] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [showMap, setShowMap] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [generatedLink, setGeneratedLink] = useState("");
  const [mounted, setMounted] = useState(false);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetDeviceUuid, setTargetDeviceUuid] = useState("");
  const [targetDeviceName, setTargetDeviceName] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const refreshDevicesQuietly = async () => {
    const res = await getConnectedDevices(companyId);
    if (res.success && res.devices) {
      setDevices(res.devices);
    }
  };

  // Automatic Refresh of Live Devices & Logs
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      refreshDevicesQuietly();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshDevices = async () => {
    setIsDevicesLoading(true);
    const res = await getConnectedDevices(companyId);
    setIsDevicesLoading(false);
    if (res.success && res.devices) {
      setDevices(res.devices);
      toast.success("تم تحديث قائمة الأجهزة المتصلة");
    } else {
      toast.error("فشل تحديث قائمة الأجهزة");
    }
  };

  const handleRefreshLogs = async () => {
    setIsLogsLoading(true);
    const res = await getAccessLogs(companyId);
    setIsLogsLoading(false);
    if (res.success && res.logs) {
      setLogs(res.logs);
      toast.success("تم تحديث سجل الوصول");
    } else {
      toast.error("فشل تحديث سجل الوصول");
    }
  };

  // Toggle Access Toggles
  const handleToggleAccess = (type: "local" | "global") => {
    const updated = {
      localAccessEnabled:
        type === "local"
          ? !settings.localAccessEnabled
          : settings.localAccessEnabled,
      globalAccessEnabled:
        type === "global"
          ? !settings.globalAccessEnabled
          : settings.globalAccessEnabled,
    };

    startTransition(async () => {
      const res = await updateNetworkSettings(companyId, updated);
      if (res.success && res.data) {
        setSettings(res.data);
        toast.success(
          `تم ${updated.localAccessEnabled && updated.globalAccessEnabled ? "تفعيل" : "تحديث"} صلاحيات الوصول بنجاح`,
        );
      } else {
        toast.error("فشل تحديث إعدادات الشبكة");
      }
    });
  };

  // Save Schedule settings
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateNetworkSettings(companyId, {
        scheduleEnabled: settings.scheduleEnabled,
        startHour: settings.startHour,
        endHour: settings.endHour,
      });
      if (res.success && res.data) {
        setSettings(res.data);
        toast.success("تم حفظ إعدادات ساعات العمل والجدولة");
      } else {
        toast.error("فشل حفظ إعدادات الجدولة");
      }
    });
  };

  // Toggle Schedule Toggle Directly
  const handleToggleSchedule = () => {
    const updatedVal = !settings.scheduleEnabled;
    setSettings((prev: any) => ({ ...prev, scheduleEnabled: updatedVal }));
    startTransition(async () => {
      const res = await updateNetworkSettings(companyId, {
        scheduleEnabled: updatedVal,
      });
      if (res.success && res.data) {
        setSettings(res.data);
        toast.success(
          updatedVal
            ? "تم تفعيل جدولة ساعات العمل"
            : "تم إلغاء تفعيل جدولة ساعات العمل",
        );
      } else {
        toast.error("فشل تحديث إعدادات الجدولة");
      }
    });
  };

  // Toggle device access traits
  const handleToggleDeviceTrait = async (
    uuid: string,
    type: "blacklist" | "whitelist" | "readonly",
    currentValue: boolean,
  ) => {
    const newValue = !currentValue;
    const res = await toggleDeviceAccess(uuid, type, newValue);
    if (res.success) {
      toast.success("تم تحديث حالة صلاحيات الجهاز");
      // Update local state
      setDevices((prev) =>
        prev.map((d) => {
          if (d.deviceUuid === uuid) {
            const updated = { ...d };
            if (type === "blacklist") updated.isBlacklisted = newValue;
            if (type === "whitelist") updated.isWhitelisted = newValue;
            if (type === "readonly") updated.isReadOnly = newValue;
            return updated;
          }
          return d;
        }),
      );
    } else {
      toast.error("فشل تحديث صلاحيات الجهاز");
    }
  };

  // Kick Device Flow
  const handleKickClick = (uuid: string, name: string) => {
    setTargetDeviceUuid(uuid);
    setTargetDeviceName(name);
    setIsConfirmOpen(true);
  };

  const handleConfirmKick = async () => {
    setIsConfirmOpen(false);
    const res = await revokeDeviceSession(targetDeviceUuid);
    if (res.success) {
      toast.success(`تم طرد وإلغاء جلسة الجهاز "${targetDeviceName}" بنجاح`);
      setDevices((prev) =>
        prev.filter((d) => d.deviceUuid !== targetDeviceUuid),
      );
    } else {
      toast.error("فشل إلغاء جلسة الجهاز");
    }
  };

  // Generate Guest Access Link
  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const serializedNotes = JSON.stringify({
      notes: guestNotes,
      showMap,
      showHistory,
    });

    const res = await generateGuestLink(
      companyId,
      durationHours,
      restrictOrder ? Number(restrictOrder) : undefined,
      restrictMix ? Number(restrictMix) : undefined,
      serializedNotes,
    );

    if (res.success && res.data) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/public/portal?guest_token=${res.data.token}`;
      setGeneratedLink(link);
      setGuestLinks((prev: any[]) => [res.data, ...prev]);
      toast.success("تم توليد رابط الضيف المؤقت بنجاح");
      setGuestNotes("");
      setRestrictOrder("");
      setRestrictMix("");
    } else {
      toast.error("فشل توليد رابط الضيف");
    }
  };

  const handleRevokeLink = async (token: string) => {
    const res = await revokeGuestLink(token);
    if (res.success) {
      toast.success("تم إلغاء وتعطيل رابط الوصول للضيف بنجاح");
      setGuestLinks((prev: any[]) => prev.filter((l) => l.token !== token));
    } else {
      toast.error("فشل إلغاء صلاحية الرابط");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ الرابط إلى الحافظة");
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "منتهي الصلاحية";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `متبقي ${hours} ساعة و ${minutes} دقيقة`;
    }
    return `متبقي ${minutes} دقيقة`;
  };

  // Filtered lists
  const filteredDevices = devices.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deviceUuid.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredLogs = logs.filter(
    (l) =>
      l.username.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.ipAddress?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.reason?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.status.toLowerCase().includes(logSearchQuery.toLowerCase()),
  );

  return (
    <div
      className="p-8 min-h-screen text-slate-100 bg-slate-950 font-sans"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Icons.Shield className="w-8 h-8" />
            </span>
            منظومة الشبكة والوصول الموحد
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            مراقبة الأجهزة المتصلة، التحكم بالشبكة المحلية/العالمية، وإدارة
            صلاحيات الضيوف والجدولة الزمنية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Network Settings & Schedule */}
        <div className="lg:col-span-1 space-y-8">
          {/* Access Control Switches - SYSTEM OWNER ONLY */}
          {userRole === "SYSTEM_OWNER" && (
            <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                <Icons.Lock className="w-5 h-5 text-indigo-400" />
                مفاتيح الوصول للبنية التحتية
              </h2>

              <div className="space-y-6">
                {/* Local Access Switch */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex-1 pr-1">
                    <div className="font-bold text-white text-sm">
                      الوصول المحلي (Local Network)
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      السماح للأجهزة في الشبكة الداخلية للمحطة بالدخول للمنظومة.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAccess("local")}
                    className={`w-14 h-8 rounded-full transition-all relative ${
                      settings.localAccessEnabled
                        ? "bg-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`absolute top-1 right-1 w-6 h-6 rounded-full bg-white transition-all ${
                        settings.localAccessEnabled
                          ? "translate-x-0"
                          : "-translate-x-6"
                      }`}
                    />
                  </button>
                </div>

                {/* Global Access Switch */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex-1 pr-1">
                    <div className="font-bold text-white text-sm">
                      الوصول العالمي (Internet Access)
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      السماح بالوصول للنظام من خارج المحطة عبر شبكة الإنترنت.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAccess("global")}
                    className={`w-14 h-8 rounded-full transition-all relative ${
                      settings.globalAccessEnabled
                        ? "bg-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`absolute top-1 right-1 w-6 h-6 rounded-full bg-white transition-all ${
                        settings.globalAccessEnabled
                          ? "translate-x-0"
                          : "-translate-x-6"
                      }`}
                    />
                  </button>
                </div>

                {/* Status Alert */}
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    settings.localAccessEnabled
                      ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-300"
                      : "bg-rose-500/5 border-rose-500/10 text-rose-300"
                  }`}
                >
                  <Icons.Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">
                    {settings.localAccessEnabled
                      ? "المنظومة متاحة حالياً على الشبكة المحلية للمصنع. يُنصح بتفعيل جدار الحماية الخارجي في أوقات التعطيل الإداري."
                      : "تحذير: لقد قمت بتعطيل الوصول المحلي للشبكة. لن يتمكن الموظفون من الدخول للنظام إلا في حال وجود استثناءات معتمدة."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Working Hours Schedule Form */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Icons.Clock className="w-5 h-5 text-indigo-400" />
                جدولة ساعات الدخول اليومي
              </h2>
              <button
                type="button"
                onClick={handleToggleSchedule}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  settings.scheduleEnabled ? "bg-indigo-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    settings.scheduleEnabled
                      ? "translate-x-0"
                      : "-translate-x-6"
                  }`}
                />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    وقت بدء العمل
                  </label>
                  <input
                    type="time"
                    disabled={!settings.scheduleEnabled}
                    value={settings.startHour}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        startHour: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    وقت نهاية العمل
                  </label>
                  <input
                    type="time"
                    disabled={!settings.scheduleEnabled}
                    value={settings.endHour}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        endHour: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {settings.scheduleEnabled && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  {isPending ? "جاري الحفظ..." : "حفظ ساعات العمل"}
                </button>
              )}

              <p className="text-slate-400 text-xs text-center font-medium">
                في حال تفعيل الجدولة، سيتم منع أي دخول للنظام خارج هذه الساعات
                باستثناء الأجهزة الحاصلة على استثناء إداري مسبق (Whitelist).
              </p>
            </form>
          </div>

          <P2PFallbackHub />
        </div>

        {/* Right Columns (2/3 width): Live Connected Devices & Access Logs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Connected Devices List */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  الأجهزة المتصلة حالياً بالشبكة
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  تتبع نشاط الأجهزة بالملي ثانية وتطبيق الحظر الفوري.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <input
                    type="text"
                    placeholder="بحث في الأجهزة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 pr-10 pl-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                </div>

                <button
                  onClick={handleRefreshDevices}
                  disabled={isDevicesLoading}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white rounded-2xl transition-all"
                >
                  <Icons.Loader
                    className={`w-4 h-4 ${isDevicesLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Devices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs font-black">
                    <th className="py-3 px-4">اسم وصنف الجهاز</th>
                    <th className="py-3 px-4">عنوان IP والـ UUID</th>
                    <th className="py-3 px-4">طريقة الاتصال</th>
                    <th className="py-3 px-4">آخر نشاط</th>
                    <th className="py-3 px-4 text-center">
                      إجراءات الحماية والتحكم
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-500 font-bold text-sm"
                      >
                        لا توجد أجهزة متصلة مطابقة للبحث حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((d) => (
                      <tr
                        key={d.deviceUuid}
                        className={`text-sm group hover:bg-white/5 transition-colors ${d.isBlacklisted ? "bg-rose-950/20" : ""}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-white/5 rounded-xl text-slate-300">
                              {d.deviceType === "MOBILE" ? (
                                <span className="text-lg">📱</span>
                              ) : d.deviceType === "TABLET" ? (
                                <span className="text-lg">📟</span>
                              ) : (
                                <span className="text-lg">💻</span>
                              )}
                            </span>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {d.name || "جهاز مجهول"}
                                {d.isWhitelisted && (
                                  <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                    استثناء
                                  </span>
                                )}
                                {d.isReadOnly && (
                                  <span className="text-[10px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                                    للقراءة فقط
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                                {d.userAgent?.slice(0, 50)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs">
                          <div className="text-slate-300 font-bold">
                            {d.ipAddress || "127.0.0.1"}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {d.deviceUuid}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                              d.connectionType === "LOCAL"
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}
                          >
                            {d.connectionType === "LOCAL"
                              ? "شبكة محلية"
                              : "إنترنت خارجي"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-400 font-bold">
                          {new Date(d.lastActive).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Whitelist Toggle */}
                            <button
                              onClick={() =>
                                handleToggleDeviceTrait(
                                  d.deviceUuid,
                                  "whitelist",
                                  d.isWhitelisted,
                                )
                              }
                              title="تفعيل/تعطيل الاستثناء"
                              className={`p-2 rounded-xl border transition-all ${
                                d.isWhitelisted
                                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                  : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <Icons.ShieldCheck className="w-4 h-4" />
                            </button>

                            {/* Read Only Toggle */}
                            <button
                              onClick={() =>
                                handleToggleDeviceTrait(
                                  d.deviceUuid,
                                  "readonly",
                                  d.isReadOnly,
                                )
                              }
                              title="وضع القراءة فقط"
                              className={`p-2 rounded-xl border transition-all ${
                                d.isReadOnly
                                  ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                                  : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <Icons.Lock className="w-4 h-4" />
                            </button>

                            {/* Blacklist Toggle */}
                            <button
                              onClick={() =>
                                handleToggleDeviceTrait(
                                  d.deviceUuid,
                                  "blacklist",
                                  d.isBlacklisted,
                                )
                              }
                              title="حظر الجهاز"
                              className={`p-2 rounded-xl border transition-all ${
                                d.isBlacklisted
                                  ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                                  : "bg-slate-900 border-white/5 text-slate-500 hover:text-rose-400"
                              }`}
                            >
                              <Icons.AlertTriangle className="w-4 h-4" />
                            </button>

                            {/* Kick Session */}
                            <button
                              onClick={() =>
                                handleKickClick(d.deviceUuid, d.name || "جهاز")
                              }
                              title="طرد الجلسة"
                              className="p-2 bg-slate-900 border border-white/5 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 rounded-xl transition-all"
                            >
                              <Icons.Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guest Token Access Generator */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
            <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <Icons.Key className="w-5 h-5 text-indigo-400" />
              توليد روابط وصول مؤقتة للضيوف
            </h2>

            <form onSubmit={handleGenerateLink} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    مدة الصلاحية
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value={1} className="bg-slate-900 text-white">
                      ساعة واحدة
                    </option>
                    <option value={4} className="bg-slate-900 text-white">
                      4 ساعات
                    </option>
                    <option value={12} className="bg-slate-900 text-white">
                      12 ساعة
                    </option>
                    <option value={24} className="bg-slate-900 text-white">
                      24 ساعة
                    </option>
                    <option value={168} className="bg-slate-900 text-white">
                      أسبوع كامل
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    تقييد برقم طلب محدد (اختياري)
                  </label>
                  <select
                    value={restrictOrder}
                    onChange={(e) => setRestrictOrder(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      كامل الطلبات
                    </option>
                    {orders.map((o) => (
                      <option
                        key={o.id}
                        value={o.id}
                        className="bg-slate-900 text-white"
                      >
                        {o.orderNumber} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    تقييد بخلطة خرسانية (اختياري)
                  </label>
                  <select
                    value={restrictMix}
                    onChange={(e) => setRestrictMix(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      كامل الخلطات
                    </option>
                    {mixes.map((m) => (
                      <option
                        key={m.id}
                        value={m.id}
                        className="bg-slate-900 text-white"
                      >
                        {m.code} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-2">
                  ملاحظات وسبب تصريح الزيارة
                </label>
                <input
                  type="text"
                  placeholder="مثال: المهندس الاستشاري للمشروع يرغب بمشاهدة تقارير صب وخلطات مكعبات الفحص..."
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-white/5 border border-white/5 rounded-2xl">
                <div className="text-xs font-black text-slate-400 self-center">
                  صلاحيات عرض البوابة للزبون:
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-bold hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={showMap}
                      onChange={(e) => setShowMap(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-white/10 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    تفعيل تتبع الشاحنات والخريطة الحية
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-bold hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={showHistory}
                      onChange={(e) => setShowHistory(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-white/10 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    تفعيل سجل حركة الشحنات والكميات التراكمية
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                >
                  توليد رابط الضيف الآمن
                </button>
              </div>
            </form>

            {generatedLink && (
              <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-3">
                <div className="text-xs font-black text-indigo-400">
                  رابط الضيف الآمن للوصول (للقراءة فقط):
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="w-full px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedLink)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap"
                  >
                    نسخ الرابط
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const token = generatedLink.split("guest_token=")[1];
                      if (token) {
                        handleRevokeLink(token);
                        setGeneratedLink("");
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap"
                  >
                    إلغاء وتعطيل الرابط
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  * هذا الرابط يعطي صلاحيات القراءة فقط دون تعديل أو تسجيل دخول،
                  وينتهي تلقائياً بعد الوقت المحدد.
                </p>
              </div>
            )}

            {/* Active Guest Links List */}
            {guestLinks && guestLinks.length > 0 && (
              <div className="mt-8 border-t border-white/5 pt-6">
                <h3 className="text-sm font-black text-slate-300 mb-4 flex items-center gap-2">
                  <Icons.Key className="w-4 h-4 text-indigo-400" />
                  الروابط النشطة حالياً للمقاولين والضيوف
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-bold">
                        <th className="py-2 px-3">رابط الوصول</th>
                        <th className="py-2 px-3">تاريخ الانتهاء</th>
                        <th className="py-2 px-3">التقييد والقيود</th>
                        <th className="py-2 px-3">الملاحظات</th>
                        <th className="py-2 px-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {guestLinks.map((link: any) => {
                        const baseUrl = mounted ? window.location.origin : "";
                        const guestUrl = `${baseUrl}/public/portal?guest_token=${link.token}`;
                        const isExpired = new Date() > new Date(link.expiresAt);
                        if (isExpired) return null;

                        let displayNotes = link.notes || "";
                        let displayRestrictions: string[] = [];
                        if (link.notes && link.notes.startsWith("{")) {
                          try {
                            const parsed = JSON.parse(link.notes);
                            displayNotes = parsed.notes || "";
                            if (parsed.showMap)
                              displayRestrictions.push("الخريطة");
                            if (parsed.showHistory)
                              displayRestrictions.push("سجل الشحنات");
                          } catch (e) {}
                        } else {
                          // Backward compatibility
                          displayRestrictions.push("الخريطة", "سجل الشحنات");
                        }

                        return (
                          <tr
                            key={link.token}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-3 font-mono">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-slate-300 truncate max-w-[200px]"
                                  title={guestUrl}
                                >
                                  {guestUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(guestUrl)}
                                  title="نسخ الرابط"
                                  className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                  <Icons.Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-bold">
                              <div>
                                {new Date(link.expiresAt).toLocaleString(
                                  "ar-EG",
                                  { dateStyle: "short", timeStyle: "short" },
                                )}
                              </div>
                              <span className="text-[10px] text-indigo-400 block mt-1 font-black">
                                {getRemainingTime(link.expiresAt)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="space-y-1 font-bold">
                                {link.allowedOrderId ? (
                                  <span className="block px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 rounded-full w-max">
                                    طلب رقم:{" "}
                                    {orders.find(
                                      (o) => o.id === link.allowedOrderId,
                                    )?.orderNumber || link.allowedOrderId}
                                  </span>
                                ) : null}
                                {link.allowedMixId ? (
                                  <span className="block px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 rounded-full w-max">
                                    خلطة:{" "}
                                    {mixes.find(
                                      (m) => m.id === link.allowedMixId,
                                    )?.name || link.allowedMixId}
                                  </span>
                                ) : null}
                                {displayRestrictions.length > 0 && (
                                  <span className="block text-[10px] text-slate-400 font-bold">
                                    عرض: {displayRestrictions.join("، ")}
                                  </span>
                                )}
                                {!link.allowedOrderId &&
                                  !link.allowedMixId &&
                                  displayRestrictions.length === 0 && (
                                    <span className="text-slate-500">
                                      كامل الصلاحيات (قراءة)
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td
                              className="py-3 px-3 text-slate-400 italic truncate max-w-[150px]"
                              title={displayNotes}
                            >
                              {displayNotes || "—"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRevokeLink(link.token)}
                                title="إلغاء الصلاحية وتعطيل الرابط"
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                              >
                                إلغاء الرابط
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Access Logs Panel */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Icons.History className="w-5 h-5 text-indigo-400" />
                  سجل الدخول ومحاولات الوصول للشبكة
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  تتبع كافة طلبات الدخول الناجحة والمحجوبة بدلالة الأجهزة والـ
                  IP.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <input
                    type="text"
                    placeholder="بحث في سجلات الوصول..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full md:w-64 pr-10 pl-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                </div>

                <button
                  onClick={handleRefreshLogs}
                  disabled={isLogsLoading}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white rounded-2xl transition-all"
                >
                  <Icons.Loader
                    className={`w-4 h-4 ${isLogsLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs font-black">
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">اسم المستخدم</th>
                    <th className="py-3 px-4">عنوان IP والشبكة</th>
                    <th className="py-3 px-4">حالة الدخول</th>
                    <th className="py-3 px-4">ملاحظات وسبب المنع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-500 font-bold text-sm"
                      >
                        لا توجد سجلات وصول مطابقة حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => (
                      <tr
                        key={l.id}
                        className="text-xs hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-400 font-mono font-bold">
                          {new Date(l.timestamp).toLocaleString("ar-EG")}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {l.username}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-300">
                            {l.ipAddress || "127.0.0.1"}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {l.connectionType === "LOCAL" ? "محلي" : "خارجي"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black border text-[10px] ${
                              l.status === "SUCCESS"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                            }`}
                          >
                            {l.status === "SUCCESS" ? "مسموح" : "محجوب"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-medium leading-relaxed">
                          {l.reason || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <TopologyMap devices={devices} />
      <ScreenBroadcast />
      <CompanyBroadcast />
      <PrintersPanel companyId={companyId} />

      {/* Confirmation Dialog for Session Kick */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmKick}
        title="تأكيد طرد وإلغاء جلسة الجهاز"
        description={`هل أنت متأكد من رغبتك في طرد جهاز "${targetDeviceName}"؟ سيتم تسجيل خروجه فوراً وقطع اتصاله بالمنظومة بالكامل.`}
        confirmText="طرد وإلغاء الجلسة"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}

function P2PFallbackHub() {
  const [queueLength, setQueueLength] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const checkStatus = () => {
    setIsOnline(navigator.onLine);
    try {
      const data = localStorage.getItem("offline_sync_queue");
      const queue = data ? JSON.parse(data) : [];
      setQueueLength(queue.length);
    } catch {
      setQueueLength(0);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    window.addEventListener("online", checkStatus);
    window.addEventListener("offline", checkStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkStatus);
      window.removeEventListener("offline", checkStatus);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { OfflineSync } = await import("@/lib/network/offline-sync");
      await OfflineSync.syncQueue();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      checkStatus();
      toast.success(
        "تمت مزامنة البيانات بين الأجهزة المحلية والند للند بنجاح.",
      );
    } catch {
      toast.error("فشل إتمام المزامنة الجانبية.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 shadow-2xl space-y-4">
      <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-white/5 pb-3">
        <Icons.Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        مزامنة الند للند والشبكة الجانبية (P2P Fallback)
      </h3>

      <div className="space-y-3">
        {/* Status Indicators */}
        <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
          <span className="text-xs font-bold text-slate-400">
            حالة الاتصال بالسحابة:
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`}
            />
            <span
              className={`text-xs font-black ${isOnline ? "text-emerald-400" : "text-rose-400"}`}
            >
              {isOnline ? "نشط - خادم سحابي" : "منقطع - تشغيل محلي"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
          <span className="text-xs font-bold text-slate-400">
            المعاملات المحلية المؤقتة:
          </span>
          <span className="text-xs font-mono font-black text-indigo-300">
            {queueLength} معاملات معلقة
          </span>
        </div>

        {/* Local Peers */}
        <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            الأجهزة الزميلة النشطة بالشبكة المحلية (Local Peers)
          </span>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">
                محطة خرسانة - فحص المختبر
              </span>
              <span className="text-emerald-400 font-mono">
                192.168.1.102 (نشط)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">
                مكتب التذاكر والمبيعات
              </span>
              <span className="text-emerald-400 font-mono">
                192.168.1.105 (نشط)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">
                حاسب التحكم بالخلاط الرئيسي
              </span>
              <span className="text-amber-400 font-mono">
                192.168.1.120 (مزامنة مؤقتة)
              </span>
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={syncing || (!isOnline && queueLength === 0)}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/30 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
        >
          {syncing ? (
            <>
              <Icons.Loader className="w-4 h-4 animate-spin" />
              جاري فحص وتمرير البيانات للند للند...
            </>
          ) : (
            <>
              <Icons.Activity className="w-4 h-4" />
              مزامنة وتمرير البيانات الآن (Force P2P Sync)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
