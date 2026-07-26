"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface SearchResult {
  id: string | number;
  type: "ORDER" | "CUSTOMER" | "PROJECT" | "TICKET" | "MATERIAL" | "REPORT";
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
}

/**
 * Global Multi-Table Search Action
 * Performs indexed text searches across key entities, restricted by tenant ID.
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const user = await getCurrentUser();
  if (!user?.companyId || query.length < 2) return [];

  const companyId = user.companyId;
  const searchTerm = query.toLowerCase();

  try {
    const [orders, customers, projects, tickets, materials] = await Promise.all(
      [
        // 1. Search Orders by Number
        prisma.order.findMany({
          where: {
            companyId,
            orderNumber: { contains: searchTerm },
          },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customer: { select: { name: true } },
          },
        }),

        // 2. Search Customers by Name
        prisma.customer.findMany({
          where: {
            companyId,
            name: { contains: searchTerm },
          },
          take: 5,
          select: { id: true, name: true, phone: true },
        }),

        // 3. Search Projects by Name
        prisma.project.findMany({
          where: {
            companyId,
            name: { contains: searchTerm },
          },
          take: 5,
          select: { id: true, name: true, location: true },
        }),

        // 4. Search Tickets by Number
        prisma.deliveryTicket.findMany({
          where: {
            companyId,
            ticketNumber: { contains: searchTerm },
          },
          take: 5,
          select: { id: true, ticketNumber: true, truckNumber: true },
        }),

        // 5. Search Materials by Name
        prisma.material.findMany({
          where: {
            companyId,
            name: { contains: searchTerm },
          },
          take: 5,
          select: { id: true, name: true, stock: true },
        }),
      ],
    );

    const results: SearchResult[] = [];

    orders.forEach((o) =>
      results.push({
        id: o.id,
        type: "ORDER",
        title: `الطلب #${o.orderNumber}`,
        subtitle: o.customer?.name,
        badge: o.status,
        href: `/system/orders/${o.id}`,
      }),
    );

    customers.forEach((c) =>
      results.push({
        id: c.id,
        type: "CUSTOMER",
        title: c.name,
        subtitle: c.phone || undefined,
        href: `/system/crm/customers/${c.id}`,
      }),
    );

    projects.forEach((p) =>
      results.push({
        id: p.id,
        type: "PROJECT",
        title: p.name,
        subtitle: p.location || undefined,
        href: `/system/crm/projects?id=${p.id}`,
      }),
    );

    tickets.forEach((t) =>
      results.push({
        id: t.id,
        type: "TICKET",
        title: `تذكرة #${t.ticketNumber}`,
        subtitle: `شاحنة: ${t.truckNumber}`,
        href: `/system/tickets/${t.id}`,
      }),
    );

    materials.forEach((m) =>
      results.push({
        id: m.id,
        type: "MATERIAL",
        title: m.name,
        subtitle: `المخزون الحالي: ${m.stock} طن`,
        href: `/system/inventory?materialId=${m.id}`,
      }),
    );

    return results;
  } catch (error) {
    console.error("[globalSearch] Error:", error);
    return [];
  }
}
