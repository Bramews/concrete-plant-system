import { PrismaClient } from "../prisma/generated-client";
import { softDeleteExtension } from "./prisma/soft-delete";
import { ledgerExtension } from "./prisma/ledger";
import { tenancyExtension } from "./prisma/tenancy";

// Professional Soft Delete Protection
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return client
    .$extends(softDeleteExtension)
    .$extends(ledgerExtension)
    .$extends(tenancyExtension);
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Global Prisma Client with Soft Delete
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
