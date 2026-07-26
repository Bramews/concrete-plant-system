const Database = require("better-sqlite3");

function checkDb(dbPath) {
  try {
    const db = new Database(dbPath, { readonly: true });
    console.log(`\n--- Checking ${dbPath} ---`);

    // Check users
    try {
      const users = db
        .prepare(
          "SELECT id, name, email FROM User WHERE name LIKE '%cube%' OR email LIKE '%cube%'",
        )
        .all();
      console.log('Found Users matching "cube":', users);
      const allUsers = db.prepare("SELECT id, name, email FROM User").all();
      console.log("Total users:", allUsers.length);
      console.log("First 5 users:", allUsers.slice(0, 5));
    } catch (e) {
      console.log("Error querying User:", e.message);
    }

    // Check companies
    try {
      const companies = db
        .prepare(
          "SELECT id, name FROM Company WHERE name LIKE '%cube%' OR id IN (SELECT companyId FROM User WHERE name LIKE '%cube%' OR email LIKE '%cube%')",
        )
        .all();
      console.log('Found Companies matching "cube":', companies);
      const allCompanies = db.prepare("SELECT id, name FROM Company").all();
      console.log("Total companies:", allCompanies.length);
    } catch (e) {
      console.log(
        "Error querying Company (or column does not exist):",
        e.message,
      );
    }

    db.close();
  } catch (err) {
    console.error(`Error opening ${dbPath}:`, err.message);
  }
}

checkDb("./prisma/dev.db");
checkDb("./backups/backup-2026-02-16T11-55-03-694Z.db");
