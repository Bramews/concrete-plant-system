const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

console.log("=== SIMPLE DIAGNOSIS ===");
console.log("CWD:", process.cwd());

const dbPath = path.join(process.cwd(), "dev.db");
console.log("Checking path:", dbPath);

if (!fs.existsSync(dbPath)) {
  console.error("❌ dev.db NOT FOUND at root!");
  // Check prisma/dev.db
  const prismaDbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(prismaDbPath)) {
    console.log("⚠️ Found at prisma/dev.db instead.");
    tryRead(prismaDbPath);
  }
} else {
  console.log("✅ dev.db FOUND at root.");
  tryRead(dbPath);
}

function tryRead(p) {
  try {
    const db = new Database(p, { readonly: true });
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all();
    console.log(
      `Tables (${tables.length}):`,
      tables.map((t) => t.name).join(", "),
    );

    if (tables.some((t) => t.name === "User")) {
      const userCount = db.prepare("SELECT count(*) as c FROM User").get();
      console.log("User Count:", userCount.c);
    }
    db.close();
  } catch (e) {
    console.error("❌ READ ERROR:", e.message);
  }
}
