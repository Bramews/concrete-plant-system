import { chromium } from "@playwright/test";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function diag() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => console.log("PAGE CONSOLE:", msg.type(), msg.text()));
  page.on("response", (res) => {
    if (res.request().method() === "POST") {
      console.log("NET POST RESPONSE:", res.status(), res.url());
    }
  });

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.fill("#username", "Ahmed");
  await page.fill("#password", "123");

  console.log("Clicking submit...");
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);

  console.log("Current URL:", page.url());
  const errorEl = await page.$(".text-rose-300");
  if (errorEl) {
    console.log("ERROR ON PAGE:", await errorEl.textContent());
  } else {
    console.log("No visible error element.");
  }

  const cookies = await context.cookies();
  console.log("Cookies:", cookies.map(c => ({ name: c.name, value: c.value.slice(0, 20) + "..." })));

  await browser.close();
}

diag().catch(console.error);
