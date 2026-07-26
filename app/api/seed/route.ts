import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";

export async function GET() {
  try {
    console.log("--- INTERNAL SEED START ---");
    const ownerEmail = "ahmed@concrete.com";
    const hashedPassword = await hashPassword("123");

    const user = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {
        username: "Ahmed",
        password: hashedPassword,
        status: "ACTIVE",
      },
      create: {
        username: "Ahmed",
        name: "Ahmed Aziz",
        email: ownerEmail,
        password: hashedPassword,
        status: "ACTIVE",
        canRegisterMaterials: true,
      },
    });

    console.log("Internal seed success for Ahmed:", user.username);
    return NextResponse.json({ success: true, user: user.username });
  } catch (error: unknown) {
    console.error("Internal seed failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
