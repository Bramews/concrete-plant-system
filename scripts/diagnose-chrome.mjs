import { chromium } from "@playwright/test";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function run() {
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
  page.on("request", (req) => console.log(`--> ${req.method()} ${req.url()}`));
  page.on("response", (res) => console.log(`<-- ${res.status()} ${res.url()}`));

  console.log("Navigating to /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  console.log("Filling Ahmed credentials...");
  await page.fill("#username", "Ahmed");
  await page.fill("#password", "123");

  console.log("Clicking submit...");
  await page.click('button[type="submit"]');

  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    console.log(`[Check ${i}] URL: ${page.url()}`);
    const cookies = await context.cookies();
    const cookieNames = cookies.map(c => c.name);
    console.log(`[Check ${i}] Cookies:`, cookieNames.join(", "));
    if (page.url().includes("/admin")) {
      console.log("SUCCESS! REACHED /admin!");
      break;
    }
  }

  await browser.close();
}

run().catch(console.error);
