import { chromium } from "@playwright/test";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:/Users/Ahmed Aziz/.gemini/antigravity-ide/brain/506c14c4-4457-43bd-b9dd-11fa869cff6c";

async function verify() {
  console.log("Launching Google Chrome...");
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    locale: "ar-EG",
  });

  const page = await context.newPage();
  page.on("console", (msg) => console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text()));
  page.on("pageerror", (err) => console.log("[PAGE ERROR]:", err.message));

  // ============================================
  // Test 1: System Owner (مالك النظام) -> Ahmed / 123
  // ============================================
  console.log("\n--- [1] Testing System Owner (Ahmed) ---");
  const tStartOwner = Date.now();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  console.log("Login page loaded in:", Date.now() - tStartOwner, "ms");

  // Wait for React to fully hydrate
  await page.waitForTimeout(1500);

  await page.fill("#username", "Ahmed");
  await page.fill("#password", "123");

  console.log("Submitting login form...");
  const tSubmitOwner = Date.now();
  
  // Submit and wait for URL redirection
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  
  const ownerRedirectUrl = page.url();
  console.log("Owner redirected to:", ownerRedirectUrl, "in", Date.now() - tSubmitOwner, "ms");

  // Wait for dashboard container to render
  await page.waitForTimeout(3000);

  const ownerScreenshotPath = path.join(ARTIFACT_DIR, "system_owner_chrome.png");
  await page.screenshot({ path: ownerScreenshotPath, fullPage: false });
  console.log("System Owner screenshot saved successfully:", ownerScreenshotPath);

  // ============================================
  // Test 2: Laboratory System (المختبر) -> cube@demo-plant / 123
  // ============================================
  console.log("\n--- [2] Testing Laboratory System (cube@demo-plant) ---");
  await context.clearCookies();

  const tStartLab = Date.now();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  console.log("Login page reloaded in:", Date.now() - tStartLab, "ms");

  await page.waitForTimeout(1500);

  await page.fill("#username", "cube@demo-plant");
  await page.fill("#password", "123");

  console.log("Submitting login form for Lab...");
  const tSubmitLab = Date.now();

  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

  const labRedirectUrl = page.url();
  console.log("Lab redirected to:", labRedirectUrl, "in", Date.now() - tSubmitLab, "ms");

  // Wait for lab UI to render
  await page.waitForTimeout(3000);

  const labScreenshotPath = path.join(ARTIFACT_DIR, "lab_system_chrome.png");
  await page.screenshot({ path: labScreenshotPath, fullPage: false });
  console.log("Lab System screenshot saved successfully:", labScreenshotPath);

  await browser.close();
  console.log("\n========================================================");
  console.log(">>> ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! <<<");
  console.log("========================================================");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
