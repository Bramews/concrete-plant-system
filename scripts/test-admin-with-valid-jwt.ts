import { createSession } from "../lib/session";
import { signJWT } from "../lib/security/jwt";
import { prisma } from "../lib/prisma";

async function testAdmin() {
  const user = await prisma.user.findFirst({
    where: { username: "Ahmed" },
  });

  if (!user) {
    console.error("User Ahmed not found");
    return;
  }

  const { token: sessionToken } = await createSession(user.id, undefined);
  const authToken = await signJWT(
    {
      userId: user.id,
      role: "SYSTEM_OWNER",
      companyId: null,
    },
    7 * 24 * 3600,
  );

  console.log("Tokens generated successfully.");
  const cookieHeader = `session_token=${sessionToken}; auth_token=${authToken}; device_uuid=test-device-uuid; language=ar; NEXT_LOCALE=ar`;

  console.log(
    "Sending GET http://localhost:3000/admin with valid SYSTEM_OWNER tokens...",
  );
  const t0 = Date.now();
  try {
    const res = await fetch("http://localhost:3000/admin", {
      headers: { cookie: cookieHeader },
      redirect: "manual",
    });
    console.log(`Response in ${Date.now() - t0}ms, status: ${res.status}`);
    const text = await res.text();
    console.log(
      "Response body length:",
      text.length,
      "Snippet:",
      text.slice(0, 300),
    );
  } catch (err) {
    console.error("Fetch error after", Date.now() - t0, "ms:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testAdmin();
