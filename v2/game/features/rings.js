/*
 * rings.js  (Hontori: features)
 * Job: the rings of the schools (world rule 49): which elements' rings the player has earned. The ring item
 * itself is given by the content ({ give: 'ring_leaf' }); this is the record the map and the story read.
 *
 * Public API:
 *   installRings(game)
 *   RINGS_SAVE
 *   hasRing(game, element)
 *
 * What it registers:
 *   save section     "rings"  { held: [element] }   in the order they were earned
 *   story.command    "ext:ring"   { ext: 'ring', element }: the ring is earned (once)
 *   story.condition  "ext:ring"   { ext: 'ring', has: element }
 * Event it emits: "ring:earned" { element }
 */

export const RINGS_SAVE = { held: [] };

export function hasRing(game, element) {
  const rings = game.save.state.rings;
  return !!(rings && Array.isArray(rings.held) && rings.held.includes(element));
}

export function installRings(game) {
  const { registry } = game;
  game.save.define('rings', RINGS_SAVE);

  registry.add('story.command', 'ext:ring', (node, ctx) => {
    const element = ctx.value(node.element);
    const rings = game.save.state.rings;
    if (!element || !rings || hasRing(game, element)) return;
    if (!Array.isArray(rings.held)) rings.held = [];
    rings.held.push(element);
    game.save.commit();
    game.bus.emit('ring:earned', { element });
  });

  registry.add('story.condition', 'ext:ring', (node, ctx) => hasRing(game, ctx.value(node.has)));
}
