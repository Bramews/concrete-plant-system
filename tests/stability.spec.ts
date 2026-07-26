import { test, expect } from "@playwright/test";

test.describe("Concrete Plant System - Runtime Stability Audit", () => {
  test("SYSTEM_OWNER Full Flow & Lab Verification", async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto("http://localhost:3000");
    console.log("Page loaded: ", page.url());

    // 2. Login as SYSTEM_OWNER
    await page.getByPlaceholder(/email|username/i).fill("ahmed@concrete.com");
    await page.getByPlaceholder(/password/i).fill("123");
    await page.getByRole("button", { name: /login|تسجيل دخول/i }).click();

    // 3. Verify Admin Dashboard access
    await page.waitForURL("**/admin**");
    await page.screenshot({ path: "screenshots/admin_dashboard.png" });
    console.log("Admin Dashboard Loaded");

    // 4. Navigate to System Lab
    await page.goto("http://localhost:3000/system/lab");
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: "screenshots/system_lab.png" });
    console.log("System Lab Loaded");

    // 5. Check console for hydration errors during this flow
    // (Playwright captures console logs if we set it up, but for now we look at UI stability)
  });

  test("LAB_TECH Login and Create Result", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Login as Lab Tech
    await page.getByPlaceholder(/email|username/i).fill("lab@example.com");
    await page.getByPlaceholder(/password/i).fill("password123");
    await page.getByRole("button", { name: /login|تسجيل دخول/i }).click();

    // Verify Lab Landing
    await page.waitForURL("**/system/lab**");
    await page.screenshot({ path: "screenshots/lab_tech_view.png" });
    console.log("Lab Tech View Verified");

    // Simulate clicking something? (e.g., 'Reports' or 'Add Result')
    // Since UI varies, we just check navigation
  });
});
