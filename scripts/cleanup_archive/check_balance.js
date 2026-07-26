import fs from "fs";

const content = fs.readFileSync("components/lab/MixDesignManager.tsx", "utf8");

let braces = 0;
let parens = 0;
let tags = 0;

const lines = content.split("\n");
lines.forEach((line, i) => {
  const b_open = (line.match(/{/g) || []).length;
  const b_close = (line.match(/}/g) || []).length;
  const p_open = (line.match(/\(/g) || []).length;
  const p_close = (line.match(/\)/g) || []).length;
  const t_open = (line.match(/<[a-zA-Z]/g) || []).length;
  const t_close = (line.match(/<\//g) || []).length;

  braces += b_open - b_close;
  parens += p_open - p_close;
  tags += t_open - t_close;

  if (braces < 0 || parens < 0 || tags < 0) {
    console.log(
      `Balance broken at line ${i + 1}: braces=${braces}, parens=${parens}, tags=${tags}`,
    );
  }
});

console.log(`Final balance: braces=${braces}, parens=${parens}, tags=${tags}`);
