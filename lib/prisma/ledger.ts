import { Prisma } from "@prisma/client";
import { headers } from "next/headers";

const AUDITED_MODELS = [
  "User",
  "Company",
  "Order",
  "MixDesign",
  "MixComponent",
  "CubeTest",
  "SieveAnalysis",
  "LabApproval",
];

// Helper to determine source type
async function determineSourceType(): Promise<string> {
  try {
    // If running in Edge Runtime, default to UI
    if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge") {
      return "User Interface";
    }

    const reqHeaders = await headers();
    const referer = reqHeaders.get("referer") || "";
    // If it's an API route or has an api-like header
    if (referer.includes("/api/") || reqHeaders.get("x-next-api") === "true") {
      return "API";
    }
    return "User Interface";
  } catch {
    // Outside request context (running as script/CLI/AI)
    if (
      typeof process !== "undefined" &&
      (process.env.AI_AGENT === "true" ||
        process.env.USER === "ai" ||
        process.env.USERNAME === "ai")
    ) {
      return "AI Agent";
    }

    // Dynamic access to process.argv to bypass Next.js Edge static analysis
    if (typeof process !== "undefined") {
      const argv = (process as any)["argv"];
      if (
        argv &&
        Array.isArray(argv) &&
        argv.some(
          (arg: string) =>
            arg.includes("script") ||
            arg.includes("seed") ||
            arg.includes("scratch"),
        )
      ) {
        return "Script";
      }
    }
    return "Prisma";
  }
}

// Dynamically resolve session without module import cycles
async function getSessionUser(client: any): Promise<number | null> {
  try {
    // Cannot run session DB checks on Edge runtime easily
    if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge") {
      return null;
    }

    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get("cookie") || "";
    const match = cookieHeader.match(/session_token=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return null;

    // Use dynamic import of crypto to avoid Edge runtime compilation errors
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const session = await (client as any).session.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });

    return session?.userId || null;
  } catch {
    return null;
  }
}

export const ledgerExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: "ledger-enrichment",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query, ...rest }) {
          // 1. Run the query first
          const result = await query(args);

          // 2. If it's an audited model and a write operation, enrich the ledger
          if (model && AUDITED_MODELS.includes(model)) {
            const isWrite = [
              "create",
              "update",
              "delete",
              "upsert",
              "createMany",
              "updateMany",
              "deleteMany",
            ].includes(operation);

            if (isWrite) {
              // Bypass completely on Edge Runtime or inside transactions to prevent deadlocks
              if (
                (typeof process !== "undefined" &&
                  process.env.NEXT_RUNTIME === "edge") ||
                (args && (args as any).__bypassLedger)
              ) {
                return result;
              }

              // Run ledger enrichment in a non-blocking asynchronous microtask to prevent transaction deadlocks
              setTimeout(async () => {
                try {
                  const sourceType = await determineSourceType();
                  const resObj = result as any;
                  let recordIds: string[] = [];
                  if (resObj && typeof resObj === "object") {
                    if (Array.isArray(resObj)) {
                      recordIds = resObj
                        .map((r: any) => (r && r.id ? String(r.id) : ""))
                        .filter(Boolean);
                    } else if (resObj.id) {
                      recordIds = [String(resObj.id)];
                    }
                  }

                  if (recordIds.length > 0) {
                    await (client as any).systemLedger
                      .updateMany({
                        where: {
                          tableName: model,
                          recordId: { in: recordIds },
                          sourceType: "SQL",
                          userId: null,
                        },
                        data: {
                          sourceType,
                        },
                      })
                      .catch(() => null);
                  }
                } catch (err) {
                  // Ignore background enrichment errors
                }
              }, 0);
            }
          }

          return result;
        },
      },
    },
  });
});
