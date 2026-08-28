import { PrismaClient } from "../prisma/generated-client";
import { softDeleteExtension } from "./prisma/soft-delete";
import { ledgerExtension } from "./prisma/ledger";
import { tenancyExtension } from "./prisma/tenancy";

import fs from "fs";
import path from "path";

function ensureServerlessDb() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    try {
      const tmpDbPath = "/tmp/dev.db";
      if (!fs.existsSync(tmpDbPath)) {
        const candidates = [
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join(process.cwd(), "dev.db"),
        ];
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, tmpDbPath);
            break;
          }
        }
      }
      process.env.DATABASE_URL = "file:/tmp/dev.db";
    } catch (e) {
      console.error("[Prisma] Failed to prepare /tmp/dev.db on serverless:", e);
    }
  }
}

ensureServerlessDb();

// Professional Soft Delete Protection
const prismaClientSingleton = () => {
  ensureServerlessDb();
  const client = new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: process.env.DATABASE_URL,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return client
    .$extends(softDeleteExtension)
    .$extends(ledgerExtension)
    .$extends(tenancyExtension);
};

declare global {
  var prismaExtendedGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Global Prisma Client with Soft Delete
export const prisma =
  globalThis.prismaExtendedGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production")
  globalThis.prismaExtendedGlobal = prisma;
