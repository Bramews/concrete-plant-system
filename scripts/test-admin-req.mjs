import { PrismaClient } from "../prisma/generated-client/index.js";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_for_development_and_offline_mode_only_32bytes"
);

async function testAdminWithAuth() {
  const user = await prisma.user.findFirst({
    where: { username: "Ahmed" },
    include: { company: true },
  });

  console.log("Found user:", user?.username, user?.role);
  if (!user) return;

  const token = await new SignJWT({
    userId: user.id,
    companyId: user.companyId || 0,
    role: user.role,
    tenantId: user.company?.subdomain || "default",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  console.log("Generated token:", token.slice(0, 30) + "...");

  const cookieHeader = `session_token=${token}; auth_token=${token}; device_uuid=test-uuid; language=ar; NEXT_LOCALE=ar`;

  console.log("Sending GET /admin with cookies...");
  const t0 = Date.now();
  try {
    const res = await fetch("http://localhost:3000/admin", {
      headers: {
        cookie: cookieHeader,
      },
    });
    console.log(`Response received in ${Date.now() - t0}ms! Status: ${res.status}`);
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("HTML snippet:", html.slice(0, 300));
  } catch (err) {
    console.error("Fetch error after", Date.now() - t0, "ms:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminWithAuth();
