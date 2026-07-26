"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";

export async function createCustomer(formData: FormData) {
  await requireRole([
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
  ]);

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;
  const email = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const customer = await prisma.customer.create({
    data: {
      companyId: user.companyId,
      name,
      phone,
      email,
      address,
    },
  });

  await logEvent({
    action: "CUSTOMER_CREATE",
    entity: "Customer",
    entityId: customer.id,
    details: `Created customer ${name}`,
  });

  revalidatePath("/system/sales/customers");
}

export async function updateCustomer(formData: FormData) {
  await requireRole([
    "SALES",
    "SALES_REP",
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
  ]);

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;
  const email = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;

  // Security check: Ensure customer belongs to user's company
  const result = await prisma.customer.updateMany({
    where: {
      id,
      companyId: user.companyId,
    },
    data: { name, phone, email, address },
  });

  if (result.count === 0) {
    throw new Error("Customer not found or access denied");
  }

  await logEvent({
    action: "CUSTOMER_UPDATE",
    entity: "Customer",
    entityId: id,
    details: `Updated customer ID ${id}`,
  });

  revalidatePath("/system/sales/customers");
}

export async function archiveCustomer(formData: FormData) {
  await requireRole([
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
  ]);

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string);

  const result = await prisma.customer.updateMany({
    where: {
      id,
      companyId: user.companyId,
    },
    data: { deletedAt: new Date() },
  });

  if (result.count === 0) {
    throw new Error("Customer not found or access denied");
  }

  await logEvent({
    action: "CUSTOMER_ARCHIVE",
    entity: "Customer",
    entityId: id,
    details: `Archived customer ID ${id}`,
  });

  revalidatePath("/system/sales/customers");
}

export async function deleteCustomer(formData: FormData) {
  // Using Soft Delete for deleteCustomer as well to preserve relations
  await requireRole([
    "SALES_MANAGER",
    "MANAGER",
    "COMPANY_ADMIN",
    "SYSTEM_OWNER",
  ]);

  const user = await getCurrentUser();
  // Even System Owner should probably specify scope, but for now assuming context
  // If System Owner is operating without companyId context, this might fail unless we check logic
  // But typically System Owner acts WITHIN a company context for these actions.
  if (!user?.companyId) throw new Error("Context required");

  const id = parseInt(formData.get("id") as string);

  const result = await prisma.customer.updateMany({
    where: {
      id,
      companyId: user.companyId,
    },
    data: { deletedAt: new Date() },
  });

  if (result.count === 0) {
    throw new Error("Customer not found or access denied");
  }

  await logEvent({
    action: "CUSTOMER_DELETE",
    entity: "Customer",
    entityId: id,
    details: `Customer ID ${id} deleted by SYSTEM_OWNER`,
  });

  revalidatePath("/system/sales/customers");
}
