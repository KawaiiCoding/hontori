/*
 * Effects.js
 * Job: the script commands that show or sound something at a place in the world (content/schema.md
 * section 6): particles, a few picked notes, and the companion joining. They use the world's public effects API and the
 * sound provider; without a world or a provider that can do it they do nothing.
 *
 * Public API:
 *   EFFECTS     { fx, note, companion }   registered as "story.command"; each is (node, ctx)
 *       { fx: kind, n, dx, dy, at }   n particles of that kind. at: 'player', a prop or building type
 *                                     on this map ('fireplace'), or left out: the thing being used
 *                                     (else the player). dx, dy move the point, in pixels.
 *       { note: [midi...], count: n | [min, max], walk: bool, gap: ms, fx: kind }
 *                                     a few of the notes, one after another (count of them; picked at
 *                                     random, or as a random walk along the list), each with a particle
 *                                     of the fx kind. The script does not wait for them.
 *       { companion: 'join', kind, entrance, from }
 *                                     the world's companion appears, as that kind, at the prop of type
 *                                     `from` (else beside the player) and walks with the player from then
 *                                     on. A named entrance is the registered animation of kind
 *                                     "companion.entrance" (node, ctx) => Promise; the script waits
 *                                     for it. Without one it simply appears.
 */

import { TILE } from '../../core/units.js';

const DEFAULT_GAP_MS = 150;
const MOST_NOTES = 16;

/* the point an effect belongs to, in map pixels */
function pointOf(at, ctx, world) {
  const { player } = world;
  if (at === 'player') return { x: player.x, y: player.y };
  if (typeof at === 'string') {
    const found = world.pointOf(at);
    if (found) return found;
  }
  const target = ctx.target;
  if (target && target.map === world.map.id && Number.isFinite(target.x)) {
    return { x: (target.x + 0.5) * TILE, y: (target.y + 0.5) * TILE };
  }
  return { x: player.x, y: player.y };
}

function number(ctx, v, otherwise) {
  const n = Number(ctx.value(v));
  return Number.isFinite(n) ? n : otherwise;
}

function playNote(game, midi) {
  try {
    if (typeof game.sound.note === 'function') game.sound.note(midi);
  } catch (error) {
    /* a provider without notes plays nothing */
  }
}

export const EFFECTS = {
  companion(node, ctx) {
    const world = ctx.story.world;
    const companion = world && world.companion;
    if (!companion || node.companion !== 'join') return undefined;
    /* a named entrance is a registered animation; it leaves the companion beside the player */
    const entrance = node.entrance ? ctx.story.game.registry.get('companion.entrance', node.entrance) : null;
    if (typeof entrance === 'function') {
      return Promise.resolve()
        .then(() => entrance(node, ctx))
        .catch((error) => {
          console.warn(`Story: the companion entrance "${node.entrance}" failed`, error);
        })
        .then(() => {
          if (!companion.visible) {
            companion.visible = true;
            companion.joinAt(world.player.x + 14, world.player.y);
          }
        });
    }
    if (node.entrance) ctx.story.warnOnce(`entrance:${node.entrance}`, `Story: there is no companion entrance "${node.entrance}"; it simply appears`);
    const kind = ctx.value(node.kind);
    if (kind) companion.key = kind;
    const from = (typeof node.from === 'string' && world.pointOf(node.from)) || { x: world.player.x + 14, y: world.player.y };
    companion.visible = true;
    companion.joinAt(from.x, from.y);
    return undefined;
  },

  fx(node, ctx) {
    const world = ctx.story.world;
    if (!world) return;
    const point = pointOf(node.at, ctx, world);
    world.effect(node.fx, point.x + number(ctx, node.dx, 0), point.y + number(ctx, node.dy, 0), Math.max(1, number(ctx, node.n, 1)));
  },

  note(node, ctx) {
    const story = ctx.story;
    const notes = Array.isArray(node.note) ? node.note : [];
    if (!notes.length) return;
    const span = Array.isArray(node.count) ? node.count : [node.count || 1, node.count || 1];
    const low = Math.max(1, Number(span[0]) || 1);
    const high = Math.max(low, Number(span[1]) || low);
    const count = Math.min(MOST_NOTES, low + Math.floor(Math.random() * (high - low + 1)));
    const gap = Math.max(40, number(ctx, node.gap, DEFAULT_GAP_MS));
    const world = story.world;
    const point = world ? pointOf(node.at, ctx, world) : null;
    let at = Math.floor(Math.random() * notes.length);
    for (let i = 0; i < count; i++) {
      if (node.walk) at = Math.max(0, Math.min(notes.length - 1, at + (Math.random() < 0.5 ? -1 : 1)));
      else at = Math.floor(Math.random() * notes.length);
      const midi = notes[at];
      setTimeout(() => {
        playNote(story.game, midi);
        /* the world may have been left while the notes were still sounding */
        if (node.fx && point && story.world === world) world.effect(node.fx, point.x, point.y - 8, 2);
      }, i * gap);
    }
  },
};
