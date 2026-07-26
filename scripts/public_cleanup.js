const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

// Files/folders that are meant to be in public/
const publicWhitelist = new Set([
  "file.svg",
  "globe.svg",
  "next.svg",
  "vercel.svg",
  "window.svg",
  "manifest.json",
  "sw.js",
  "verify.html",
  "favicon.ico",
  "icons", // folder
]);

console.log("--- PURGING ALL NON-STATIC ASSETS FROM PUBLIC/ ---");

// Recursive function to remove directory contents safely
function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

let deletedCount = 0;
let folderCount = 0;

if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);

  publicFiles.forEach((file) => {
    // If it's on the whitelist, skip it
    if (publicWhitelist.has(file)) return;

    const publicPath = path.join(publicDir, file);
    const stat = fs.statSync(publicPath);

    if (stat.isDirectory()) {
      console.log(`✓ Removing non-whitelisted folder: public/${file}`);
      deleteFolderRecursive(publicPath);
      folderCount++;
    } else {
      fs.unlinkSync(publicPath);
      console.log(`✓ Removed non-whitelisted file: public/${file}`);
      deletedCount++;
    }
  });
}

console.log(
  `\nPurge complete! Removed ${folderCount} folders and ${deletedCount} files from public/`,
);
