"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAddedLines = extractAddedLines;
function extractAddedLines(diff) {
    return diff
        .split("\n")
        .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
        .map((line) => line.slice(1)) // remove leading '+'
        .join("\n")
        .trim();
}
//# sourceMappingURL=diffUtils.js.map