import { proxy } from "../proxy";
import { NextRequest } from "next/server";
import { createSession } from "../lib/session";
import { signJWT } from "../lib/security/jwt";
import { prisma } from "../lib/prisma";

async function testProxy() {
  console.log("1. Finding user Ahmed...");
  const ownerUser = await prisma.user.findFirst({
    where: { username: "Ahmed" },
  });
  const ownerAuth = await signJWT(
    { userId: ownerUser!.id, role: "SYSTEM_OWNER", companyId: null },
    3600,
  );
  const { token: ownerSession } = await createSession(ownerUser!.id, undefined);

  console.log("2. Simulating request to /admin in proxy.ts...");
  const req = new NextRequest("http://localhost:3000/admin", {
    headers: {
      cookie: `session_token=${ownerSession}; auth_token=${ownerAuth}; NEXT_LOCALE=ar; device_uuid=uuid1`,
      host: "localhost:3000",
    },
  });

  const t0 = Date.now();
  console.log("Calling proxy(req)...");
  try {
    const res = await proxy(req);
    console.log(
      `proxy(req) completed in ${Date.now() - t0}ms! Status: ${res.status}`,
    );
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
  } catch (err) {
    console.error(`proxy(req) failed in ${Date.now() - t0}ms:`, err);
  }

  await prisma.$disconnect();
}

testProxy();
