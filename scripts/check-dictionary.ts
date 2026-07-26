import { dictionary } from "../lib/dictionary.base";

console.log("Checking dictionary structure...");

const enKeys = Object.keys(dictionary.en);
const arKeys = Object.keys(dictionary.ar);

console.log("EN Keys:", enKeys);
console.log("AR Keys:", arKeys);

if (enKeys.includes("lab") && arKeys.includes("lab")) {
  console.log("SUCCESS: 'lab' key found in both EN and AR.");
} else {
  console.error("FAILURE: 'lab' key missing!");
  if (!enKeys.includes("lab")) console.error("Missing in EN");
  if (!arKeys.includes("lab")) console.error("Missing in AR");
  process.exit(1);
}
