"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATCHER_LIMITS = void 0;
exports.WATCHER_LIMITS = {
    MAX_DIFF_CHARS: 40000, // hard cap per AI request
    CHUNK_SIZE: 20000, // chunk size for splitting
    MAX_CHUNKS: 3, // prevent runaway AI calls
};
//# sourceMappingURL=limits.js.map