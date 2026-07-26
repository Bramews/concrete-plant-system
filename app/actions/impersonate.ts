"use server";
// ⚠️ DEPRECATED: هذا الملف معطّل ومُستبدل بـ sovereign-user-actions.ts
// لا تستخدم هذه الدوال — استخدم الدوال في sovereign-user-actions.ts بدلاً منها

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function impersonateUser(targetUserId: number) {
  const cookieStore = await cookies();

  // 1. Verify verify Admin
  // (In real app, decode token and check SYSTEM_OWNER role)
  // For now assuming middleware let us through or we double check here

  // if (!adminUser) throw new Error("Unauthorized");

  // 2. Create Impersonation Session
  const session = await prisma.impersonationSession.create({
    data: {
      id: `imp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      systemOwnerId: 1, // Replace with actual admin ID
      targetUserId,
      reason: "Admin Support",
    },
  });

  // 3. Mint Token for Target User
  // In real app, call your auth provider to mint a token for targetUserId
  const spoofedToken = `IMPERSONATED_${session.id}_${targetUserId}`;

  // 4. Set Cookie
  cookieStore.set("auth_token", spoofedToken);
  cookieStore.set("impersonation_id", session.id);

  redirect("/");
}

export async function stopImpersonating() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("impersonation_id")?.value;

  if (sessionToken) {
    await prisma.impersonationSession.update({
      where: { id: sessionToken },
      data: { endedAt: new Date() },
    });
  }

  // Restore admin token?
  // Usually you'd store the original admin token in a separate httpOnly cookie like "admin_auth_token"
  // and swap it back.

  cookieStore.delete("auth_token");
  cookieStore.delete("impersonation_id");

  // Redirect to admin login or dashboard
  redirect("/admin");
}
