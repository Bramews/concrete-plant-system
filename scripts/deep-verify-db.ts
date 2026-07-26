import "dotenv/config";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("--- Deep Verification Results ---");

// 1. Check Runtime DATABASE_URL
console.log("1. Runtime DATABASE_URL:", process.env.DATABASE_URL);

// 3. Check schema.prisma for models (Programmatic check)
try {
  const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
  const hasSession = schema.includes("model Session");
  const hasSystemSetting = schema.includes("model SystemSetting");
  console.log(
    `3. Schema Check: Session Model=${hasSession}, SystemSetting Model=${hasSystemSetting}`,
  );
} catch (e) {
  console.error("Error reading schema.prisma:", e);
}

// 4. Check actual content of dev_v2.db
const relativeDbPath = "./prisma/dev_v2.db";
const resolvedDbPath = path.resolve(relativeDbPath);
console.log(`4. Database Path: ${resolvedDbPath}`);

if (!fs.existsSync(resolvedDbPath)) {
  console.error("❌ ERROR: dev.db file does NOT exist at this path!");
} else {
  try {
    const db = new Database(resolvedDbPath, { readonly: true });
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all();
    console.log(
      "   Existing Tables in dev.db:",
      tables.map((t: any) => t.name),
    );

    const hasSessionTable = tables.some((t: any) => t.name === "Session");
    const hasSystemSettingTable = tables.some(
      (t: any) => t.name === "SystemSetting",
    );

    console.log(
      `   Table Check: Session=${hasSessionTable}, SystemSetting=${hasSystemSettingTable}`,
    );
  } catch (e) {
    console.error("Error reading dev.db:", e);
  }
}
