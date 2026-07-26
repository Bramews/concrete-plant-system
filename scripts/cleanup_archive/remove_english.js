const fs = require("fs");
const path = require("path");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Pattern 1: {lang === "ar" ? "Arabic" : "English"} -> {"Arabic"}
  content = content.replace(
    /\{\s*lang\s*===\s*['"`]ar['"`]\s*\?\s*(['"`][^'"`]+['"`])\s*:\s*['"`][^'"`]+['"`]\s*\}/g,
    "{$1}",
  );

  // Pattern 2: {lang === "en" ? "English" : "Arabic"} -> {"Arabic"}
  content = content.replace(
    /\{\s*lang\s*===\s*['"`]en['"`]\s*\?\s*['"`][^'"`]+['"`]\s*:\s*(['"`][^'"`]+['"`])\s*\}/g,
    "{$1}",
  );

  // Pattern 3: lang === "ar" ? "Arabic" : "English" -> "Arabic"
  content = content.replace(
    /lang\s*===\s*['"`]ar['"`]\s*\?\s*(['"`][^'"`]+['"`])\s*:\s*['"`][^'"`]+['"`]/g,
    "$1",
  );

  // Pattern 4: lang === "en" ? "English" : "Arabic" -> "Arabic"
  content = content.replace(
    /lang\s*===\s*['"`]en['"`]\s*\?\s*['"`][^'"`]+['"`]\s*:\s*(['"`][^'"`]+['"`])/g,
    "$1",
  );

  // Pattern 5: lang === 'ar' ? `Arabic string` : `English string`
  content = content.replace(
    /lang\s*===\s*['"`]ar['"`]\s*\?\s*(`[^`]+`)\s*:\s*`[^`]+`/g,
    "$1",
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Updated: " + filePath);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git"
    )
      continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      processFile(fullPath);
    }
  }
}

console.log("Starting replacement...");
processDirectory(path.join(__dirname, "app"));
processDirectory(path.join(__dirname, "components"));
console.log("Finished replacement.");
