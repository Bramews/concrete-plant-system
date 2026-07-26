export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

export function extractSubdomain(host: string): string | null {
  // Expected format: {slug}.yoursystem.com or {slug}.localhost:3000
  // For development: {slug}.localhost or {slug}.localhost:3000

  const parts = host.split(".");

  // Development: slug.localhost or slug.localhost:3000
  if (parts.length >= 2 && parts[parts.length - 1].includes("localhost")) {
    return parts[0];
  }

  // Production: slug.yoursystem.com
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export async function resolveCompanyFromSubdomain(
  subdomain: string,
): Promise<number | null> {
  const { prisma } = await import("./prisma");

  const company = await prisma.company.findUnique({
    where: { slug: subdomain },
    select: { id: true, status: true },
  });

  if (!company || company.status !== "ACTIVE") {
    return null;
  }

  return company.id;
}
