const fs = require("fs");
const path = require("path");

const rootDir = ".";
const outputFile = "cube_search_results.txt";
const skipDirs = [".git", "node_modules", ".next", "dist", "build", "coverage"];
const skipExt = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mp3",
  ".pdf",
  ".zip",
  ".exe",
  ".dll",
  ".db",
  ".sqlite",
  ".sqlite3",
];

let results = [];

function search(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file === outputFile) continue;
    if (file === "scripts") continue; // Skip scripts dir itself to avoid finding this script or deleted ones if lingering

    const filePath = path.join(dir, file);

    try {
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        if (skipDirs.includes(file)) continue;
        search(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (skipExt.includes(ext)) continue;

        // Check filename
        if (file.toLowerCase().includes("cube")) {
          results.push(`⚠️ FILENAME MATCH: ${filePath}`);
        }

        // Check content
        try {
          const content = fs.readFileSync(filePath, "utf8");
          if (content.toLowerCase().includes("cube")) {
            results.push(`🚩 CONTENT MATCH: ${filePath}`);
          }
        } catch (e) {
          // Ignore binary read errors
        }
      }
    } catch (e) {
      // Ignore stat errors
    }
  }
}

console.log("🚀 Starting NODE SEARCH for 'cube'...");
try {
  search(rootDir);
} catch (e) {
  results.push(`ERROR: ${e.message}`);
}

const output = results.length > 0 ? results.join("\n") : "NO MATCHES FOUND";
fs.writeFileSync(outputFile, output);
console.log("✅ Search Complete. Results written to file.");
