const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components/lab/ApproveOrderDialog.tsx");
try {
  const buf = fs.readFileSync(filePath);
  const start = 25000;
  console.log(buf.slice(start).toString("utf8"));
} catch (e) {
  console.error(e);
}
