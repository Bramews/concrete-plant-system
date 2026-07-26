import fs from "fs";

const content = fs.readFileSync("components/lab/MixDesignManager.tsx", "utf8");

let div_balance = 0;
const lines = content.split("\n");
lines.forEach((line, i) => {
  const d_open = (line.match(/<div[ >]/g) || []).length;
  const d_close = (line.match(/<\/div>/g) || []).length;
  div_balance += d_open - d_close;
  if (d_open > 0 || d_close > 0) {
    console.log(
      `Line ${i + 1}: opened=${d_open}, closed=${d_close}, balance=${div_balance}`,
    );
  }
});
