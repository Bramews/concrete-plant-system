const fs = require("fs");
const path = require("path");

const actionsDir = path.join(__dirname, "app", "actions");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;

  // Find all `export async function name(..., companyId: number, ...)`
  // or `export async function name(companyId: number, ...)`
  const functionRegex =
    /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*companyId\s*:\s*number[^)]*)\)\s*\{/g;

  let match;
  let modified = false;
  let hasValidateImport = content.includes("validateTenantIsolation");
  let hasGetSessionImport = content.includes("getSession");

  const replacements = [];

  while ((match = functionRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const index = match.index + fullMatch.length;

    // Check if it already has validation
    const nextLines = content.substring(index, index + 200);
    if (nextLines.includes("validateTenantIsolation")) {
      continue;
    }

    const injection = `
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(session.companyId, companyId, session.role);
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }
`;
    replacements.push({ index, injection });
    modified = true;
  }

  if (modified) {
    // Apply replacements from back to front
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      content =
        content.substring(0, r.index) +
        r.injection +
        content.substring(r.index);
    }

    // Add imports
    if (!hasValidateImport) {
      content =
        `import { validateTenantIsolation } from "@/lib/db-guard";\n` + content;
    }
    if (!hasGetSessionImport) {
      content = `import { getSession } from "@/lib/auth";\n` + content;
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${path.basename(filePath)}`);
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
console.log("Done injecting validateTenantIsolation");
