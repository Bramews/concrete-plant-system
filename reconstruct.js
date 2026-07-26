const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "step26.txt");
try {
  const content = fs.readFileSync(srcPath, "utf8");
  const lines = content.split(/\r?\n/);

  // Skip the first 7 header lines
  const codeLines = lines.slice(7);

  const reconstructed = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];

    // Strip the prefix <number>:
    const match = line.match(/^(\d+): (.*)$/);
    if (match) {
      reconstructed.push(match[2]);
    } else {
      // If line is empty or has a different format (like just a number and colon)
      const emptyMatch = line.match(/^(\d+):$/);
      if (emptyMatch) {
        reconstructed.push("");
      } else {
        // If it does not start with a number and colon, it's system helper text (e.g. "The above content shows...")
        // Skip it!
        console.log("Skipping line:", line);
      }
    }
  }

  const finalCode = reconstructed.join("\n");
  fs.writeFileSync(
    path.join(__dirname, "components/lab/ApproveOrderDialog.tsx"),
    finalCode,
    "utf8",
  );
  console.log(
    "Successfully reconstructed ApproveOrderDialog.tsx (with clean rules)!",
  );
} catch (e) {
  console.error(e);
}
