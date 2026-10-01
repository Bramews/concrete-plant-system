import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Ahmed Aziz/.gemini/antigravity-ide/brain/56f2a7a6-f34b-4287-98c7-69bc5ed68785";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function verifyWithChrome() {
  console.log("==================================================================");
  console.log("   🧪 بدء فحص مرحلة اليقين عبر متصفح Google Chrome الخارجي");
  console.log("==================================================================");

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

  // Pre-seed language cookie to ensure instant Arabic rendering and bypass external geo-ip lookup
  await context.addCookies([
    { name: "NEXT_LOCALE", value: "ar", domain: "localhost", path: "/" },
    { name: "language", value: "ar", domain: "localhost", path: "/" },
  ]);

  const page = await context.newPage();

  page.on("console", (msg) => console.log(`[CHROME CONSOLE ${msg.type()}]:`, msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  // --- Step 1: Open Login Page ---
  console.log("\n[1/4] فتح صفحة تسجيل الدخول http://localhost:3000/login ...");
  const t0 = Date.now();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const loginLoadTime = Date.now() - t0;
  console.log(`✅ تم فتح صفحة الدخول في ${loginLoadTime}ms`);

  const pageTitle = await page.title();
  console.log(`📄 عنوان الصفحة: ${pageTitle}`);

  // --- Step 2: Log in as System Owner (Ahmed) ---
  console.log("\n[2/4] تسجيل الدخول كمالك النظام (Ahmed)...");
  await page.fill("#username", "Ahmed");
  await page.fill("#password", "123");

  const tOwner0 = Date.now();
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
  const ownerNavTime = Date.now() - tOwner0;
  console.log(`✅ تم تسجيل الدخول بنجاح والتوجيه إلى: ${page.url()} في ${ownerNavTime}ms`);

  await page.waitForTimeout(3000); // Allow widgets and data to settle

  const ownerScreenshotPath = path.join(ARTIFACT_DIR, "system_owner_chrome.png");
  await page.screenshot({ path: ownerScreenshotPath, fullPage: false });
  console.log(`📸 تم حفظ لقطة شاشة نظام مالك النظام: ${ownerScreenshotPath}`);

  // --- Step 3: Clear Cookies / Navigate back to /login ---
  console.log("\n[3/4] مسح الجلسة والعودة لصفحة الدخول...");
  await context.clearCookies();
  await context.addCookies([
    { name: "NEXT_LOCALE", value: "ar", domain: "localhost", path: "/" },
    { name: "language", value: "ar", domain: "localhost", path: "/" },
  ]);
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  console.log("✅ العودة لصفحة الدخول جاهزة.");

  // --- Step 4: Log in as Lab (cube@demo-plant) ---
  console.log("\n[4/4] تسجيل الدخول لنظام المختبر (cube@demo-plant)...");
  await page.fill("#username", "cube@demo-plant");
  await page.fill("#password", "123");

  const tLab0 = Date.now();
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
  const labNavTime = Date.now() - tLab0;
  console.log(`✅ تم تسجيل الدخول بنجاح والتوجيه إلى: ${page.url()} في ${labNavTime}ms`);

  await page.waitForTimeout(3000); // Allow lab modules to settle

  const labScreenshotPath = path.join(ARTIFACT_DIR, "lab_system_chrome.png");
  await page.screenshot({ path: labScreenshotPath, fullPage: false });
  console.log(`📸 تم حفظ لقطة شاشة نظام المختبر: ${labScreenshotPath}`);

  await browser.close();

  console.log("\n==================================================================");
  console.log("   🎉 اكتمل فحص مرحلة اليقين بنجاح قطعي وبأعلى سرعة وسلاسة!");
  console.log("==================================================================");
}

verifyWithChrome().catch((err) => {
  console.error("❌ فشل الفحص:", err);
  process.exit(1);
});
