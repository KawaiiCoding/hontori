/*
 * content.js  (Hontori: features)
 * Job: the content the feature pieces read, found through the registered content folders (kind "content").
 *
 * Public API:
 *   kinds(game)            every hontori kind ({ kind, element, stages: [{ name, desc }] })
 *   kindOf(game, key)      one kind, or null
 *   table(game, key)       the first folder's table under that key ({ waters } ...), or null
 *   tables(game, key)      every folder's table under that key, in load order
 */

export function tables(game, key) {
  const out = [];
  for (const folder of game.registry.all('content')) if (folder && folder[key]) out.push(folder[key]);
  return out;
}

export function table(game, key) {
  return tables(game, key)[0] || null;
}

export function kinds(game) {
  return tables(game, 'kinds').flatMap((list) => (Array.isArray(list) ? list : []));
}

export function kindOf(game, key) {
  return kinds(game).find((kind) => kind.kind === key) || null;
}
