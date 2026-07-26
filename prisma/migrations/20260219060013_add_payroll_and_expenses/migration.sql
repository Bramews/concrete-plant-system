/*
  Warnings:

  - You are about to drop the column `type` on the `OperationalExpense` table. All the data in the column will be lost.
  - You are about to drop the column `branding` on the `Company` table. All the data in the column will be lost.
  - Added the required column `category` to the `OperationalExpense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MixDesign" ADD COLUMN "targetAir" REAL;
ALTER TABLE "MixDesign" ADD COLUMN "targetDensity" REAL;
ALTER TABLE "MixDesign" ADD COLUMN "targetSlump" REAL;
ALTER TABLE "MixDesign" ADD COLUMN "targetWC" REAL;

-- CreateTable
CREATE TABLE "Payroll" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payroll_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MixComponent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mixDesignId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "materialName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MixComponent_mixDesignId_fkey" FOREIGN KEY ("mixDesignId") REFERENCES "MixDesign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MixComponent_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyBranding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "logoText" TEXT DEFAULT 'N',
    "systemName" TEXT DEFAULT 'Neon-Lab',
    "subtitle" TEXT,
    "loginButton" TEXT DEFAULT 'تسجيل الدخول',
    "primaryColor" TEXT DEFAULT '#6366f1',
    "secondaryColor" TEXT DEFAULT '#a855f7',
    "accentColor" TEXT DEFAULT '#22d3ee',
    "homeButtonShow" BOOLEAN NOT NULL DEFAULT true,
    "homeButtonTextAr" TEXT DEFAULT 'الرئيسية',
    "homeButtonTextEn" TEXT DEFAULT 'HOME',
    "homeButtonSize" TEXT DEFAULT '15px',
    "homeButtonWeight" TEXT DEFAULT 'font-extrabold',
    "homeButtonTracking" TEXT DEFAULT 'tracking-[0.3em]',
    "homeButtonColor" TEXT,
    "homeButtonAnimation" TEXT DEFAULT 'breath',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyBranding_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OperationalExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "details" TEXT,
    "reference" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OperationalExpense" ("amount", "companyId", "details", "id", "timestamp") SELECT "amount", "companyId", "details", "id", "timestamp" FROM "OperationalExpense";
DROP TABLE "OperationalExpense";
ALTER TABLE "new_OperationalExpense" RENAME TO "OperationalExpense";
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "phone" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Baghdad',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "units" TEXT NOT NULL DEFAULT 'metric',
    "taxRules" TEXT,
    "invoiceSettings" TEXT,
    "numberingRules" TEXT,
    "featureFlags" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspensionLevel" TEXT NOT NULL DEFAULT 'NONE',
    "gracePeriodEndsAt" DATETIME
);
INSERT INTO "new_Company" ("address", "createdAt", "currency", "deletedAt", "featureFlags", "gracePeriodEndsAt", "id", "invoiceSettings", "isLocked", "language", "name", "numberingRules", "phone", "slug", "status", "suspensionLevel", "taxRules", "timezone", "units") SELECT "address", "createdAt", "currency", "deletedAt", "featureFlags", "gracePeriodEndsAt", "id", "invoiceSettings", "isLocked", "language", "name", "numberingRules", "phone", "slug", "status", "suspensionLevel", "taxRules", "timezone", "units" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "MixComponent_mixDesignId_idx" ON "MixComponent"("mixDesignId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyBranding_companyId_key" ON "CompanyBranding"("companyId");
