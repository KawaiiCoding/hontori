/*
 * sigil.js  (Hontori: features)
 * Job: drawing a sigil outside a battle (the V of the opening, the hook of the fisher, the circle that wakes a
 * sprout, the V that opens a bloom, a lesson at a school): Hontori's shapes, inks and magic circle handed to the
 * engine's drawing prompt (systems/features/DrawPrompt.js), its twists, and the story extensions that ask for one.
 *
 * Public API:
 *   drawSigil(game, sigil, text, sub, { twist })   open the prompt; a Promise that resolves once it is drawn.
 *                                                  twist: a "draw.twist" id ('drift') or a twist object
 *   installSigil(game)                             registers:
 *     "draw.twist"    "drift"   the page sways sideways while you draw, as in the wind of Gale Loft
 *     "story.command" "ext:draw"   { ext: 'draw', sigil: spellId, text: textId, params, twist }
 *                                  the script waits until it is drawn
 */

import { drawPrompt, driftTwist, twistOf } from '../../systems/features/index.js';
import { sigils, drawSigil as paintCircle, RUNES } from '../battle-scene/sigils.js';
import { SPELL_COLORS } from '../battle-scene/look.js';
import { normalizeSpellId } from '../battle/spells.js';
import { word } from './words.js';

const SOUNDS = { ok: 'wand', miss: 'bump', hum: 'sparkle' };

/* the wand's ink: the colour chosen in the Capsule Album, when one is set */
function inkColour(game) {
  try {
    const capsules = game.registry.get('service', 'capsules');
    const colour = capsules && typeof capsules.inkColor === 'function' ? capsules.inkColor() : null;
    return typeof colour === 'string' && colour ? colour : null;
  } catch (error) {
    return null;
  }
}

export function drawSigil(game, sigil, text, sub, { twist } = {}) {
  const shape = normalizeSpellId(sigil) || 'veil';
  return drawPrompt(game, {
    shape: sigils.has(shape) ? shape : 'veil',
    recognizer: sigils,
    color: inkColour(game) || SPELL_COLORS[shape] || SPELL_COLORS.veil,
    text: text || '',
    sub,
    retry: word(game, 'shared.feat.draw.retry'),
    circle: paintCircle,
    marks: RUNES,
    sounds: SOUNDS,
    twist: typeof twist === 'string' ? twistOf(game, twist) : twist || undefined,
  });
}

export function installSigil(game) {
  const { registry } = game;
  registry.add('draw.twist', 'drift', (options) => driftTwist(options));

  registry.add('story.command', 'ext:draw', async (node, ctx) => {
    const sigil = ctx.value(node.sigil);
    const text = node.text ? ctx.text(node.text, node.params) : '';
    await drawSigil(game, sigil, text, undefined, { twist: node.twist });
    return ctx.story.ended(ctx) ? 'stop' : undefined;
  });
}
