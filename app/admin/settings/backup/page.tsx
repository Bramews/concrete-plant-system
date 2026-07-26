import {
  getBackups,
  getAutoBackupSettings,
  getBackupHealthStatus,
} from "@/app/actions/backup";
import { BackupManagementClient } from "./_components/BackupManagementClient";
import { getServerDictionary } from "@/lib/dictionary.server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";

export default async function BackupPage() {
  const dict = await getServerDictionary();
  let backups: any[] = [];
  let autoSettings: any = null;
  let healthStatus: any = null;

  try {
    const [backupsRes, autoSettingsRes, healthStatusRes] = await Promise.all([
      getBackups(),
      getAutoBackupSettings(),
      getBackupHealthStatus(),
    ]);
    backups = backupsRes;
    autoSettings = autoSettingsRes;
    healthStatus = healthStatusRes;
  } catch (err: unknown) {
    if (
      (err as Error).message === "NOT_AUTHENTICATED" ||
      (err as Error).message?.includes("Unauthorized")
    ) {
      const { redirect } = await import("next/navigation");
      redirect("/api/auth/session-cleanup");
    }
    // Return a simple friendly localized error if database access fails
    return (
      <div
        className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="bg-slate-900/50 border border-red-500/20 p-8 rounded-3xl text-center max-w-md">
          <p className="text-red-400 font-bold mb-4">
            فشل في الاتصال بنظام النسخ الاحتياطي.
          </p>
          <p className="text-sm text-slate-400">
            يرجى التأكد من صلاحيات حسابك أو المحاولة مرة أخرى لاحقاً.
          </p>
        </div>
      </div>
    );
  }

  // Load last 30 backup-related audit logs directly from Database
  const logs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: [
          "BACKUP_CREATE",
          "BACKUP_DELETE",
          "BACKUP_RESTORE",
          "BACKUP_VERIFY",
          "BACKUP_CLEANUP",
          "BACKUP_PATH_UPDATE",
          "AUTO_BACKUP_UPDATE",
        ],
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 30,
  });

  // Convert logs to plain JS objects to avoid serialization issues for DateTime
  const serializedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    details: log.details || "",
    timestamp: log.timestamp.toISOString(),
  }));

  // Ensure timestamps/dates from backups are serialized properly
  const serializedBackups = backups.map((b) => ({
    id: b.id,
    filename: b.filename,
    sizeBytes: b.sizeBytes,
    status: b.status,
    testStatus: b.testStatus,
    timestamp: b.timestamp, // Will be parsed correctly as Date or string
    type: b.type,
    durationMs: b.durationMs,
    encrypted: b.encrypted,
    storage: b.storage,
    creator: b.creator,
    integrityHash: b.integrityHash,
  }));

  const serializedHealthStatus = {
    status: healthStatus.status,
    reason: healthStatus.reason,
    successRate: healthStatus.successRate ?? 0,
    lastBackupTime: healthStatus.lastBackupTime ?? null,
  };

  let totalDiskCapacity = 500 * 1024 * 1024 * 1024;
  let freeDiskCapacity = totalDiskCapacity;
  try {
    const stats = await fs.statfs(process.cwd());
    totalDiskCapacity = stats.blocks * stats.bsize;
    freeDiskCapacity = stats.bavail * stats.bsize;
  } catch (err) {
    console.error("Failed to read disk stats:", err);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <BackupManagementClient
          dict={dict}
          backups={serializedBackups as any}
          autoSettings={autoSettings}
          logs={serializedLogs}
          healthStatus={serializedHealthStatus}
          totalDiskCapacity={totalDiskCapacity}
          freeDiskCapacity={freeDiskCapacity}
        />
      </div>
    </div>
  );
}
