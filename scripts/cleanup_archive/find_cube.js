const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

function findDbFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes("node_modules") && !filePath.includes(".git")) {
        findDbFiles(filePath, fileList);
      }
    } else if (filePath.endsWith(".db") || filePath.endsWith(".sqlite")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkDbForCube(dbPath) {
  try {
    const db = new Database(dbPath, { readonly: true });

    // Check users
    try {
      const users = db
        .prepare(
          "SELECT id, name, email FROM User WHERE LOWER(name) LIKE '%cube%' OR LOWER(email) LIKE '%cube%'",
        )
        .all();
      if (users.length > 0) {
        console.log(`\n--- Found Users in ${dbPath} ---`);
        console.log(users);
      }
    } catch (e) {
      // Table might not exist or column missing
    }

    // Check companies
    try {
      const companies = db
        .prepare("SELECT id, name FROM Company WHERE LOWER(name) LIKE '%cube%'")
        .all();
      if (companies.length > 0) {
        console.log(`\n--- Found Companies in ${dbPath} ---`);
        console.log(companies);
      }
    } catch (e) {
      // Table might not exist
    }

    db.close();
  } catch (err) {
    // Cannot open DB or other error
  }
}

console.log('Searching all .db and .sqlite files for "cube"...');
const allDbs = findDbFiles("d:\\concrete-plant-system");
for (const dbPath of allDbs) {
  checkDbForCube(dbPath);
}
console.log("Done searching.");
