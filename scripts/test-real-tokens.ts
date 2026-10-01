import { authenticateUserAction } from "../app/actions/auth";

async function testLoginAndAdmin() {
  console.log("1. Authenticating Ahmed / 123 via authenticateUserAction...");
  const formData = new FormData();
  formData.append("username", "Ahmed");
  formData.append("password", "123");

  const t0 = Date.now();
  const res = await authenticateUserAction(formData);
  console.log(`authenticateUserAction finished in ${Date.now() - t0}ms:`, res);
}

testLoginAndAdmin().catch(console.error);
