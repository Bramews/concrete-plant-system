const fs = require("fs");
const readline = require("readline");
const path = require("path");

const logFile =
  "C:\\Users\\brame\\.gemini\\antigravity-ide\\brain\\fe79a0dc-675f-457b-bbd3-685176e3b6a5\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

const userInputs = [];

rl.on("line", (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === "USER_INPUT") {
      userInputs.push(obj);
    }
  } catch (e) {}
});

rl.on("close", () => {
  console.log("Total user messages:", userInputs.length);
  for (let i = Math.max(0, userInputs.length - 5); i < userInputs.length; i++) {
    console.log(`--- Message ${i} ---`);
    console.log(userInputs[i].content);
  }
});
