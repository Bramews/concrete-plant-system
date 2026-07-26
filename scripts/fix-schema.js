const fs = require("fs");
const path = "d:\\concrete-plant-system\\prisma\\schema.prisma";

const contentToAppend = `

model InventoryTransaction {
  id         Int      @id @default(autoincrement())
  companyId  Int
  company    Company  @relation(fields: [companyId], references: [id])
  materialId Int
  material   Material @relation(fields: [materialId], references: [id])
  type       String
  quantity   Float
  reference  String?
  timestamp  DateTime @default(now())

  @@index([materialId, timestamp])
  @@index([companyId])
}

model Vehicle {
  id        Int     @id @default(autoincrement())
  companyId Int
  company   Company @relation(fields: [companyId], references: [id])
  code      String
  name      String?
  type      String
  status    String  @default("ACTIVE")
  location  String  @default("OUTSIDE")

  lastEntryAt DateTime?
  lastExitAt  DateTime?
  details     String?

  @@unique([companyId, code])
  @@index([companyId])
}
`;

fs.appendFileSync(path, contentToAppend);
console.log("Appended models to schema.prisma");
