const fs = require("fs");
const path = require("path");

// Target directories
const SCRIPTS_ARCHIVE = path.join(__dirname, "cleanup_archive");
const BACKUPS_ARCHIVE = path.join(
  __dirname,
  "..",
  "backups",
  "cleanup_archive",
);

// Ensure directories exist
if (!fs.existsSync(SCRIPTS_ARCHIVE)) {
  fs.mkdirSync(SCRIPTS_ARCHIVE, { recursive: true });
}
if (!fs.existsSync(BACKUPS_ARCHIVE)) {
  fs.mkdirSync(BACKUPS_ARCHIVE, { recursive: true });
}

// 1. Stale backup files to move
const backupFiles = [
  {
    src: path.join(__dirname, "..", "dev.db"),
    dest: path.join(BACKUPS_ARCHIVE, "dev.db"),
  },
  {
    src: path.join(__dirname, "..", "app", "page_before_edit.tsx"),
    dest: path.join(BACKUPS_ARCHIVE, "page_before_edit.tsx"),
  },
  {
    src: path.join(
      __dirname,
      "..",
      "app",
      "system",
      "lab",
      "sieve-analysis",
      "SieveAnalysisClient_pure.tsx",
    ),
    dest: path.join(BACKUPS_ARCHIVE, "SieveAnalysisClient_pure.tsx"),
  },
];

console.log("--- MOVING STALE BACKUPS & DUPLICATE DATABASES ---");
backupFiles.forEach((file) => {
  if (fs.existsSync(file.src)) {
    try {
      fs.renameSync(file.src, file.dest);
      console.log(
        `✓ Moved: ${path.basename(file.src)} -> backups/cleanup_archive/`,
      );
    } catch (err) {
      console.error(
        `⨯ Failed to move ${path.basename(file.src)}: ${err.message}`,
      );
    }
  } else {
    console.log(`- Not found (already moved): ${path.basename(file.src)}`);
  }
});

// 2. Identify root scripts to move
const rootDir = path.join(__dirname, "..");
const files = fs.readdirSync(rootDir);

// Files we want to keep in the root
const rootWhitelist = new Set([
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tailwind.config.ts",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "capacitor.config.ts",
  "next-env.d.ts",
  "README.md",
  "RULES.md",
  "CONSTITUTION.md",
  "MANAGER_INTERFACE_SPEC.md",
  "api_docs.md",
  "START.bat",
  "RESTART_SERVER.bat",
  ".gitignore",
  ".env",
  ".cursorrules",
  ".windsurfrules",
]);

console.log("\n--- MOVING ROOT SCRIPTS & TEMP FILES ---");
let scriptCount = 0;
files.forEach((file) => {
  const filePath = path.join(rootDir, file);
  const stat = fs.statSync(filePath);

  if (stat.isFile()) {
    // If it's on the whitelist, skip it
    if (rootWhitelist.has(file)) return;

    // Target extension checks
    const ext = path.extname(file).toLowerCase();
    const isScript = [".js", ".ts", ".bat", ".sql", ".txt", ".json"].includes(
      ext,
    );

    if (isScript) {
      const destPath = path.join(SCRIPTS_ARCHIVE, file);
      try {
        fs.renameSync(filePath, destPath);
        console.log(`✓ Archived: ${file} -> scripts/cleanup_archive/`);
        scriptCount++;
      } catch (err) {
        console.error(`⨯ Failed to archive ${file}: ${err.message}`);
      }
    }
  }
});

console.log(`\nCleanup complete! Archived ${scriptCount} files successfully.`);
