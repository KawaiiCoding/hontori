/*
 * twists.js  (engine: features)
 * Job: ready-made twists for the drawing prompt (DrawPrompt.js option `twist`): ways the page moves while the
 * player draws, so a school can make a known shape harder without a new shape. A game registers the ones it
 * uses under its own names (registry kind "draw.twist").
 *
 * A twist is an object with any of these (DrawPrompt.js reads them; each call is guarded):
 *   offset(seconds, width, height, out)   the page moves by out.x, out.y screen pixels
 *   guide(points)                         the guide as it is shown (the stroke is still judged against the shape)
 *   paint(g, look)                        drawn under the guide, in screen pixels; look: { seconds, width, height,
 *                                         cx, cy, size, color, left (0..1 of the time left, or null), drawing }
 *   fade                                  drawing pixels of ink that stay visible behind the finger; the older
 *                                         part of the stroke fades away (it still counts when it is judged)
 *   limit                                 seconds for one try; when they run out the try is lost (`late` says so)
 *                                         and a new one starts. A stroke being drawn may still be finished.
 *   note, late                            words under the prompt while it is open; the words after a lost try
 *
 * Public API:
 *   driftTwist({ reach, period, rise })   the page sways from side to side, as in a steady wind:
 *        reach   share of the smaller screen side it travels each way (default 0.1)
 *        period  seconds for one sway there and back (default 4.6)
 *        rise    share of `reach` it also bobs up and down (default 0.2)
 *     returns { offset(seconds, width, height, out) }
 *   mirrorTwist({ axis, paint, note })   the guide is shown mirrored (axis 'y': upside down, as in still water;
 *        'x': left to right); the player draws the shape the right way round
 *   quickTwist({ seconds, paint, note, late })   each try must be finished within `seconds` (default 10)
 *   burnTwist({ fade, paint, note })   the line burns away behind the finger (default: the last 70 drawing
 *        pixels show), so the shape must be drawn in one sure stroke; it is judged like any other stroke
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

export function mirrorTwist({ axis = 'y', paint, note } = {}) {
  const flipX = axis === 'x';
  return {
    guide: (points) => points.map(([x, y]) => (flipX ? [-x, y] : [x, -y])),
    paint,
    note,
  };
}

export function quickTwist({ seconds = 10, paint, note, late } = {}) {
  return { limit: Math.max(2, Number(seconds) || 10), paint, note, late };
}

export function burnTwist({ fade = 70, paint, note } = {}) {
  return { fade: Math.max(20, Number(fade) || 70), paint, note };
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
