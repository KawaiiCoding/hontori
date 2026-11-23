/*
 * twists.js  (engine: features)
 * Job: ready-made twists for the drawing prompt (DrawPrompt.js option `twist`): ways the page moves while the
 * player draws, so a school can make a known shape harder without a new shape. A game registers the ones it
 * uses under its own names (registry kind "draw.twist").
 *
 * Public API:
 *   driftTwist({ reach, period, rise })   the page sways from side to side, as in a steady wind:
 *        reach   share of the smaller screen side it travels each way (default 0.1)
 *        period  seconds for one sway there and back (default 4.6)
 *        rise    share of `reach` it also bobs up and down (default 0.2)
 *     returns { offset(seconds, width, height, out) }
 *   twistOf(game, id, options)   the twist registered under "draw.twist" id, made with options, or null
 *        registry kind "draw.twist": id -> (options) => twist
 */

export function driftTwist({ reach = 0.1, period = 4.6, rise = 0.2 } = {}) {
  const turn = (Math.PI * 2) / Math.max(0.5, period);
  return {
    offset(seconds, width, height, out) {
      const size = Math.min(width, height) * reach;
      /* it starts still and eases into the sway over the first second, so the first touch is calm */
      const ease = Math.min(1, seconds);
      out.x = Math.sin(seconds * turn) * size * ease;
      out.y = Math.sin(seconds * turn * 2) * size * rise * ease;
    },
  };
}

export function twistOf(game, id, options) {
  if (!id) return null;
  const make = game.registry.get('draw.twist', id);
  if (typeof make !== 'function') return null;
  try {
    return make(options || {}) || null;
  } catch (error) {
    console.warn(`Features: the drawing twist "${id}" failed`, error);
    return null;
  }
}
