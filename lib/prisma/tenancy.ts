import { Prisma } from "@prisma/client";
import { TENANTED_MODELS } from "../tenancy";

// ─── تصنيف عمليات Prisma حسب طريقة حقن companyId ───

// عمليات تحقن في args.where
const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

// عمليات تحقن في args.data (إنشاء مفرد)
const CREATE_OPS = new Set(["create"]);

// عمليات تحقن في كل عنصر من args.data (إنشاء متعدد)
const CREATE_MANY_OPS = new Set(["createMany", "createManyAndReturn"]);

// عمليات تستخدم فحص ما بعد الاستعلام (لا تحقن في where)
const UNIQUE_OPS = new Set(["findUnique", "findUniqueOrThrow"]);

/**
 * استخراج companyId الصريح من الـ args حسب نوع العملية.
 * يُستخدم لمعرفة هل المطور مرر companyId بنفسه أم لا.
 */
function getExplicitCompanyId(
  operation: string,
  args: Record<string, unknown>,
): number | undefined {
  if (!args) return undefined;
  const where = args.where as Record<string, unknown> | undefined;
  if (where?.companyId !== undefined && typeof where.companyId === "number")
    return where.companyId;

  const data = args.data as Record<string, unknown> | undefined;
  if (data?.companyId !== undefined && typeof data.companyId === "number")
    return data.companyId;

  if (CREATE_MANY_OPS.has(operation)) {
    const d = args.data;
    if (Array.isArray(d) && d.length > 0 && d[0]?.companyId !== undefined)
      return d[0].companyId as number;
  }

  const create = args.create as Record<string, unknown> | undefined;
  if (create?.companyId !== undefined && typeof create.companyId === "number")
    return create.companyId;

  return undefined;
}

/**
 * حقن companyId في المكان الصحيح حسب نوع العملية.
 */
function injectCompanyId(
  operation: string,
  args: Record<string, unknown>,
  companyId: number,
): void {
  if (UNIQUE_OPS.has(operation)) {
    // findUnique / findUniqueOrThrow: لا نحقن في where، نخزّن للفحص بعد الاستعلام
    args.__enforceCompanyId = companyId;
    return;
  }

  if (WHERE_OPS.has(operation)) {
    // عمليات القراءة والتحديث والحذف: نحقن في where
    if (!args.where) args.where = {};
    (args.where as Record<string, unknown>).companyId = companyId;
    return;
  }

  if (CREATE_OPS.has(operation)) {
    // create: نحقن في data — ليس where!
    if (!args.data) args.data = {};
    (args.data as Record<string, unknown>).companyId = companyId;
    return;
  }

  if (CREATE_MANY_OPS.has(operation)) {
    // createMany / createManyAndReturn: نحقن في كل عنصر من data
    if (Array.isArray(args.data)) {
      args.data.forEach((item: unknown) => {
        (item as Record<string, unknown>).companyId = companyId;
      });
    } else if (args.data) {
      (args.data as Record<string, unknown>).companyId = companyId;
    }
    return;
  }

  if (operation === "upsert") {
    // upsert: نحقن في where (للبحث) و create (للإنشاء إذا لم يوجد)
    if (!args.where) args.where = {};
    (args.where as Record<string, unknown>).companyId = companyId;
    if (!args.create) args.create = {};
    (args.create as Record<string, unknown>).companyId = companyId;
    // لا نحقن في update — التحديث لا يغيّر الشركة
    return;
  }
}

export const tenancyExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: "tenancy-isolation",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args: rawArgs, query }) {
          const args = rawArgs as Record<string, unknown>;

          // إذا الموديل ليس من الموديلات المشتركة، نفّذ بدون تدخل
          if (
            !model ||
            !(TENANTED_MODELS as readonly string[]).includes(model)
          ) {
            return query(args);
          }

          // إذا تم طلب تخطي العزل صراحةً (للمطورين)
          if (args && args.__bypassTenancy) {
            delete args.__bypassTenancy;
            return query(args);
          }

          // جلب الجلسة الحالية
          const { getSession } = await import("../auth");
          let session = null;
          try {
            session = await getSession();
          } catch (e) {
            // session unavailable in background/async context
          }

          // استخراج companyId الصريح (إذا مرره المطور بنفسه)
          const explicitCompanyId = getExplicitCompanyId(operation, args);

          if (explicitCompanyId === undefined) {
            // ── لا يوجد companyId صريح — نحتاج جلسة للحقن التلقائي ──

            // 🔱 SYSTEM_OWNER يتجاوز كل قيود العزل — بغض النظر عن وجود companyId
            if (session && session.role === "SYSTEM_OWNER") {
              return query(args);
            }

            if (session && session.companyId !== undefined) {
              // حقن companyId في المكان الصحيح حسب نوع العملية
              injectCompanyId(operation, args, session.companyId);
            } else {
              // لا توجد جلسة ولا companyId صريح ──
              // نسمح بالاستعلام لبعض الجداول أو الاستعلامات الموجهة برمز فريد صريح
              const allowedGuestModels = [
                "User",
                "Invite",
                "Domain",
                "Subscription",
                "Material",
                "Batch",
                "DeliveryTicket",
                "InventoryTransaction",
              ];
              const whereObj = args.where as
                | Record<string, unknown>
                | undefined;
              const hasUniqueId =
                whereObj &&
                (whereObj.id !== undefined ||
                  whereObj.ticketNumber !== undefined ||
                  whereObj.batchId !== undefined);

              if (
                (!session && model && allowedGuestModels.includes(model)) ||
                hasUniqueId
              ) {
                return query(args);
              }

              // خلاف ذلك، خطأ عزل المستأجر
              throw new Error("Context Missing & No Explicit ID");
            }
          } else {
            // ── companyId مقدم صراحة — نتحقق من المطابقة ──

            if (
              session &&
              session.role !== "SYSTEM_OWNER" &&
              session.companyId !== undefined
            ) {
              if (explicitCompanyId !== session.companyId) {
                throw new Error(
                  `Tenant Isolation Violation: Requested companyId ${explicitCompanyId} does not match session companyId ${session.companyId}`,
                );
              }
            }
          }

          // ── تنفيذ الاستعلام ──
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const enforcedId = (args as any)?.__enforceCompanyId;
          if (enforcedId !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (args as any).__enforceCompanyId;
          }

          const result = await query(args);

          // ── فحص ما بعد الاستعلام لعمليات findUnique ──
          if (UNIQUE_OPS.has(operation) && result && enforcedId !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((result as any).companyId !== enforcedId) {
              return null;
            }
          }

          return result;
        },
      },
    },
  });
});
