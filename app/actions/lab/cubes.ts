"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { RoleType } from "@/lib/types/auth";
import { Specimen, calculateCompressiveStrength } from "@/lib/lab/calculations";

// -- Permissions --
const CAN_EDIT_LAB = [
  "LAB_TECH",
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "LAB_TECHNICIAN",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_APPROVE_LAB = [
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_DELETE_LAB = ["LAB_MANAGER", "MANAGER", "SYSTEM_OWNER"];

function checkPermission(
  role: RoleType,
  action: "EDIT" | "APPROVE" | "DELETE",
) {
  let allowed = CAN_EDIT_LAB;
  if (action === "APPROVE") allowed = CAN_APPROVE_LAB;
  if (action === "DELETE") allowed = CAN_DELETE_LAB;

  const roleName =
    typeof role === "string" ? role : (role as { name: string }).name;

  if (!allowed.includes(roleName)) {
    throw new Error("غير مصرح لك بالقيام بهذا الإجراء في المختبر");
  }
}

export async function addMultipleCubeResults(data: {
  orderId: number;
  sampleDate: Date;
  labStandardId?: string;
  standardSnapshot?: string; // JSON
  tests: {
    age: number;
    kn: number;
  }[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "EDIT");

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { mixDesign: true },
  });

  let targetStrength = 30;
  if (order?.mixDesign?.strengthClass) {
    const match = order.mixDesign.strengthClass.match(/\d+/);
    if (match) targetStrength = parseInt(match[0]);
  }

  const createdTests = await prisma.$transaction(
    data.tests.map((t) => {
      let mpa = 0;
      if (data.standardSnapshot) {
        try {
          const snapshot = JSON.parse(data.standardSnapshot);
          const specimen: Specimen = {
            shape: snapshot.shape || "CUBE",
            dimensions: snapshot.dimensions || { width: 150, height: 150 },
          };

          const calc = calculateCompressiveStrength(
            t.kn,
            "kN",
            specimen,
            snapshot.code || "BS_1881",
          );

          mpa = calc.strength;
        } catch (e) {
          console.error("Failed to calc strength from snapshot", e);
          const AREA_MM2 = 22500;
          mpa = Number(((t.kn * 1000) / AREA_MM2).toFixed(2));
        }
      } else {
        const AREA_MM2 = 22500;
        mpa = Number(((t.kn * 1000) / AREA_MM2).toFixed(2));
      }

      let result = "PENDING";
      if (mpa >= targetStrength) result = "PASS";
      else result = "FAIL";

      return prisma.cubeTest.create({
        data: {
          orderId: data.orderId,
          sampleDate: data.sampleDate,
          age: t.age,
          kn: t.kn,
          mpa: mpa,
          result: result,
          status: "PENDING",
          creatorName: user.name,
          labStandardId: data.labStandardId,
          standardSnapshot: data.standardSnapshot,
        },
      });
    }),
  );

  revalidatePath("/system/lab");
  return createdTests;
}

export async function approveCubeResult(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "APPROVE");

  await prisma.cubeTest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approverName: user.name,
    },
  });
  revalidatePath("/system/lab");
}

export async function deleteCubeResult(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "DELETE");

  await prisma.cubeTest.delete({
    where: { id },
  });

  revalidatePath("/system/lab");
}

export async function updateCubeResult(
  id: number,
  data: {
    kn: number;
    age: number;
    sampleDate: Date;
    standardSnapshot?: string;
  },
) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "EDIT");

  let mpa = 0;
  if (data.standardSnapshot) {
    try {
      const snapshot = JSON.parse(data.standardSnapshot);
      const specimen: Specimen = {
        shape: snapshot.shape || "CUBE",
        dimensions: snapshot.dimensions || { width: 150, height: 150 },
      };
      const calc = calculateCompressiveStrength(
        data.kn,
        "kN",
        specimen,
        snapshot.code || "BS_1881",
      );
      mpa = calc.strength;
    } catch (e) {
      console.error("Recalc failed", e);
      mpa = Number(((data.kn * 1000) / 22500).toFixed(2));
    }
  } else {
    mpa = Number(((data.kn * 1000) / 22500).toFixed(2));
  }

  await prisma.cubeTest.update({
    where: { id },
    data: {
      kn: data.kn,
      mpa: mpa,
      age: data.age,
      sampleDate: data.sampleDate,
      standardSnapshot: data.standardSnapshot,
    },
  });

  revalidatePath("/system/lab");
}
