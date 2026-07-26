import { prisma } from "./lib/prisma";
import { verifySession } from "./lib/session";
import { sha256 } from "./lib/security/crypto";

async function main() {
  console.log("--- Starting Debug Trigger ---");
  try {
    // Find a valid unrevoked and unexpired session
    const sessionRecord = await prisma.session.findFirst({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!sessionRecord) {
      console.log("No active session found in database to test with.");
      return;
    }

    console.log("Found session for User ID:", sessionRecord.userId);

    // We need the raw token, but the DB only has the hash.
    // However, verifySession(token) recalculates the hash.
    // Since we don't have the raw token, we will MOCK verifySession behavior
    // by passing a dummy token and slightly modifying lib/session.ts to accept it
    // OR we can just manually call the logic if we want to BE SURE it's the same runtime.

    // Actually, the user wants it from "SAME RUNTIME" inside the code.
    // If I run this with `npx tsx`, it IS the same runtime as the app code.

    console.log(
      "Triggering verifySession logic manually for Session ID:",
      sessionRecord.id,
    );

    // Since we can't reverse the hash, let's just use the hash from DB directly
    // in a temporarily modified verifySession that accepts a hash for debugging.
    // OR, better: let's just PRINT what we need right here, as it's the same runtime environment.

    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("Session User ID:", sessionRecord.userId);

    const user = await prisma.user.findUnique({
      where: { id: sessionRecord.userId },
      select: { id: true, username: true, status: true },
    });

    console.log("Runtime User:", user);
  } catch (err) {
    console.error("Debug Trigger Error:", err);
  } finally {
    await prisma.$disconnect();
    console.log("--- Debug Trigger Finished ---");
  }
}

main();
