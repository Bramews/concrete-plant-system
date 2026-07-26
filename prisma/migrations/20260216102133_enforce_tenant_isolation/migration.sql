/*
  Warnings:

  - You are about to drop the column `error` on the `WebhookEvent` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `InventoryTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "LabStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "year" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TestMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "warningMin" REAL,
    "warningMax" REAL,
    "rejectMin" REAL,
    "rejectMax" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TestMethod_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "LabStandard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" INTEGER,
    "materialId" INTEGER,
    "methodId" TEXT NOT NULL,
    "testedById" INTEGER NOT NULL,
    "testedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" REAL,
    "readings" TEXT,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "approvedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QualityTest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityTest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityTest_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "TestMethod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualityTest_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualityTest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabReportConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "companyNameAr" TEXT,
    "companyNameEn" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "reportTitleAr" TEXT NOT NULL DEFAULT 'شهادة فحص مختبري',
    "reportTitleEn" TEXT NOT NULL DEFAULT 'Laboratory Test Certificate',
    "footerText" TEXT,
    "showQrCode" BOOLEAN NOT NULL DEFAULT true,
    "showSignature" BOOLEAN NOT NULL DEFAULT true,
    "signatureText" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#000000',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LabReportConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT NOT NULL DEFAULT 'OUTSIDE',
    "lastEntryAt" DATETIME,
    "lastExitAt" DATETIME,
    "details" TEXT,
    CONSTRAINT "Vehicle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("code", "details", "id", "lastEntryAt", "lastExitAt", "location", "name", "status", "type") SELECT "code", "details", "id", "lastEntryAt", "lastExitAt", "location", "name", "status", "type" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE INDEX "Vehicle_companyId_idx" ON "Vehicle"("companyId");
CREATE UNIQUE INDEX "Vehicle_companyId_code_key" ON "Vehicle"("companyId", "code");
CREATE TABLE "new_WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT,
    "eventId" TEXT,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WebhookEvent" ("createdAt", "eventId", "id", "payload", "provider", "status", "type") SELECT "createdAt", "eventId", "id", "payload", "provider", "status", "type" FROM "WebhookEvent";
DROP TABLE "WebhookEvent";
ALTER TABLE "new_WebhookEvent" RENAME TO "WebhookEvent";
CREATE TABLE "new_Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "stock" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("code", "createdAt", "id", "name", "status", "stock", "unit", "updatedAt") SELECT "code", "createdAt", "id", "name", "status", "stock", "unit", "updatedAt" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE INDEX "Material_companyId_idx" ON "Material"("companyId");
CREATE UNIQUE INDEX "Material_companyId_name_key" ON "Material"("companyId", "name");
CREATE TABLE "new_InventoryTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "reference" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryTransaction" ("id", "materialId", "quantity", "reference", "timestamp", "type") SELECT "id", "materialId", "quantity", "reference", "timestamp", "type" FROM "InventoryTransaction";
DROP TABLE "InventoryTransaction";
ALTER TABLE "new_InventoryTransaction" RENAME TO "InventoryTransaction";
CREATE INDEX "InventoryTransaction_materialId_timestamp_idx" ON "InventoryTransaction"("materialId", "timestamp");
CREATE INDEX "InventoryTransaction_companyId_idx" ON "InventoryTransaction"("companyId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "LabStandard_code_key" ON "LabStandard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestMethod_standardId_code_key" ON "TestMethod"("standardId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LabReportConfig_companyId_key" ON "LabReportConfig"("companyId");
