import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const nextBin = path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");

console.log("[TEST] Testing complete Turbopack dev boot + pre-warm + live response...");
const nextProcess = spawn(process.execPath, [nextBin, "dev", "--turbo"], {
  stdio: "inherit",
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

(async () => {
  const baseUrl = "http://127.0.0.1:3000";
  let isReady = false;

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const ping = await fetch(`${baseUrl}/api/health`);
      if (ping.status === 200) {
        isReady = true;
        break;
      }
    } catch (_) {}
  }

  if (isReady) {
    console.log("\n[TEST] Health check passed! Compiling /login...");
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/login`);
      console.log(`\n[TEST] SUCCESS! /login returned ${res.status} in ${Date.now() - start} ms!`);
      
      const warmStart = Date.now();
      const res2 = await fetch(`${baseUrl}/login`);
      console.log(`[TEST] WARM HIT! /login returned ${res2.status} in ${Date.now() - warmStart} ms!\n`);
    } catch (err) {
      console.error("\n[TEST] FAILED:", err.message);
    }
  }

  nextProcess.kill("SIGINT");
  process.exit(0);
})();
