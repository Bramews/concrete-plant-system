import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/security/crypto";

export interface TicketData {
  orderId: number;
  mixDesignCode: string;
  quantity: number;
  driverName: string;
  truckNumber: string;
  timestamp: Date;
  companyId: number | null;
}

/**
 * Generates a SHA-256 hash chained to the previous ticket in the database.
 */
export async function generateTicketHash(data: TicketData): Promise<string> {
  // Find the last delivery ticket in the system to chain the hash
  const lastTicket = await prisma.deliveryTicket.findFirst({
    where: data.companyId ? { companyId: data.companyId } : undefined,
    orderBy: { createdAt: "desc" },
    select: { deliveryHash: true },
  });

  const prevHash = lastTicket?.deliveryHash || "GENESIS_BLOCK_HASH";

  const payload = [
    data.orderId,
    data.mixDesignCode,
    data.quantity,
    data.driverName,
    data.truckNumber,
    data.timestamp.toISOString(),
    prevHash,
  ].join("|");

  return sha256(payload);
}

/**
 * Returns the public QR code verification URL.
 */
export function generateQRUrl(hash: string, origin: string): string {
  const verificationUrl = `${origin}/verify/${hash}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
}
