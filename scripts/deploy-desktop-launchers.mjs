import fs from "fs";
import path from "path";

const projectRoot = "d:\\concrete-plant-system";
const launchersDir = path.join(projectRoot, "launchers");

const targetDesktops = [
  "C:\\Users\\Ahmed Aziz\\OneDrive\\Desktop",
  "C:\\Users\\Ahmed Aziz\\Desktop",
];

const filesToDeploy = [
  {
    src: "1-quick-start.bat",
    destName: "1- تشغيل المصنع (سريع ومباشر).bat",
  },
  {
    src: "2-app-mode.bat",
    destName: "2- تشغيل المصنع (كتطبيق مستقل).bat",
  },
  {
    src: "3-control-panel.bat",
    destName: "3- لوحة تحكم وتشغيل المصنع.bat",
  },
];

console.log("🚀 جاري نشر ملفات التشغيل على سطح المكتب...");

for (const desktop of targetDesktops) {
  if (fs.existsSync(desktop)) {
    console.log(`\n📁 نشر إلى: ${desktop}`);
    for (const item of filesToDeploy) {
      const srcPath = path.join(launchersDir, item.src);
      const destPath = path.join(desktop, item.destName);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✅ تم وضع: ${item.destName}`);
    }
  } else {
    console.log(`\n⚠️ المسار غير موجود: ${desktop}`);
  }
}

console.log("\n✨ اكتمل النشر على سطح المكتب بنجاح تام!");
