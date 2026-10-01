import { createSession } from "../lib/session";
import { signJWT } from "../lib/security/jwt";
import { prisma } from "../lib/prisma";

async function testRoutes() {
  const ownerUser = await prisma.user.findFirst({
    where: { username: "Ahmed" },
  });
  const labUser = await prisma.user.findFirst({
    where: { username: "cube@demo-plant" },
  });

  const ownerAuth = await signJWT(
    { userId: ownerUser!.id, role: "SYSTEM_OWNER", companyId: null },
    3600,
  );
  const { token: ownerSession } = await createSession(ownerUser!.id, undefined);

  const labAuth = await signJWT(
    { userId: labUser!.id, role: "LAB_TECH", companyId: labUser!.companyId },
    3600,
  );
  const { token: labSession } = await createSession(
    labUser!.id,
    labUser!.companyId || undefined,
  );

  const tests = [
    { name: "Public: /login", url: "http://localhost:3000/login", cookie: "" },
    { name: "Public: /", url: "http://localhost:3000/", cookie: "" },
    {
      name: "Owner: /admin",
      url: "http://localhost:3000/admin",
      cookie: `session_token=${ownerSession}; auth_token=${ownerAuth}; NEXT_LOCALE=ar; device_uuid=uuid1`,
    },
    {
      name: "Lab: /system/lab",
      url: "http://localhost:3000/system/lab",
      cookie: `session_token=${labSession}; auth_token=${labAuth}; NEXT_LOCALE=ar; device_uuid=uuid2`,
    },
  ];

  for (const t of tests) {
    console.log(`\nTesting ${t.name}...`);
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(t.url, {
        headers: t.cookie ? { cookie: t.cookie } : {},
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log(
        `[${t.name}] Status: ${res.status} in ${Date.now() - start}ms`,
      );
      if (res.status === 307 || res.status === 302) {
        console.log(`[${t.name}] Location: ${res.headers.get("location")}`);
      }
    } catch (e) {
      console.error(
        `[${t.name}] FAILED after ${Date.now() - start}ms:`,
        e.message,
      );
    }
  }

  await prisma.$disconnect();
}

testRoutes();
