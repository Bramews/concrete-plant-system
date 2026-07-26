/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `MixDesign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `OperationalExpense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MixDesign" ADD COLUMN "strengthClass" TEXT;

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "originalData" TEXT,
    "newData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requesterId" INTEGER NOT NULL,
    "approverId" INTEGER,
    "reason" TEXT,
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChangeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChangeRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscriptionId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "reason" TEXT,
    "decidedAt" DATETIME,
    "decidedBy" INTEGER,
    CONSTRAINT "BillingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemPolicy" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LandingPageConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "heroTitleAr" TEXT NOT NULL,
    "heroTitleEn" TEXT NOT NULL,
    "heroSubtitleAr" TEXT NOT NULL,
    "heroSubtitleEn" TEXT NOT NULL,
    "ctaTextAr" TEXT NOT NULL,
    "ctaTextEn" TEXT NOT NULL,
    "loginTextAr" TEXT NOT NULL,
    "loginTextEn" TEXT NOT NULL,
    "headerLogoTextAr" TEXT NOT NULL DEFAULT 'كونكريت كور',
    "headerLogoTextEn" TEXT NOT NULL DEFAULT 'Concrete Core',
    "headerLogoInitial" TEXT NOT NULL DEFAULT 'C',
    "backgroundStyle" TEXT NOT NULL DEFAULT 'blob',
    "primaryColor" TEXT NOT NULL DEFAULT 'indigo',
    "features" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegisterPageConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "subtitleAr" TEXT NOT NULL,
    "subtitleEn" TEXT NOT NULL,
    "companyNameAr" TEXT NOT NULL,
    "companyNameEn" TEXT NOT NULL,
    "subdomainAr" TEXT NOT NULL,
    "subdomainEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "emailAr" TEXT NOT NULL,
    "emailEn" TEXT NOT NULL,
    "passwordAr" TEXT NOT NULL,
    "passwordEn" TEXT NOT NULL,
    "phoneAr" TEXT NOT NULL,
    "phoneEn" TEXT NOT NULL,
    "submitTextAr" TEXT NOT NULL,
    "submitTextEn" TEXT NOT NULL,
    "loginLinkTextAr" TEXT NOT NULL,
    "loginLinkTextEn" TEXT NOT NULL,
    "brandingNameAr" TEXT NOT NULL,
    "brandingNameEn" TEXT NOT NULL,
    "backgroundStyle" TEXT NOT NULL DEFAULT 'blob',
    "primaryColor" TEXT NOT NULL DEFAULT 'indigo',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LabApproval" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "details" TEXT,
    "mixData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabApproval_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LabApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LabApproval" ("createdAt", "details", "id", "mixData", "orderId", "status", "userId") SELECT "createdAt", "details", "id", "mixData", "orderId", "status", "userId" FROM "LabApproval";
DROP TABLE "LabApproval";
ALTER TABLE "new_LabApproval" RENAME TO "LabApproval";
CREATE UNIQUE INDEX "LabApproval_orderId_key" ON "LabApproval"("orderId");
CREATE TABLE "new_CubeTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "sampleDate" DATETIME NOT NULL,
    "age" INTEGER NOT NULL,
    "kn" REAL,
    "mpa" REAL,
    "result" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" INTEGER,
    "labStandardId" TEXT,
    "standardSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CubeTest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CubeTest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CubeTest_labStandardId_fkey" FOREIGN KEY ("labStandardId") REFERENCES "LabStandard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CubeTest" ("age", "approvedById", "createdAt", "id", "kn", "mpa", "orderId", "result", "sampleDate", "status", "updatedAt") SELECT "age", "approvedById", "createdAt", "id", "kn", "mpa", "orderId", "result", "sampleDate", "status", "updatedAt" FROM "CubeTest";
DROP TABLE "CubeTest";
ALTER TABLE "new_CubeTest" RENAME TO "CubeTest";
CREATE INDEX "CubeTest_orderId_idx" ON "CubeTest"("orderId");
CREATE INDEX "CubeTest_status_idx" ON "CubeTest"("status");
CREATE INDEX "CubeTest_sampleDate_idx" ON "CubeTest"("sampleDate");
CREATE TABLE "new_Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxUsers" INTEGER NOT NULL,
    "maxStorage" INTEGER NOT NULL,
    "maxOrders" INTEGER NOT NULL,
    "maxProjects" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("createdAt", "description", "features", "id", "key", "maxOrders", "maxProjects", "maxStorage", "maxUsers", "name", "updatedAt") SELECT "createdAt", "description", "features", "id", "key", "maxOrders", "maxProjects", "maxStorage", "maxUsers", "name", "updatedAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");
CREATE TABLE "new_OperationalExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OperationalExpense" ("amount", "details", "id", "timestamp", "type") SELECT "amount", "details", "id", "timestamp", "type" FROM "OperationalExpense";
DROP TABLE "OperationalExpense";
ALTER TABLE "new_OperationalExpense" RENAME TO "OperationalExpense";
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "subscriptionId" INTEGER,
    "ticketId" INTEGER,
    "orderId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
    "stripeId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "hostedUrl" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "DeliveryTicket" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("amount", "companyId", "createdAt", "currency", "hostedUrl", "id", "paidAt", "pdfUrl", "status", "stripeId", "subscriptionId", "updatedAt") SELECT "amount", "companyId", "createdAt", "currency", "hostedUrl", "id", "paidAt", "pdfUrl", "status", "stripeId", "subscriptionId", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_ticketId_key" ON "Invoice"("ticketId");
CREATE UNIQUE INDEX "Invoice_stripeId_key" ON "Invoice"("stripeId");
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");
CREATE INDEX "Invoice_ticketId_idx" ON "Invoice"("ticketId");
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "projectId" INTEGER,
    "mixDesignId" INTEGER,
    "labStandardId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "volume" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "actualQuantity" REAL NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "approvedById" INTEGER,
    "labApprovedAt" DATETIME,
    "productionStartedAt" DATETIME,
    "dispatchedAt" DATETIME,
    "accountingClosedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_mixDesignId_fkey" FOREIGN KEY ("mixDesignId") REFERENCES "MixDesign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_labStandardId_fkey" FOREIGN KEY ("labStandardId") REFERENCES "LabStandard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("accountingClosedAt", "actualQuantity", "approvedById", "companyId", "createdAt", "createdById", "customerId", "date", "dispatchedAt", "id", "labApprovedAt", "mixDesignId", "orderNumber", "productionStartedAt", "projectId", "status", "updatedAt", "volume") SELECT "accountingClosedAt", "actualQuantity", "approvedById", "companyId", "createdAt", "createdById", "customerId", "date", "dispatchedAt", "id", "labApprovedAt", "mixDesignId", "orderNumber", "productionStartedAt", "projectId", "status", "updatedAt", "volume" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_companyId_status_createdAt_id_idx" ON "Order"("companyId", "status", "createdAt", "id");
CREATE INDEX "Order_companyId_idx" ON "Order"("companyId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_date_idx" ON "Order"("date");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_companyId_orderNumber_key" ON "Order"("companyId", "orderNumber");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "MixDesign_companyId_code_key" ON "MixDesign"("companyId", "code");
