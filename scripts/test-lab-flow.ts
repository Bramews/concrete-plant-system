import { createSession } from "../lib/session";
import { prisma } from "../lib/prisma";

async function testLab() {
  const user = await prisma.user.findFirst({
    where: { username: "cube@demo-plant" },
    include: { company: true },
  });

  console.log("Lab user:", user?.username, user?.id, user?.companyId);
  if (!user) return;

  const { token } = await createSession(user.id, user.companyId || undefined);
  console.log("Session token created:", token.slice(0, 20) + "...");

  const cookieHeader = `session_token=${token}; auth_token=${token}; device_uuid=test-uuid; language=ar; NEXT_LOCALE=ar`;

  console.log("Sending GET http://localhost:3000/system/lab ...");
  const t0 = Date.now();
  try {
    const res = await fetch("http://localhost:3000/system/lab", {
      headers: { cookie: cookieHeader },
      redirect: "manual",
    });
    console.log(`Response in ${Date.now() - t0}ms, status: ${res.status}`);
    const text = await res.text();
    console.log("Body length:", text.length, "Sample:", text.slice(0, 200));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testLab();
