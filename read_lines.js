const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components/lab/ApproveOrderDialog.tsx");
try {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  console.log("Total lines:", lines.length);
  for (let i = 205; i < 225; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} catch (e) {
  console.error(e);
}
