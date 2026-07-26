-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "systemOwnerId" INTEGER,
    "companyId" INTEGER,
    "action" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "prevStatus" TEXT,
    "newStatus" TEXT,
    "details" TEXT,
    "correlationId" TEXT,
    "requestId" TEXT,
    "durationMs" INTEGER,
    "reason" TEXT,
    "policyVersion" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_systemOwnerId_fkey" FOREIGN KEY ("systemOwnerId") REFERENCES "SystemOwner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "companyId", "correlationId", "details", "durationMs", "entity", "entityId", "id", "newStatus", "policyVersion", "prevStatus", "reason", "requestId", "role", "systemOwnerId", "timestamp", "userId") SELECT "action", "companyId", "correlationId", "details", "durationMs", "entity", "entityId", "id", "newStatus", "policyVersion", "prevStatus", "reason", "requestId", "role", "systemOwnerId", "timestamp", "userId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_companyId_timestamp_idx" ON "AuditLog"("companyId", "timestamp");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
