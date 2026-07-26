const fs = require("fs");
const path = require("path");

const files = [
  "prisma/dev.db",
  "prisma/prisma/dev.db",
  "prisma/prisma/dev_v2.db",
];

console.log("--- CHECKING DATABASE FILES ---");
files.forEach((f) => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) {
    const stats = fs.statSync(p);
    console.log(`File: ${f}`);
    console.log(`  Size: ${stats.size} bytes`);
    console.log(`  Modified: ${stats.mtime.toISOString()}`); // ISO time
    console.log(`  Created: ${stats.birthtime.toISOString()}`);
    console.log("-----------------------------------");
  } else {
    console.log(`File: ${f} -> NOT FOUND`);
  }
});
