export const WATCHER_LIMITS = {
  MAX_DIFF_CHARS: 40_000, // hard cap per AI request
  CHUNK_SIZE: 20_000, // chunk size for splitting
  MAX_CHUNKS: 3, // prevent runaway AI calls
};
