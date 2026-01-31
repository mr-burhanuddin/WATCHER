import { WATCHER_LIMITS } from "./limits";

export function chunkDiff(diff: string): {
  chunks: string[];
  truncated: boolean;
} {
  if (diff.length <= WATCHER_LIMITS.MAX_DIFF_CHARS) {
    return { chunks: [diff], truncated: false };
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < diff.length && chunks.length < WATCHER_LIMITS.MAX_CHUNKS) {
    chunks.push(diff.slice(offset, offset + WATCHER_LIMITS.CHUNK_SIZE));
    offset += WATCHER_LIMITS.CHUNK_SIZE;
  }

  return {
    chunks,
    truncated: offset < diff.length,
  };
}
