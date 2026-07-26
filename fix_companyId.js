const fs = require("fs");
const path = require("path");

const actionsDir = path.join(__dirname, "app/actions");
const files = fs.readdirSync(actionsDir).filter((f) => f.endsWith(".ts"));

files.forEach((file) => {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  const functionRegex =
    /export\s+async\s+function\s+(\w+)\s*\(\s*data\s*:\s*\{[^}]*companyId\s*:\s*number/g;

  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const fnStart = match.index;
    const blockStart = content.indexOf("{", fnStart + match[0].length) + 1;
    // Find the next validateTenantIsolation call inside this function
    const validationIndex = content.indexOf(
      "validateTenantIsolation",
      blockStart,
    );
    if (validationIndex !== -1) {
      const lineEnd = content.indexOf("\n", validationIndex);
      const lineStart = content.lastIndexOf("\n", validationIndex);
      const line = content.substring(lineStart, lineEnd);
      if (line.includes("session.companyId, companyId, session.role")) {
        const newLine = line.replace(
          "session.companyId, companyId, session.role",
          "session.companyId, data.companyId, session.role",
        );
        content =
          content.substring(0, lineStart) +
          newLine +
          content.substring(lineEnd);
        changed = true;
      }
    }
  }

  // Also catch generic errors where `validateTenantIsolation(session.companyId, companyId, session.role)`
  // is used, but companyId is not in the signature, but let's run tsc to find remaining ones.

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${file}`);
  }
});
