import fs from "fs";

const content = fs.readFileSync("components/lab/MixDesignManager.tsx", "utf8");

let div_balance = 0;
const lines = content.split("\n");
lines.forEach((line, i) => {
  const d_open = (line.match(/<div[ >]/g) || []).length;
  const d_close = (line.match(/<\/div>/g) || []).length;
  div_balance += d_open - d_close;
  if (div_balance < 0) {
    console.log(`Div balance broken at line ${i + 1}: balance=${div_balance}`);
  }
});

console.log(`Final div balance: ${div_balance}`);
