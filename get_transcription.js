const fs = require("fs");
const readline = require("readline");

const logFile =
  "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain\\fe79a0dc-675f-457b-bbd3-685176e3b6a5\\.system_generated\\logs\\transcript_full.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

let print = false;
rl.on("line", (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 4163) {
      console.log(`--- Step ${obj.step_index} (${obj.source}/${obj.type}) ---`);
      if (obj.content) {
        console.log(obj.content.substring(0, 1000));
      }
    }
  } catch (e) {}
});
