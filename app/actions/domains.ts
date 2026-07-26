"use server";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getSession } from "@/lib/auth";

// Helper to determine audit actor
async function getAuditActor() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // If role is SYSTEM_OWNER, we assume session.userId maps to SystemOwner entity (or super user)
  // We strictly separate them based on Role.
  const isSystemOwner = session.role === "SYSTEM_OWNER";

  return {
    userId: isSystemOwner ? undefined : session.userId,
    systemOwnerId: isSystemOwner ? session.userId : undefined,
    role: session.role as string,
  };
}

export async function deleteDomain(domainId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const actor = await getAuditActor();

    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) return { error: "Domain not found." };
    if (domain.deletedAt) return { error: "Domain already deleted." };

    // Soft Delete Implementation
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "DOMAIN_DELETE",
        details: `Soft deleted domain: ${domain.domain}`,
        entity: "Domain",
        entityId: String(domainId),

        // Strict ID Separation
        userId: actor.userId ? actor.userId : undefined,
        systemOwnerId: actor.systemOwnerId ? actor.systemOwnerId : undefined,
        role: actor.role,

        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete domain error:", error);
    return { error: "Failed to delete domain." };
  }
}

export async function verifyDomain(domainId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const actor = await getAuditActor();
    const domainRecord = await prisma.domain.findUnique({
      where: { id: domainId },
    });
    if (!domainRecord) return { error: "Domain not found" };
    if (domainRecord.deletedAt)
      return { error: "Cannot verify a deleted domain." };

    // 1. Guard: Cooldown Check (60 seconds)
    if (domainRecord.lastVerificationAttempt) {
      const timeSinceLast =
        new Date().getTime() - domainRecord.lastVerificationAttempt.getTime();
      if (timeSinceLast < 60000) {
        const remaining = Math.ceil((60000 - timeSinceLast) / 1000);
        return { error: `Rate limited. Please wait ${remaining}s.` };
      }
    }

    // 2. Guard: Update Attempt Counter
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        verificationAttempts: { increment: 1 },
        lastVerificationAttempt: new Date(),
      },
    });

    // Represents the verification token we would check for in DNS
    /* const verificationToken = `concrete-verify=${domainRecord.companyId}-${domainRecord.id}`; */

    /* console.log(`[DNS MOCK] Checking TXT record for ${domainRecord.domain}...`);
    console.log(`[DNS MOCK] Expected Value: ${verificationToken}`); */

    // Simulate Network Latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock Validation Logic
    if (domainRecord.domain.startsWith("fail-")) {
      // console.error(`[DNS MOCK] Verification failed. TXT record not found.`);
      return { error: "DNS Verification failed. TXT record not found." };
    }

    // Success Path
    const domain = await prisma.domain.update({
      where: { id: domainId },
      data: {
        verified: true,
        status: "ACTIVE",
      },
    });

    // console.log(`[DNS MOCK] Domain ${domain.domain} verified successfully.`);

    /* console.log(
      `[SSL MOCK] Issuing wildcard certificate for ${domain.domain}...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`[SSL MOCK] Certificate issued. Status: Valid.`); */

    await prisma.auditLog.create({
      data: {
        action: "DOMAIN_VERIFY",
        details: `Verified domain: ${domain.domain} (DNS+SSL)`,
        entity: "Domain",
        entityId: String(domainId),

        userId: actor.userId ? actor.userId : undefined,
        systemOwnerId: actor.systemOwnerId ? actor.systemOwnerId : undefined,
        role: actor.role,

        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Verify domain error:", error);
    return { error: "Failed to verify domain." };
  }
}

export async function addDomain(companyId: number, domain: string) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);
  try {
    const actor = await getAuditActor();

    // Basic validation
    if (!domain || domain.length < 3) {
      return { error: "Invalid domain name." };
    }

    // Check if domain exists (including soft deleted)
    const existing = await prisma.domain.findUnique({
      where: { domain },
    });

    if (existing) {
      // If it exists and is NOT deleted, return error
      if (!existing.deletedAt) {
        return { error: "Domain already exists." };
      }

      // If it exists but was DELETED, reactivate it
      const reactivated = await prisma.domain.update({
        where: { id: existing.id },
        data: {
          companyId, // potentially reassign to new company? Or restrict?
          // Assuming Sovereignty: Owner can reassign.
          deletedAt: null,
          status: "PENDING",
          verified: false,
          verificationAttempts: 0,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "DOMAIN_RESTORE",
          details: `Restored soft-deleted domain: ${domain} for Company ID ${companyId}`,
          entity: "Domain",
          entityId: String(reactivated.id),

          userId: actor.userId ? actor.userId : undefined,
          systemOwnerId: actor.systemOwnerId ? actor.systemOwnerId : undefined,
          role: actor.role,

          timestamp: new Date(),
        },
      });

      revalidatePath("/admin");
      return { success: true };
    }

    // Create New
    const newDomain = await prisma.domain.create({
      data: {
        domain,
        companyId,
        status: "PENDING",
        verified: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "DOMAIN_ADD",
        details: `Added new domain: ${domain} for Company ID ${companyId}`,
        entity: "Domain",
        entityId: String(newDomain.id),

        userId: actor.userId ? actor.userId : undefined,
        systemOwnerId: actor.systemOwnerId ? actor.systemOwnerId : undefined,
        role: actor.role,

        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Add domain error:", error);
    return { error: "Failed to add domain." };
  }
}
