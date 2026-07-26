const fs = require("fs");
const readline = require("readline");
const path = require("path");

const logFile =
  "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain\\fe79a0dc-675f-457b-bbd3-685176e3b6a5\\.system_generated\\logs\\transcript_full.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  if (line.includes("ApproveOrderDialog.tsx")) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (
            tc.name === "replace_file_content" ||
            tc.name === "write_to_file" ||
            tc.name === "multi_replace_file_content"
          ) {
            console.log("--- Tool Call ---");
            console.log("Name:", tc.name);
            console.log("Args:", JSON.stringify(tc.args, null, 2));
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
});
