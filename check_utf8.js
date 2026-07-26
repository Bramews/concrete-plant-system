const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components/lab/ApproveOrderDialog.tsx");
try {
  const buf = fs.readFileSync(filePath);
  console.log("File size:", buf.length, "bytes");
  // Check UTF-8 validity
  const str = buf.toString("utf8");
  const buf2 = Buffer.from(str, "utf8");

  // Let's find where they differ or find invalid UTF-8 bytes
  let hasError = false;
  for (let i = 0; i < buf.length; i++) {
    // UTF-8 encoding rules check
    const byte = buf[i];
    if (byte > 0x7f) {
      // It's a multibyte char. Let's see if it is a valid sequence
      let seqLen = 0;
      if ((byte & 0xe0) === 0xc0) seqLen = 2;
      else if ((byte & 0xf0) === 0xe0) seqLen = 3;
      else if ((byte & 0xf8) === 0xf0) seqLen = 4;
      else {
        console.log(
          `Invalid UTF-8 start byte 0x${byte.toString(16)} at index ${i}`,
        );
        hasError = true;
        printContext(buf, i);
        break;
      }

      if (i + seqLen > buf.length) {
        console.log(`Truncated UTF-8 sequence at index ${i}`);
        hasError = true;
        printContext(buf, i);
        break;
      }

      for (let j = 1; j < seqLen; j++) {
        const nextByte = buf[i + j];
        if ((nextByte & 0xc0) !== 0x80) {
          console.log(
            `Invalid UTF-8 continuation byte 0x${nextByte.toString(16)} at index ${i + j} (start byte 0x${byte.toString(16)} at ${i})`,
          );
          hasError = true;
          printContext(buf, i + j);
          break;
        }
      }
      if (hasError) break;
      i += seqLen - 1;
    }
  }
  if (!hasError) {
    console.log("All bytes match UTF-8 rules.");
  }
} catch (e) {
  console.error(e);
}

function printContext(buf, index) {
  const start = Math.max(0, index - 30);
  const end = Math.min(buf.length, index + 30);
  console.log("Index:", index);
  console.log("Bytes hex:", buf.slice(start, end).toString("hex"));
  console.log(
    "Bytes string (latin1):",
    buf.slice(start, end).toString("latin1"),
  );
}
