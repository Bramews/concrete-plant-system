import { prisma } from "@/lib/prisma";

/**
 * Export all data related to a single company.
 * This ensures tenant isolation in backups, unlike global SQL dumps.
 */
export async function exportCompanyData(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    // Include ALL relations that are strictly tenant-scoped
    include: {
      users: {
        include: {
          preferences: true,
          memberships: true,
        },
      },
      domains: true,
      projects: {
        include: {
          orders: {
            include: {
              batches: {
                include: {
                  ticket: {
                    include: {
                      testResults: true,
                      invoice: true,
                    },
                  },
                },
              },
              approval: true,
            },
          },
        },
      },
      mixDesigns: true,
      customers: true,
      auditLogs: true, // Crucial for compliance
      license: true,
      subscription: {
        include: {
          invoices: {
            include: {
              paymentRecords: true,
              ledgerEntries: true,
            },
          },
          billingEvents: true,
        },
      },
      features: true,
      invites: true,

      // Operational Logs
      behaviorLogs: true,
      ledgerEntries: true,
    } as any,
  });

  if (!company) throw new Error(`Company ID ${companyId} not found.`);

  return JSON.stringify(company, null, 2);
}

/**
 * Verification Plan (Stub):
 * In a real restore scenario, we would allow uploading this JSON,
 * parsing it, and inserting it into a fresh standard Company template with new IDs,
 * mapping the old references.
 */
export async function verifyBackupIntegrity(jsonData: string) {
  try {
    const data = JSON.parse(jsonData);
    if (!data.id || !data.slug || !data.users) {
      return { valid: false, reason: "Missing core fields" };
    }
    return { valid: true, version: "0.1" };
  } catch (e) {
    return { valid: false, reason: "Invalid JSON" };
  }
}
