const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "server_logs.txt");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

const child = spawn("npm.cmd", ["run", "dev"], {
  cwd: __dirname,
  stdio: "pipe",
});

child.stdout.on("data", (data) => {
  logStream.write(data);
  process.stdout.write(data);
});

child.stderr.on("data", (data) => {
  logStream.write(data);
  process.stderr.write(data);
});

child.on("close", (code) => {
  logStream.write(`Process exited with code ${code}\n`);
  logStream.end();
});
