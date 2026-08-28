import fs from "fs";
import path from "path";

console.log("[AI-Council] بدء دورة الفحص السحابي...");

const now = new Date();
const reportsDir = path.join(process.cwd(), "docs", "council-reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// فحوصات حقيقية
const checks = [];

// 1. فحص وجود ملفات التكوين الأساسية
const requiredFiles = ["package.json", "prisma/schema.prisma", "next.config.ts", "tsconfig.json"];
for (const f of requiredFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), f));
  checks.push({ check: `وجود ${f}`, passed: exists });
}

// 2. فحص عدم وجود ملفات قمامة في الجذر
const rootFiles = fs.readdirSync(process.cwd()).filter(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  return stat.isFile() && /^(check_|fix_|debug_|verify_|dump_|repair_)/.test(f);
});
checks.push({ check: "نظافة جذر المشروع", passed: rootFiles.length === 0, details: rootFiles.length > 0 ? `وُجدت ${rootFiles.length} ملفات قمامة` : "" });

// 3. فحص .gitignore
const gitignore = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf-8");
checks.push({ check: ".env محمي في .gitignore", passed: gitignore.includes(".env") });

const passedCount = checks.filter(c => c.passed).length;
const totalCount = checks.length;

const reportContent = `# تقرير الفحص السحابي التلقائي
- **التاريخ:** ${now.toISOString()}
- **النتيجة:** ${passedCount}/${totalCount} فحص ناجح

## تفاصيل الفحوصات
${checks.map(c => `- ${c.passed ? "✅" : "❌"} ${c.check}${c.details ? ` (${c.details})` : ""}`).join("\n")}
`;

const reportFile = path.join(reportsDir, `audit_${now.toISOString().slice(0,10)}.md`);
fs.writeFileSync(reportFile, reportContent, "utf-8");
console.log(`[AI-Council] تقرير الفحص: ${passedCount}/${totalCount} ناجح`);

if (passedCount < totalCount) {
  console.error("[AI-Council] ⚠️ بعض الفحوصات فشلت!");
  process.exit(1);
}
