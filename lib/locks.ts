import { prisma } from "./prisma";

/**
 * Logical Lock: Prevents concurrent operations on the same resource.
 */
export async function acquireLock(resourceId: string, ttlMs: number = 30000) {
  const now = new Date();

  // Clean up expired locks first
  await prisma.resourceLock.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  try {
    await prisma.resourceLock.create({
      data: {
        resourceId,
        expiresAt: new Date(now.getTime() + ttlMs),
      },
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function releaseLock(resourceId: string) {
  try {
    await prisma.resourceLock.delete({
      where: { resourceId },
    });
  } catch (e) {
    // Already released or doesn't exist
  }
}

/**
 * Idempotency: Stores and checks request tokens.
 */
export async function checkIdempotency(token: string) {
  const record = await prisma.idempotencyRecord.findUnique({
    where: { id: token },
  });

  if (record && record.expiresAt > new Date()) {
    return record.response ? JSON.parse(record.response) : true;
  }
  return null;
}

export async function saveIdempotency(
  token: string,
  response: any,
  ttlMs: number = 3600000,
) {
  await prisma.idempotencyRecord.upsert({
    where: { id: token },
    update: {
      response: JSON.stringify(response),
      expiresAt: new Date(Date.now() + ttlMs),
    },
    create: {
      id: token,
      response: JSON.stringify(response),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
}
