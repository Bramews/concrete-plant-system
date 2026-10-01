import { chromium } from "@playwright/test";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:/Users/Ahmed Aziz/.gemini/antigravity-ide/brain/506c14c4-4457-43bd-b9dd-11fa869cff6c";

async function run() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ar-EG",
  });
  const page = await context.newPage();

  page.on("console", (msg) => console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text()));
  page.on("pageerror", (err) => console.log("[PAGE ERROR]:", err.message));

  console.log("1. Navigating to login page...");
  const t0 = Date.now();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  console.log("Loaded login page in", Date.now() - t0, "ms");

  await page.waitForTimeout(1000);

  console.log("2. Filling Ahmed / 123...");
  await page.fill("#username", "Ahmed");
  await page.fill("#password", "123");

  console.log("3. Clicking submit button...");
  await page.click('button[type="submit"]');

  console.log("4. Monitoring URL & page state for 10 seconds...");
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    console.log(`[Sec ${i}] URL:`, currentUrl);

    if (currentUrl.includes("/admin")) {
      console.log("SUCCESS: Reached /admin!");
      await page.waitForTimeout(2000); // Allow widgets to paint
      const shotPath = path.join(ARTIFACT_DIR, "system_owner_chrome.png");
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log("Captured System Owner screenshot:", shotPath);
      break;
    }

    const err = await page.$(".text-rose-300");
    if (err) {
      console.log("Error element detected:", await err.textContent());
    }
  }

  // Next: Test Laboratory System
  console.log("\n5. Testing Lab Tech login (cube@demo-plant)...");
  await context.clearCookies();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.fill("#username", "cube@demo-plant");
  await page.fill("#password", "123");
  await page.click('button[type="submit"]');

  console.log("6. Monitoring Lab Tech URL for 10 seconds...");
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    console.log(`[Lab Sec ${i}] URL:`, currentUrl);

    if (currentUrl.includes("/system/lab") || currentUrl.includes("/system/dashboard")) {
      console.log("SUCCESS: Reached Lab System:", currentUrl);
      await page.waitForTimeout(2000);
      const shotPath = path.join(ARTIFACT_DIR, "lab_system_chrome.png");
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log("Captured Lab System screenshot:", shotPath);
      break;
    }

    const err = await page.$(".text-rose-300");
    if (err) {
      console.log("Lab Error element detected:", await err.textContent());
    }
  }

  await browser.close();
  console.log("\nFinished run.");
}

run().catch(console.error);
