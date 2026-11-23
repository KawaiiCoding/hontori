/*
 * game/world/common.js
 * Job: the small lookups every part of Hontori's world lane shares: the content folders, the story,
 * the items system, the world scene on screen, and guarded sound and effects.
 *
 * Public API:
 *   folders(game)                    the content folders in load order
 *   merged(game, key)                the objects under that key of every folder, merged (later wins)
 *   listed(game, key)                the arrays under that key of every folder, joined in order
 *   storyOf(game), itemsOf(game)     the story runner and the items system, or null
 *   worldOf(game)                    the world scene while it is on top, else null
 *   sound(game, name)                play a sound; never throws
 *   warnOnce(key, message, error)    one console note per key
 */

const warned = new Set();

export function folders(game) {
  return [...game.registry.all('content')];
}

export function merged(game, key) {
  const out = {};
  for (const folder of folders(game)) if (folder && folder[key] && typeof folder[key] === 'object') Object.assign(out, folder[key]);
  return out;
}

export function listed(game, key) {
  const out = [];
  for (const folder of folders(game)) if (folder && Array.isArray(folder[key])) out.push(...folder[key]);
  return out;
}

export function storyOf(game) {
  return game.story || game.registry.get('service', 'story') || null;
}

export function itemsOf(game) {
  return game.registry.get('service', 'items') || null;
}

export function worldOf(game) {
  const top = game.scenes && game.scenes.top;
  return top && top.map && top.player && typeof top.isBlocked === 'function' ? top : null;
}

export function sound(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* a missing sound never stops the game */
  }
}

export function warnOnce(key, message, error) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message, error || '');
}
