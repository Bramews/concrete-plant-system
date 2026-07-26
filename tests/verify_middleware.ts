import { proxy as middleware } from "../proxy";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("🔒 Starting Middleware Access Control Verification...");

  const createReq = (path: string, role?: string) => {
    const url = `http://localhost:3000${path}`;
    const req = new NextRequest(new URL(url));
    req.headers.set("host", "localhost:3000");
    if (role) {
      const payload = JSON.stringify({ userId: 1, role });
      const token = Buffer.from(payload).toString("base64");
      req.cookies.set("auth_token", token);
      req.cookies.set("session_token", "dummy_session_token");
    }
    return req;
  };

  const results = [];

  // Test 1: Public Access (Login)
  try {
    const req = createReq("/login");
    const res = await middleware(req);
    // Should be next() -> status undefined/200 or generic response, NO redirect
    const isRedirect =
      res?.status === 307 ||
      res?.status === 302 ||
      res?.headers.has("location");
    results.push({
      test: "Public Login Access",
      success: !isRedirect,
      detail: isRedirect ? "Redirected" : "Allowed",
    });
  } catch (e) {
    const error = e as Error;
    results.push({
      test: "Public Login Access",
      success: false,
      detail: error.message,
    });
  }

  // Test 2: Admin Access as SYSTEM_OWNER
  try {
    const req = createReq("/admin/users", "SYSTEM_OWNER");
    const res = await middleware(req);
    const isRedirect =
      res?.status === 307 ||
      res?.status === 302 ||
      res?.headers.has("location");
    results.push({
      test: "SYSTEM_OWNER -> /admin/users",
      success: !isRedirect,
      detail: isRedirect ? "Redirected (Blocked)" : "Allowed",
    });
  } catch (e) {
    const error = e as Error;
    results.push({
      test: "SYSTEM_OWNER -> admin",
      success: false,
      detail: error.message,
    });
  }

  // Test 3: Admin Access as OPERATOR (Should Block)
  try {
    const req = createReq("/admin/users", "OPERATOR");
    const res = await middleware(req);
    const location = res?.headers.get("location");
    const isBlocked = location && location.includes("/access-denied");
    results.push({
      test: "OPERATOR -> /admin/users",
      success: !!isBlocked,
      detail: location || "Allowed (Fail)",
    });
  } catch (e) {
    const error = e as Error;
    results.push({
      test: "OPERATOR -> admin",
      success: false,
      detail: error.message,
    });
  }

  // Test 4: Section Access as OPERATOR (Should Allow /system/operator)
  try {
    // Note: Middleware redirects roots sometimes.
    const req = createReq("/system/operator", "OPERATOR");
    const res = await middleware(req);
    const isRedirect =
      res?.status === 307 ||
      res?.status === 302 ||
      res?.headers.has("location");
    console.log("Test 4 Debug:", {
      status: res?.status,
      location: res?.headers.get("location"),
      hasLocation: res?.headers.has("location"),
    });
    results.push({
      test: "OPERATOR -> /system/operator",
      success: !isRedirect,
      detail: isRedirect
        ? `Redirected to ${res?.headers.get("location")} (status: ${res?.status})`
        : "Allowed",
    });
  } catch (e) {
    const error = e as Error;
    results.push({
      test: "OPERATOR -> section",
      success: false,
      detail: error.message,
    });
  }

  // Test 5: Section Access as OPERATOR to /system/lab (Should Block)
  try {
    const req = createReq("/system/lab", "OPERATOR");
    const res = await middleware(req);
    const location = res?.headers.get("location");
    const isBlocked = location && location.includes("/access-denied");
    results.push({
      test: "OPERATOR -> /system/lab",
      success: !!isBlocked,
      detail: location || "Allowed (Fail)",
    });
  } catch (e) {
    const error = e as Error;
    results.push({
      test: "OPERATOR -> wrong section",
      success: false,
      detail: error.message,
    });
  }

  // Summary
  console.table(results);
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.error("❌ Verification Failed:", failures);
    process.exit(1);
  } else {
    console.log("✅ All Access Control Tests Passed.");
  }
}

runTests();
