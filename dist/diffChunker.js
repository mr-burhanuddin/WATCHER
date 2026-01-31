"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkDiff = chunkDiff;
const limits_1 = require("./limits");
function chunkDiff(diff) {
    if (diff.length <= limits_1.WATCHER_LIMITS.MAX_DIFF_CHARS) {
        return { chunks: [diff], truncated: false };
    }
    const chunks = [];
    let offset = 0;
    while (offset < diff.length && chunks.length < limits_1.WATCHER_LIMITS.MAX_CHUNKS) {
        chunks.push(diff.slice(offset, offset + limits_1.WATCHER_LIMITS.CHUNK_SIZE));
        offset += limits_1.WATCHER_LIMITS.CHUNK_SIZE;
    }
    return {
        chunks,
        truncated: offset < diff.length,
    };
}
//# sourceMappingURL=diffChunker.js.map