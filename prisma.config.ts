// prisma.config.ts
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  const filename = connectionString?.replace("file:", "") || "items.db";

  const db = new Database(filename);
  const adapter = new PrismaBetterSqlite3(db);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
