"use client";

import { useState, useTransition } from "react";
import {
  triggerManualBackup,
  createFullSnapshot,
  updateAutoBackupSettings,
} from "@/app/actions/backup";
import { Database, Camera, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { DictionaryType } from "@/lib/dictionary";

interface BackupControlsProps {
  dict: DictionaryType;
  autoSettings: {
    enabled: boolean;
    frequency: string;
    retention: number;
    lastRun: Date | null;
    nextRun: Date | null;
  };
}

export function BackupControls({ dict, autoSettings }: BackupControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);

  const [autoEnabled, setAutoEnabled] = useState(autoSettings.enabled);
  const [frequency, setFrequency] = useState(autoSettings.frequency);
  const [retention, setRetention] = useState(autoSettings.retention);

  const handleManualBackup = () => {
    setIsManualLoading(true);
    startTransition(async () => {
      const result = await triggerManualBackup();
      setIsManualLoading(false);
      if (result.success) {
        toast.success("تم إنشاء النسخة الاحتياطية بنجاح");
      } else {
        toast.error("فشل إنشاء النسخة الاحتياطية");
      }
    });
  };

  const handleSnapshot = () => {
    setIsSnapshotLoading(true);
    startTransition(async () => {
      const result = await createFullSnapshot();
      setIsSnapshotLoading(false);
      if (result.success) {
        toast.success("تم التقاط الصورة الكاملة بنجاح");
      } else {
        toast.error("فشل التقاط الصورة");
      }
    });
  };

  const handleAutoSettingsChange = () => {
    startTransition(async () => {
      const result = await updateAutoBackupSettings({
        enabled: autoEnabled,
        frequency,
        retention,
      });
      if (result.success) {
        toast.success("تم تحديث إعدادات النسخ التلقائي");
      } else {
        toast.error("فشل تحديث الإعدادات");
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("ar", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Manual Backup Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {dict.settings.backup.manual.title}
            </h3>
            <p className="text-sm text-slate-400">
              {dict.settings.backup.manual.desc}
            </p>
          </div>

          <button
            onClick={handleManualBackup}
            disabled={isManualLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isManualLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {dict.settings.backup.manual.in_progress}
              </>
            ) : (
              dict.settings.backup.manual.button
            )}
          </button>
        </div>
      </div>

      {/* Full Snapshot Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-6 hover:border-emerald-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Camera className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {dict.settings.backup.snapshot.title}
            </h3>
            <p className="text-sm text-slate-400">
              {dict.settings.backup.snapshot.desc}
            </p>
          </div>

          <button
            onClick={handleSnapshot}
            disabled={isSnapshotLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSnapshotLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {dict.settings.backup.snapshot.in_progress}
              </>
            ) : (
              dict.settings.backup.snapshot.button
            )}
          </button>
        </div>
      </div>

      {/* Auto-Backup Scheduler Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-6 hover:border-violet-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-500" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Clock className="w-6 h-6 text-violet-400" />
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoEnabled}
                onChange={(e) => {
                  setAutoEnabled(e.target.checked);
                  handleAutoSettingsChange();
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {dict.settings.backup.auto.title}
            </h3>
            <p className="text-sm text-slate-400">
              {dict.settings.backup.auto.desc}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-slate-400 block mb-1">
                {dict.settings.backup.auto.frequency}
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value);
                  handleAutoSettingsChange();
                }}
                disabled={!autoEnabled}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="DAILY">{dict.settings.backup.auto.daily}</option>
                <option value="WEEKLY">
                  {dict.settings.backup.auto.weekly}
                </option>
                <option value="MONTHLY">
                  {dict.settings.backup.auto.monthly}
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-400 block mb-1">
                {dict.settings.backup.auto.retention}
              </label>
              <input
                type="number"
                value={retention}
                onChange={(e) => {
                  setRetention(parseInt(e.target.value));
                  handleAutoSettingsChange();
                }}
                disabled={!autoEnabled}
                min={1}
                max={30}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="pt-2 space-y-1 text-sm font-bold">
              <div className="flex justify-between text-slate-400">
                <span>{dict.settings.backup.auto.last_run}:</span>
                <span className="text-white">
                  {formatDate(autoSettings.lastRun)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{dict.settings.backup.auto.next_run}:</span>
                <span className="text-white">
                  {formatDate(autoSettings.nextRun)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
