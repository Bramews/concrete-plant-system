const fs = require("fs");
const log = fs.readFileSync(
  "C:/Users/brame/.gemini/antigravity-ide/brain/e2c9d53e-371b-45fb-b46e-d16b137af2e8/.system_generated/logs/transcript.jsonl",
  "utf8",
);
const lines = log.split("\n");
let addContentCmd = null;
for (let i = lines.length - 1; i >= 0; i--) {
  if (
    lines[i].includes(
      'Add-Content -Path \\"d:/concrete-plant-system/prisma/schema.prisma\\" -Value',
    )
  ) {
    addContentCmd = JSON.parse(lines[i]);
    break;
  }
}
if (addContentCmd) {
  const args = addContentCmd.tool_calls[0].args.CommandLine;
  // args contains the string literal of the command.
  // We can just extract the payload which starts after -Value @" and ends at "@
  const payloadMatch = args.match(/-Value @"\\n([\s\S]*?)\\n"@/);
  if (payloadMatch) {
    let contentToAppend = payloadMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"');
    fs.appendFileSync(
      "d:/concrete-plant-system/prisma/schema.prisma",
      "\n" + contentToAppend,
    );
    console.log("Appended successfully");
  } else {
    console.log("Regex failed");
  }
} else {
  console.log("Not found");
}
