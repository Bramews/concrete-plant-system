export function cn(...inputs: unknown[]) {
  return inputs
    .flat()
    .filter((v) => typeof v === "string" && v.length > 0)
    .join(" ");
}
