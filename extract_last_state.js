const fs = require("fs");
const readline = require("readline");
const path = require("path");

const logFile =
  "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain\\fe79a0dc-675f-457b-bbd3-685176e3b6a5\\.system_generated\\logs\\transcript_full.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

const edits = [];

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
            edits.push({
              step: obj.step_index,
              name: tc.name,
              args: tc.args,
            });
          }
        }
      }
    } catch (e) {}
  }
});

rl.on("close", () => {
  console.log("Total edits found:", edits.length);
  if (edits.length > 0) {
    const last = edits[edits.length - 1];
    console.log("Last edit at step:", last.step);
    console.log("Tool name:", last.name);
    console.log("Args Keys:", Object.keys(last.args));
    if (last.name === "replace_file_content") {
      console.log(
        "ReplacementContent Length:",
        last.args.ReplacementContent?.length,
      );
      console.log("StartLine:", last.args.StartLine);
      console.log("EndLine:", last.args.EndLine);
      console.log("TargetContent Length:", last.args.TargetContent?.length);

      // Let's print the replacement content
      fs.writeFileSync(
        "last_replacement.txt",
        last.args.ReplacementContent || "",
      );
      console.log("Saved replacement content to last_replacement.txt");
    } else if (last.name === "write_to_file") {
      fs.writeFileSync("last_written.txt", last.args.CodeContent || "");
      console.log("Saved written content to last_written.txt");
    }
  }
});
