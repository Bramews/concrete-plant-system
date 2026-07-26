import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export function checkCompanyStatus(
  company: { status: string; isLocked: boolean; name?: string } | null,
  bypassForOwner = false,
) {
  if (bypassForOwner) return { isLocked: false };

  if (!company) {
    throw new Error("Company not found");
  }

  // 1. Strict Suspend
  if (company.status === "SUSPENDED") {
    throw new Error("COMPANY_SUSPENDED");
  }

  // 2. Lock Logic (Read-Only)
  if (company.isLocked) {
    return { isLocked: true };
  }

  return { isLocked: false };
}

export async function enforceCompanyStatus(
  companyId: number,
  bypassForOwner = false,
) {
  if (bypassForOwner) return { isLocked: false };

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true, isLocked: true, name: true },
  });

  return checkCompanyStatus(company, bypassForOwner);
}

// Simple in-memory rate limiter (Proof of Concept for Phase 0)
// In production, replace with Redis
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  companyId: number,
  limit = 100,
  windowMs = 60000,
) {
  const key = String(companyId);
  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, timestamp: now };

  if (now - record.timestamp > windowMs) {
    record.count = 0;
    record.timestamp = now;
  }

  record.count++;
  requestCounts.set(key, record);

  if (record.count > limit) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }
}

export async function verifyActionSafety(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true, isLocked: true },
  });

  if (company?.status === "SUSPENDED") {
    throw new Error("Action blocked: Company is SUSPENDED.");
  }

  if (company?.isLocked) {
    throw new Error("Action blocked: Company is LOCKED (Read-Only).");
  }
}
