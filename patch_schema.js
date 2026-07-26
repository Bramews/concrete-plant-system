const fs = require("fs");

const temp = fs.readFileSync("prisma/temp.prisma", "utf8");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

// 1. Add missing models at the end
const sieveCategoryModel = temp
  .split("model SieveCategory")[1]
  .split("model ")[0];
if (!schema.includes("model SieveCategory")) {
  schema += "\n\nmodel SieveCategory" + sieveCategoryModel;
}

const sieveDefinitionModel = temp
  .split("model SieveDefinition")[1]
  .split("model ")[0];
if (!schema.includes("model SieveDefinition")) {
  schema += "\nmodel SieveDefinition" + sieveDefinitionModel;
}

// 2. Inject missing fields into MixDesign
if (!schema.includes("isCurrent")) {
  schema = schema.replace(
    /model MixDesign \{/,
    `model MixDesign {
  version          Int            @default(1)
  isCurrent        Boolean        @default(true)
  isFrozen         Boolean        @default(false)
  parentMixId      Int?
  changeNote       String?
  parentMix        MixDesign?     @relation("MixDesignHistory", fields: [parentMixId], references: [id])
  revisions        MixDesign[]    @relation("MixDesignHistory")
`,
  );
}

// 3. Inject missing fields into SieveAnalysis
if (!schema.includes("clayContent")) {
  schema = schema.replace(
    /model SieveAnalysis \{/,
    `model SieveAnalysis {
  clayContent      Float?
  companyId        Int?
  dryWeight        Float?
  fieldNo          String?
  finenessModulus  Float?
  inspectorName    String?
  labNo            String?
  location         String?
  moistureContent  Float?
  projectName      String?
  results          String?
  sampleDate       DateTime?
  source           String?
  supplier         String?
  testDate         DateTime?
  washWeight       Float?
  appliedStandards String?
  zone             String?
  company          Company?       @relation(fields: [companyId], references: [id], onDelete: Cascade)
`,
  );
}

// 4. Inject missing fields into Material
if (!schema.includes("sieveCategoryId")) {
  schema = schema.replace(
    /model Material \{/,
    `model Material {
  deletedAt        DateTime?
  sieveCategoryId  String?
  sieveCategory    SieveCategory? @relation(fields: [sieveCategoryId], references: [id])
`,
  );
}

// 5. BackupRecord
if (!schema.includes("durationMs")) {
  schema = schema.replace(
    /model BackupRecord \{/,
    `model BackupRecord {
  creator          String?   @default("SYSTEM")
  durationMs       Int?      @default(0)
  encrypted        Boolean?  @default(false)
  integrityHash    String?
  storage          String?   @default("LOCAL")
  type             String?   @default("DATABASE")
`,
  );
}

// 6. Others
if (!schema.includes("deletedAt") && schema.includes("model Customer {")) {
  schema = schema.replace(
    /model Customer \{/,
    `model Customer {\n  deletedAt        DateTime?\n`,
  );
}

["CuringPond", "MixComponent", "CubeTest", "DeliveryTicket", "Batch"].forEach(
  (m) => {
    const regex = new RegExp(`model ${m} \\{`);
    if (schema.match(regex) && !schema.split(regex)[1].includes("companyId")) {
      schema = schema.replace(regex, `model ${m} {\n  companyId Int?`);
    }
  },
);

fs.writeFileSync("prisma/schema.prisma", schema);
console.log("Schema updated.");
