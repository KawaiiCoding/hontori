/* readTime: how long a timed message stays on screen, from how long it takes to read.
 * API: readMs(text, { min, max }) -> milliseconds
 * About 250 words a minute (240 ms a word), plus a moment to notice the message appear. */
const MS_PER_WORD = 240;
const NOTICE_MS = 1200;

export function readMs(text, { min = 2500, max = 10000 } = {}) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(min, Math.min(max, NOTICE_MS + words * MS_PER_WORD));
}
