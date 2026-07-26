import { Prisma } from "@prisma/client";

// List of models that have the deletedAt field and should be soft-deleted
const SOFT_DELETE_MODELS = [
  "Company",
  "Order",
  "Material",
  "Vehicle",
  "MixDesign",
  "Customer",
  "Project",
];

export const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async delete({ model, args }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return (client as any)[model].delete(args);
          }
          const modelClient = (client as any)[model];
          return modelClient.update({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async deleteMany({ model, args }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return (client as any)[model].deleteMany(args);
          }
          const modelClient = (client as any)[model];
          return modelClient.updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async findFirst({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return query(args);
          }
          const { includeDeleted, ...rest } = args as any;
          if (includeDeleted) {
            return query(rest);
          }
          rest.where = { ...rest.where, deletedAt: null };
          return query(rest);
        },
        async findMany({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return query(args);
          }
          const { includeDeleted, ...rest } = args as any;
          if (includeDeleted) {
            return query(rest);
          }
          rest.where = { ...rest.where, deletedAt: null };
          return query(rest);
        },
        async findUnique({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return query(args);
          }
          const { includeDeleted, ...rest } = args as any;
          if (includeDeleted) {
            return query(rest);
          }
          return query(rest);
        },
        async count({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return query(args);
          }
          const { includeDeleted, ...rest } = args as any;
          if (includeDeleted) {
            return query(rest);
          }
          rest.where = { ...rest.where, deletedAt: null };
          return query(rest);
        },
      },
    },
    model: {
      $allModels: {
        async findDeleted<T>(this: T, args?: any) {
          const context = Prisma.getExtensionContext(this);
          const model = (context as any).name || (this as any).name;
          // In some versions context.name works, otherwise we might need other ways to get model name
          // But for now we'll assume the context carries enough info or check if it supports it.
          return (context as any).findMany({
            ...(args || {}),
            where: {
              ...args?.where,
              deletedAt: { not: null },
            },
            includeDeleted: true,
          });
        },
        async restore<T>(this: T, id: number | string) {
          const context = Prisma.getExtensionContext(this);
          return (context as any).update({
            where: { id },
            data: { deletedAt: null },
          });
        },
      },
    },
  });
});
