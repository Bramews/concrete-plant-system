-- CreateIndex
CREATE INDEX "CubeTest_orderId_idx" ON "CubeTest"("orderId");

-- CreateIndex
CREATE INDEX "CubeTest_status_idx" ON "CubeTest"("status");

-- CreateIndex
CREATE INDEX "CubeTest_sampleDate_idx" ON "CubeTest"("sampleDate");

-- CreateIndex
CREATE INDEX "Material_status_idx" ON "Material"("status");

-- CreateIndex
CREATE INDEX "Material_createdAt_idx" ON "Material"("createdAt");

-- CreateIndex
CREATE INDEX "MaterialRejection_materialId_idx" ON "MaterialRejection"("materialId");

-- CreateIndex
CREATE INDEX "MaterialRejection_status_idx" ON "MaterialRejection"("status");

-- CreateIndex
CREATE INDEX "MaterialRejection_createdAt_idx" ON "MaterialRejection"("createdAt");

-- CreateIndex
CREATE INDEX "MixDesign_companyId_idx" ON "MixDesign"("companyId");

-- CreateIndex
CREATE INDEX "MixDesign_status_idx" ON "MixDesign"("status");

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "SieveAnalysis_materialId_idx" ON "SieveAnalysis"("materialId");

-- CreateIndex
CREATE INDEX "SieveAnalysis_status_idx" ON "SieveAnalysis"("status");

-- CreateIndex
CREATE INDEX "UsageCounter_companyId_idx" ON "UsageCounter"("companyId");

-- CreateIndex
CREATE INDEX "UsageEvent_companyId_idx" ON "UsageEvent"("companyId");

-- CreateIndex
CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_type_idx" ON "Vehicle"("type");
