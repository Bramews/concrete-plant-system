import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  // Simple decoding (In real app, verify signature)
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (!payload.userId) return null;
    return { id: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
