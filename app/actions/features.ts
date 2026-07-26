"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import crypto from "crypto";

export async function toggleFeature(featureId: string) {
  await requireRole(["SYSTEM_OWNER"]);

  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
  });

  if (!feature) {
    throw new Error("Feature not found");
  }

  await prisma.feature.update({
    where: { id: featureId },
    data: { globalEnabled: !feature.globalEnabled },
  });

  await prisma.companyActivityLog.create({
    data: {
      id: crypto.randomUUID(),
      companyId: 1, // System Log placeholder
      type: "FEATURE_TOGGLE",
      severity: "WARNING",
      message: `Feature ${featureId} was ${!feature.globalEnabled ? "ENABLED" : "DISABLED"} globally`,
    },
  });

  revalidatePath("/admin/features");
}
