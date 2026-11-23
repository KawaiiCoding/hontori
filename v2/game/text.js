/*
 * text.js  (Hontori)
 * Job: the words of Hontori's interface by text id, for the parts of the game layer that hand
 * words to the engine while it is being installed (before the story system has started). The
 * strings live in the content text tables like every other visible string.
 *
 * Public API:
 *   t(id, params)        the string of that id with its {name} placeholders filled; an unknown id shows itself
 *   words(map)           { key: textId } -> { key: string }
 */

import { FOLDERS } from './story/content.js';

const TABLE = Object.assign({}, ...FOLDERS.map((folder) => folder.text || {}));

export function t(id, params) {
  const raw = typeof TABLE[id] === 'string' ? TABLE[id] : String(id);
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name) => (params[name] != null ? String(params[name]) : whole));
}

export function words(map) {
  const out = {};
  for (const [key, id] of Object.entries(map)) out[key] = t(id);
  return out;
}
