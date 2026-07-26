const fs = require("fs");
const readline = require("readline");

const logFile =
  "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain\\fe79a0dc-675f-457b-bbd3-685176e3b6a5\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

const lines = [];
rl.on("line", (line) => {
  lines.push(line);
});

rl.on("close", () => {
  console.log("Total lines in transcript:", lines.length);
  const count = Math.min(20, lines.length);
  for (let i = lines.length - count; i < lines.length; i++) {
    console.log(`=== LINE ${i} ===`);
    console.log(lines[i]);
  }
});
