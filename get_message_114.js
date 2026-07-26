const fs = require("fs");
const readline = require("readline");

const logFile =
  "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain\\fe79a0dc-675f-457b-bbd3-685176e3b6a5\\.system_generated\\logs\\transcript_full.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

let count = 0;
rl.on("line", (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === "USER_INPUT") {
      count++;
      if (count === 115) {
        // The last message (index 114)
        console.log("Last User Input full details:");
        console.log(JSON.stringify(obj, null, 2));
      }
    }
  } catch (e) {}
});
