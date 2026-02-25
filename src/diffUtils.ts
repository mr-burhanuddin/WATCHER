export function extractAddedLines(diff: string): string {
  return diff
    .split("\n")
    .filter(
      (line) => line.startsWith("+") && !line.startsWith("+++"), // exclude file headers
    )
    .map((line) => line.slice(1)) // remove leading '+'
    .join("\n")
    .trim();
}
