const fs = require("fs");
const path = require("path");

const actionsDir = path.join(__dirname, "app", "actions");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;

  if (content.includes("validateTenantIsolation")) {
    // If we injected before use server, let's move use server to top
    if (content.includes('"use server"') || content.includes("'use server'")) {
      const match = content.match(/["']use server["'];?\n?/);
      if (match && match.index > 0) {
        content =
          content.substring(0, match.index) +
          content.substring(match.index + match[0].length);
        content = '"use server";\n' + content;
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Fixed use server in ${path.basename(filePath)}`);
      }
    }
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      processFile(fullPath);
    }
  }
}

walkDir(actionsDir);
console.log("Done fixing use server");
