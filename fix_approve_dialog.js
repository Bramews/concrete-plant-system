const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components/lab/ApproveOrderDialog.tsx");
try {
  const content = fs.readFileSync(filePath, "utf8");

  // Let's find the correct position. The first "تأكيد الرفض النهائي" is at line 484.
  // The line of code is:
  //                 {isSubmitting ? "جاري الرفض..." : "تأكيد الرفض النهائي"}
  //               </button>
  //             </>

  const targetStr =
    '{isSubmitting ? "جاري الرفض..." : "تأكيد الرفض النهائي"}\n              </button>\n            </>';
  const targetStrCRLF =
    '{isSubmitting ? "جاري الرفض..." : "تأكيد الرفض النهائي"}\r\n              </button>\r\n            </>';

  let index = content.indexOf(targetStr);
  let len = targetStr.length;
  if (index === -1) {
    index = content.indexOf(targetStrCRLF);
    len = targetStrCRLF.length;
  }

  if (index === -1) {
    // Let's try to search for a smaller signature if it has Mojibake
    console.log("Target string not found in UTF-8. Searching by latin1...");
    const contentLatin = fs.readFileSync(filePath, "latin1");
    const targetStrLatin = 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø±Ù Ø¶ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ"}';
    const idxLatin = contentLatin.indexOf(targetStrLatin);
    if (idxLatin !== -1) {
      console.log("Found latin1 signature at", idxLatin);
      // Let's slice the file buffer up to idxLatin + signature length,
      // then add the closing tags and the end of the file.
      const buf = fs.readFileSync(filePath);
      // Let's find the "</>" after this index
      let endIdx = idxLatin + targetStrLatin.length;
      // Find the next occurrence of "</>" or "</>" or similar
      const remainingBuf = buf.slice(endIdx);
      // Search for the end tag
      const closeTagIdx = remainingBuf.toString("latin1").indexOf("</>");
      if (closeTagIdx !== -1) {
        const cutPoint = endIdx + closeTagIdx + 3; // Include the "</>"
        console.log("Cutting at", cutPoint);
        const header = buf.slice(0, cutPoint);

        // Construct the correct ending
        const ending =
          "\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}\n";
        const finalBuf = Buffer.concat([header, Buffer.from(ending, "utf8")]);

        fs.writeFileSync(filePath, finalBuf);
        console.log("File successfully fixed!");
      } else {
        console.log("Could not find closing tag </>.");
      }
    } else {
      console.log("Could not find signature in latin1.");
    }
  } else {
    console.log("Found UTF-8 signature at", index);
    const cutPoint = index + len;
    const header = content.substring(0, cutPoint);
    const ending =
      "\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}\n";
    fs.writeFileSync(filePath, header + ending, "utf8");
    console.log("File successfully fixed using UTF-8!");
  }
} catch (e) {
  console.error(e);
}
