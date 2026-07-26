"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);

// Helper to calculate ledger hash chain
function calculateLedgerHash(
  id: number,
  timestamp: string,
  tableName: string,
  recordId: string,
  actionType: string,
  oldValues: string | null,
  newValues: string | null,
  parentHash: string | null,
): string {
  const data = `${id}|${timestamp}|${tableName}|${recordId}|${actionType}|${oldValues || ""}|${newValues || ""}|${parentHash || ""}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function getCurrentLedgerId(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "CURRENT_LEDGER_ID" },
  });
  if (setting) {
    return parseInt(setting.value);
  }
  const maxLedger = await prisma.systemLedger.findFirst({
    orderBy: { id: "desc" },
  });
  return maxLedger?.id || 0;
}

export async function setCurrentLedgerId(id: number) {
  await prisma.systemSetting.upsert({
    where: { key: "CURRENT_LEDGER_ID" },
    update: { value: String(id) },
    create: { key: "CURRENT_LEDGER_ID", value: String(id) },
  });
}

// Setup SQLite database triggers dynamically
export async function setupDatabaseTriggers() {
  let db: any = null;
  try {
    await requireRole(["SYSTEM_OWNER"]);
    const { default: Database } = await import("better-sqlite3");
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    db = new Database(dbPath);
    const tables = [
      "User",
      "Company",
      "Order",
      "MixDesign",
      "MixComponent",
      "CubeTest",
      "SieveAnalysis",
      "LabApproval",
    ];
    for (const table of tables) {
      // Get table columns info
      const columnsInfo: any = db
        .prepare(`PRAGMA table_info("${table}")`)
        .all();
      const newColsJson = columnsInfo
        .map((c: any) => `'${c.name}', NEW."${c.name}"`)
        .join(", ");
      const oldColsJson = columnsInfo
        .map((c: any) => `'${c.name}', OLD."${c.name}"`)
        .join(", ");
      const changedColsJson = columnsInfo
        .map(
          (c: any) =>
            `CASE WHEN OLD."${c.name}" IS NOT NEW."${c.name}" THEN '${c.name}' END`,
        )
        .join(", ");
      // Drop existing triggers if any
      db.prepare(`DROP TRIGGER IF EXISTS "${table}_ledger_insert"`).run();
      db.prepare(`DROP TRIGGER IF EXISTS "${table}_ledger_update"`).run();
      db.prepare(`DROP TRIGGER IF EXISTS "${table}_ledger_delete"`).run();
      // Create INSERT trigger
      const insertSql = `
        CREATE TRIGGER "${table}_ledger_insert" AFTER INSERT ON "${table}"
        BEGIN
          INSERT INTO "SystemLedger" (
            tableName, recordId, actionType, oldValues, newValues, changedColumns, timestamp, sourceType
          ) VALUES (
            '${table}',
            CAST(NEW.id AS TEXT),
            'INSERT',
            NULL,
            json_object(${newColsJson}),
            NULL,
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            'SQL'
          );
        END;
      `;
      db.prepare(insertSql).run();
      // Create UPDATE trigger
      const updateSql = `
        CREATE TRIGGER "${table}_ledger_update" AFTER UPDATE ON "${table}"
        BEGIN
          INSERT INTO "SystemLedger" (
            tableName, recordId, actionType, oldValues, newValues, changedColumns, timestamp, sourceType
          ) VALUES (
            '${table}',
            CAST(NEW.id AS TEXT),
            'UPDATE',
            json_object(${oldColsJson}),
            json_object(${newColsJson}),
            json_array(${changedColsJson}),
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            'SQL'
          );
        END;
      `;
      db.prepare(updateSql).run();
      // Create DELETE trigger
      const deleteSql = `
        CREATE TRIGGER "${table}_ledger_delete" AFTER DELETE ON "${table}"
        BEGIN
          INSERT INTO "SystemLedger" (
            tableName, recordId, actionType, oldValues, newValues, changedColumns, timestamp, sourceType
          ) VALUES (
            '${table}',
            CAST(OLD.id AS TEXT),
            'DELETE',
            json_object(${oldColsJson}),
            NULL,
            NULL,
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            'SQL'
          );
        END;
      `;
      db.prepare(deleteSql).run();
    }
    // Record setup in AuditLog
    await prisma.auditLog.create({
      data: {
        action: "LEDGER_SETUP",
        details: `Ledger database triggers initialized successfully on 8 tables.`,
        entity: "Ledger",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to setup triggers:", error);
    return { success: false, error: (error as Error).message };
  } finally {
    db.close();
  }
}
// Seal unhashed ledger entries sequentially (Blockchain Hash Chain)
export async function sealLedgerPending() {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    // Find first unhashed record
    const unhashed = await prisma.systemLedger.findMany({
      where: { hashChain: null },
      orderBy: { id: "asc" },
    });
    if (unhashed.length === 0) {
      return { success: true, count: 0 };
    }
    for (const record of unhashed) {
      // Find parent record hash
      let parentHash = "";
      const parent = await prisma.systemLedger.findFirst({
        where: { id: { lt: record.id } },
        orderBy: { id: "desc" },
      });
      if (parent) {
        parentHash = parent.hashChain || "";
      } else {
        const lastArchivedSetting = await prisma.systemSetting
          .findUnique({
            where: { key: "LAST_ARCHIVED_LEDGER_HASH" },
          })
          .catch(() => null);
        parentHash = lastArchivedSetting?.value || "";
      }
      const hash = calculateLedgerHash(
        record.id,
        record.timestamp.toISOString(),
        record.tableName,
        record.recordId,
        record.actionType,
        record.oldValues,
        record.newValues,
        parentHash,
      );
      await prisma.systemLedger.update({
        where: { id: record.id },
        data: {
          hashChain: hash,
          checksum: crypto
            .createHash("md5")
            .update(record.newValues || record.oldValues || "")
            .digest("hex"),
          parentLedgerId: parent ? parent.id : null,
        },
      });
    }
    return { success: true, count: unhashed.length };
  } catch (error: unknown) {
    console.error("Failed to seal ledger:", error);
    return { success: false, error: (error as Error).message };
  }
}
// Get ledger status and verification
export async function verifyLedgerChain() {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    const records = await prisma.systemLedger.findMany({
      orderBy: { id: "asc" },
    });
    const lastArchivedSetting = await prisma.systemSetting
      .findUnique({
        where: { key: "LAST_ARCHIVED_LEDGER_HASH" },
      })
      .catch(() => null);
    let parentHash = lastArchivedSetting?.value || "";
    const corruptedIds: number[] = [];
    for (const record of records) {
      if (!record.hashChain) {
        // Unsealed records are not verified yet, but not corrupted
        continue;
      }
      const expectedHash = calculateLedgerHash(
        record.id,
        record.timestamp.toISOString(),
        record.tableName,
        record.recordId,
        record.actionType,
        record.oldValues,
        record.newValues,
        parentHash,
      );
      if (record.hashChain !== expectedHash) {
        corruptedIds.push(record.id);
      }
      parentHash = record.hashChain;
    }
    if (corruptedIds.length > 0) {
      return {
        success: false,
        status: "TAMPERED_ALERT",
        corruptedCount: corruptedIds.length,
        corruptedIds,
      };
    }
    return {
      success: true,
      status: "SECURE",
      totalCount: records.length,
    };
  } catch (error: unknown) {
    console.error("Failed to verify ledger:", error);
    return { success: false, error: (error as Error).message };
  }
}
// Get ledger logs list
export async function getLedgerList(filters?: {
  tableName?: string;
  actionType?: string;
  sourceType?: string;
  limit?: number;
}) {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    // Auto-seal pending logs to keep the chain fresh
    await sealLedgerPending().catch(() => {});
    const limit = filters?.limit || 100;
    const whereClause: any = {};
    if (filters?.tableName) whereClause.tableName = filters.tableName;
    if (filters?.actionType) whereClause.actionType = filters.actionType;
    if (filters?.sourceType) whereClause.sourceType = filters.sourceType;
    const logs = await prisma.systemLedger.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    const currentLedgerId = await getCurrentLedgerId();
    return { success: true, logs, currentLedgerId };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
// Rollback to specific Ledger Point
export async function rollbackToLedgerPoint(targetLedgerId: number) {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    const { default: Database } = await import("better-sqlite3");
    // 1. Create safety snapshot first
    const { triggerManualBackup } = await import("@/app/actions/backup");
    await triggerManualBackup({
      type: "DATABASE",
      creator: "LEDGER_SAFETY_SNAPSHOT",
      storage: "LOCAL",
    });
    // 2. Fetch all subsequent logs to revert, from newest to oldest
    const logsToRevert = await prisma.systemLedger.findMany({
      where: { id: { gte: targetLedgerId } },
      orderBy: { id: "desc" },
    });
    if (logsToRevert.length === 0) {
      throw new Error("No operations found to rollback.");
    }
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    // 3. Disconnect Prisma
    await prisma.$disconnect();
    const db = new Database(dbPath);
    try {
      // 4. Disable Foreign Keys check temporarily inside Transaction
      db.prepare("PRAGMA foreign_keys = OFF;").run();
      const rollbackTx = db.transaction(() => {
        for (const log of logsToRevert) {
          const table = log.tableName;
          if (log.actionType === "INSERT") {
            // INSERT -> DELETE
            db.prepare(`DELETE FROM "${table}" WHERE id = ?`).run(log.recordId);
          } else if (log.actionType === "DELETE") {
            // DELETE -> INSERT
            if (!log.oldValues) continue;
            const oldRow = JSON.parse(log.oldValues);
            const columns = Object.keys(oldRow)
              .map((k) => `"${k}"`)
              .join(", ");
            const placeholders = Object.keys(oldRow)
              .map(() => "?")
              .join(", ");
            const values = Object.values(oldRow);
            db.prepare(
              `INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`,
            ).run(...values);
          } else if (log.actionType === "UPDATE") {
            // UPDATE -> Restore oldValues
            if (!log.oldValues) continue;
            const oldRow = JSON.parse(log.oldValues);
            const sets = Object.keys(oldRow)
              .map((k) => `"${k}" = ?`)
              .join(", ");
            const values = Object.values(oldRow);
            db.prepare(`UPDATE "${table}" SET ${sets} WHERE id = ?`).run(
              ...values,
              log.recordId,
            );
          }
        }
      });
      rollbackTx();
      // 5. Re-enable and verify Foreign Keys constraints
      db.prepare("PRAGMA foreign_keys = ON;").run();
      const violations = db.prepare("PRAGMA foreign_key_check;").all();
      if (violations.length > 0) {
        throw new Error(
          `تعذر التراجع لوجود أخطاء في ترابط المفاتيح الأجنبية: ${JSON.stringify(violations)}`,
        );
      }
    } finally {
      db.close();
    }
    // 6. Reconnect Prisma
    await prisma.$connect();
    // 7. Update current ledger pointer
    await setCurrentLedgerId(targetLedgerId - 1);
    // 8. Record audit log
    await prisma.auditLog.create({
      data: {
        action: "LEDGER_ROLLBACK",
        details: `Rolled back database state to Ledger ID ${targetLedgerId}.`,
        entity: "Ledger",
        entityId: targetLedgerId.toString(),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });
    revalidatePath("/admin/settings/ledger");
    return { success: true };
  } catch (error: unknown) {
    console.error("Rollback error:", error);
    await prisma.$connect();
    return {
      success: false,
      error: (error as Error).message || "Failed to execute rollback",
    };
  }
}
// Rollforward to specific Ledger Point
export async function rollforwardToLedgerPoint(targetLedgerId: number) {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    const { default: Database } = await import("better-sqlite3");
    // 1. Create safety snapshot first
    const { triggerManualBackup } = await import("@/app/actions/backup");
    await triggerManualBackup({
      type: "DATABASE",
      creator: "LEDGER_SAFETY_SNAPSHOT",
      storage: "LOCAL",
    });
    const currentId = await getCurrentLedgerId();
    if (targetLedgerId <= currentId) {
      throw new Error(
        "Target Ledger ID must be greater than current active Ledger ID.",
      );
    }
    // 2. Fetch all future logs to apply, from oldest to newest (chronological order)
    const logsToApply = await prisma.systemLedger.findMany({
      where: {
        id: {
          gt: currentId,
          lte: targetLedgerId,
        },
      },
      orderBy: { id: "asc" },
    });
    if (logsToApply.length === 0) {
      throw new Error("No operations found to rollforward.");
    }
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    // 3. Disconnect Prisma
    await prisma.$disconnect();
    const db = new Database(dbPath);
    try {
      // 4. Disable Foreign Keys check temporarily inside Transaction
      db.prepare("PRAGMA foreign_keys = OFF;").run();
      const rollforwardTx = db.transaction(() => {
        for (const log of logsToApply) {
          const table = log.tableName;
          if (log.actionType === "INSERT") {
            // INSERT -> Re-insert newValues
            if (!log.newValues) continue;
            const newRow = JSON.parse(log.newValues);
            const columns = Object.keys(newRow)
              .map((k) => `"${k}"`)
              .join(", ");
            const placeholders = Object.keys(newRow)
              .map(() => "?")
              .join(", ");
            const values = Object.values(newRow);
            db.prepare(
              `INSERT OR REPLACE INTO "${table}" (${columns}) VALUES (${placeholders})`,
            ).run(...values);
          } else if (log.actionType === "DELETE") {
            // DELETE -> Re-delete
            db.prepare(`DELETE FROM "${table}" WHERE id = ?`).run(log.recordId);
          } else if (log.actionType === "UPDATE") {
            // UPDATE -> Re-apply newValues
            if (!log.newValues) continue;
            const newRow = JSON.parse(log.newValues);
            const sets = Object.keys(newRow)
              .map((k) => `"${k}" = ?`)
              .join(", ");
            const values = Object.values(newRow);
            db.prepare(`UPDATE "${table}" SET ${sets} WHERE id = ?`).run(
              ...values,
              log.recordId,
            );
          }
        }
      });
      rollforwardTx();
      // 5. Re-enable and verify Foreign Keys constraints
      db.prepare("PRAGMA foreign_keys = ON;").run();
      const violations = db.prepare("PRAGMA foreign_key_check;").all();
      if (violations.length > 0) {
        throw new Error(
          `تعذر التقدم لوجود أخطاء في ترابط المفاتيح الأجنبية: ${JSON.stringify(violations)}`,
        );
      }
    } finally {
      db.close();
    }
    // 6. Reconnect Prisma
    await prisma.$connect();
    // 7. Update current ledger pointer
    await setCurrentLedgerId(targetLedgerId);
    // 8. Record audit log
    await prisma.auditLog.create({
      data: {
        action: "LEDGER_ROLLFORWARD",
        details: `Rolled forward database state to Ledger ID ${targetLedgerId}.`,
        entity: "Ledger",
        entityId: targetLedgerId.toString(),
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });
    revalidatePath("/admin/settings/ledger");
    return { success: true };
  } catch (error: unknown) {
    console.error("Rollforward error:", error);
    await prisma.$connect();
    return {
      success: false,
      error: (error as Error).message || "Failed to execute rollforward",
    };
  }
}
// Simulate rollback or rollforward impacts (Dry-Run Mode)
export async function simulateTimeTravel(
  targetLedgerId: number,
  mode: "ROLLBACK" | "ROLLFORWARD",
) {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    let logs: any[] = [];
    if (mode === "ROLLBACK") {
      logs = await prisma.systemLedger.findMany({
        where: { id: { gte: targetLedgerId } },
        orderBy: { id: "desc" },
      });
    } else {
      const currentId = await getCurrentLedgerId();
      if (targetLedgerId <= currentId) {
        throw new Error(
          "Target Ledger ID must be greater than current active Ledger ID.",
        );
      }
      logs = await prisma.systemLedger.findMany({
        where: {
          id: {
            gt: currentId,
            lte: targetLedgerId,
          },
        },
        orderBy: { id: "asc" },
      });
    }
    const summary: Record<
      string,
      { inserts: number; updates: number; deletes: number }
    > = {};
    let totalInserts = 0;
    let totalUpdates = 0;
    let totalDeletes = 0;
    for (const log of logs) {
      if (!summary[log.tableName]) {
        summary[log.tableName] = { inserts: 0, updates: 0, deletes: 0 };
      }
      if (log.actionType === "INSERT") {
        if (mode === "ROLLBACK") {
          summary[log.tableName].deletes++; // INSERT is reverted by DELETE
          totalDeletes++;
        } else {
          summary[log.tableName].inserts++; // INSERT is applied by INSERT
          totalInserts++;
        }
      } else if (log.actionType === "DELETE") {
        if (mode === "ROLLBACK") {
          summary[log.tableName].inserts++; // DELETE is reverted by INSERT
          totalInserts++;
        } else {
          summary[log.tableName].deletes++; // DELETE is applied by DELETE
          totalDeletes++;
        }
      } else if (log.actionType === "UPDATE") {
        summary[log.tableName].updates++; // UPDATE is reverted/applied by UPDATE
        totalUpdates++;
      }
    }
    return {
      success: true,
      totalCount: logs.length,
      totalInserts,
      totalUpdates,
      totalDeletes,
      summary,
    };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
// Archive and Compress old ledger logs
export async function archiveOldLedger(beforeDateStr: string) {
  try {
    await requireRole(["SYSTEM_OWNER"]);
    const beforeDate = new Date(beforeDateStr);
    if (isNaN(beforeDate.getTime())) {
      throw new Error("Invalid date format.");
    }
    // Fetch logs to archive (must be sealed/hashed to protect chain integrity)
    const logsToArchive = await prisma.systemLedger.findMany({
      where: {
        timestamp: { lt: beforeDate },
        hashChain: { not: null },
      },
      orderBy: { id: "asc" },
    });
    if (logsToArchive.length === 0) {
      return {
        success: true,
        count: 0,
        message: "لا توجد سجلات مؤرشفة ومختومة قبل هذا التاريخ.",
      };
    }
    // Save the last archived hash Chain to protect integrity check
    const lastRecord = logsToArchive[logsToArchive.length - 1];
    if (lastRecord && lastRecord.hashChain) {
      await prisma.systemSetting.upsert({
        where: { key: "LAST_ARCHIVED_LEDGER_HASH" },
        update: { value: lastRecord.hashChain },
        create: {
          key: "LAST_ARCHIVED_LEDGER_HASH",
          value: lastRecord.hashChain,
        },
      });
    }
    // Serialize and compress
    const jsonStr = JSON.stringify(logsToArchive, null, 2);
    const compressedBuffer = await gzip(Buffer.from(jsonStr));
    const archiveDir = path.join(process.cwd(), "backups", "ledger");
    await fs.mkdir(archiveDir, { recursive: true });
    const filename = `ledger_archive_${Date.now()}.json.gz`;
    const filePath = path.join(archiveDir, filename);
    await fs.writeFile(filePath, compressedBuffer);
    // Delete archived logs
    const ids = logsToArchive.map((l) => l.id);
    await prisma.systemLedger.deleteMany({
      where: { id: { in: ids } },
    });
    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: "LEDGER_ARCHIVE",
        details: `Archived and pruned ${ids.length} old ledger logs to file ${filename}.`,
        entity: "Ledger",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });
    revalidatePath("/admin/settings/ledger");
    return { success: true, count: ids.length, filename };
  } catch (error: unknown) {
    console.error("Archive error:", error);
    return { success: false, error: (error as Error).message };
  }
}
