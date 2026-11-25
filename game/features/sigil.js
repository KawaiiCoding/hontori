/*
 * sigil.js  (Hontori: features)
 * Job: drawing a sigil outside a battle (the V of the opening, the hook of the fisher, the circle that wakes a
 * sprout, the V that opens a bloom, a lesson at a school): Hontori's shapes, inks and magic circle handed to the
 * engine's drawing prompt (systems/features/DrawPrompt.js), its twists, and the story extensions that ask for one.
 *
 * Public API:
 *   drawSigil(game, sigil, text, sub, { twist, scale, forgive, onDrawn })   open the prompt; a Promise that resolves
 *                                                  once it is drawn. twist: a "draw.twist" id ('drift', 'mirror',
 *                                                  'quick', 'burn') or a twist object; scale, forgive, onDrawn: see
 *                                                  systems/features/DrawPrompt.js (a larger guide; a moment that
 *                                                  never fails; how the drawing went)
 *   installSigil(game)                             registers:
 *     "draw.twist"    "drift"   the page sways sideways while you draw, as in the wind of Gale Loft
 *                     "mirror"  the guide shows upside down in a pool of still water, as in Deepbell Hall;
 *                               the kid draws the shape the right way up
 *                     "quick"   a spark runs down a copper wire beside the page, as in the Storm Works; each
 *                               try must be finished before it reaches the end (10 seconds; the guide stays)
 *                     "unseen"  no line shows while drawing, only the result (Hollow Moon)
 *                     "flawless" only a Flawless drawing counts (Halo Court)
 *                     "burn"    the line burns away behind the finger over the hot floor of the Ember Crucible
 *                               (embers drift up under the guide); one sure stroke, judged as usual
 *     words (content/shared/text.en.js): shared.feat.draw.mirror, shared.feat.draw.quick, shared.feat.draw.late,
 *       shared.feat.draw.burn (each left out while the content has none)
 *     "story.command" "ext:draw"   { ext: 'draw', sigil: spellId, text: textId, params, twist }
 *                                  the script waits until it is drawn
 */

import { drawPrompt, driftTwist, mirrorTwist, quickTwist, burnTwist, unseenTwist, flawlessTwist, twistOf } from '../../systems/features/index.js';
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

const POOL = 'rgba(70,130,190,0.2)';
const POOL_EDGE = 'rgba(200,230,255,0.5)';
const RIPPLE = 'rgba(210,236,255,0.28)';
const WIRE_DARK = '#5a2e16';
const WIRE = '#b8682e';
const WIRE_LIT = '#ffd27a';
const SPARK = '#fff4c0';
const QUICK_SECONDS = 10;
/* the accuracy of a Flawless grade (game/battle/spells.js gradeOf) */
const FLAWLESS = 0.55;
const ROUGH = 'Clean, but not flawless. Again, slowly.';
const EMBER = ['#ffb35a', '#ff8a3c', '#ffe27a'];
const BURN_GLOW = 'rgba(255,120,40,0.14)';

/* a text the content may not have yet is left out rather than shown as its id */
function words(game, id) {
  const text = word(game, id);
  return text && text !== id ? text : '';
}

/* still water under the guide: a pale waterline on top and slow ripples drifting sideways */
function paintPool(g, look) {
  const w = look.size * 1.9;
  const h = look.size * 1.7;
  const x = look.cx - w / 2;
  const y = look.cy - h / 2;
  g.fillStyle = POOL;
  g.fillRect(x, y, w, h);
  g.fillStyle = POOL_EDGE;
  g.fillRect(x, y, w, 2);
  g.fillStyle = RIPPLE;
  const rows = 9;
  for (let i = 0; i < rows; i++) {
    const ry = y + ((i + 0.6) / rows) * h;
    const run = (look.seconds * (10 + (i % 3) * 4) + i * 37) % (w * 0.5);
    for (let j = 0; j < 3; j++) {
      const rx = x + ((run + j * w * 0.36) % w);
      g.fillRect(rx, ry, Math.min(w * 0.16, x + w - rx), 2);
    }
  }
}

/* a copper wire beside the page with a spark running down it: the time this try has left */
function paintWire(g, look) {
  if (look.left === null) return;
  const x = Math.round(look.width - Math.max(30, look.width * 0.08));
  const top = look.cy - look.size * 0.8;
  const bottom = look.cy + look.size * 0.8;
  const at = top + (bottom - top) * (1 - look.left);
  g.fillStyle = WIRE_DARK;
  g.fillRect(x - 2, top, 5, bottom - top);
  g.fillStyle = WIRE;
  g.fillRect(x - 1, top, 3, bottom - top);
  /* behind the spark the wire glows; at the bottom a small bulb waits */
  g.fillStyle = WIRE_LIT;
  g.fillRect(x - 1, top, 3, Math.max(0, at - top));
  g.fillStyle = WIRE_DARK;
  g.beginPath();
  g.arc(x + 0.5, bottom + 7, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = look.left === 0 ? WIRE_LIT : WIRE;
  g.beginPath();
  g.arc(x + 0.5, bottom + 7, 4, 0, Math.PI * 2);
  g.fill();
  const flick = Math.sin(look.seconds * 30) > 0 ? 1 : -1;
  g.globalAlpha = 0.35;
  g.fillStyle = WIRE_LIT;
  g.beginPath();
  g.arc(x + 0.5, at, 9, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = SPARK;
  g.fillRect(x - 2, at - 2, 5, 5);
  g.fillRect(x + 3 * flick, at - 5, 2, 3);
  g.fillRect(x - 3 * flick, at + 3, 2, 3);
}

/* the hot floor of the Crucible under the page: a low glow and a few embers drifting up past the guide */
function paintEmbers(g, look) {
  const w = look.size * 1.9;
  const bottom = look.cy + look.size * 0.95;
  g.fillStyle = BURN_GLOW;
  g.fillRect(look.cx - w / 2, bottom - look.size * 0.25, w, look.size * 0.25);
  for (let i = 0; i < 9; i++) {
    const rise = (look.seconds * (18 + (i % 4) * 6) + i * 53) % (look.size * 1.6);
    const x = look.cx - w / 2 + ((i * 0.37 + 0.06) % 1) * w + Math.sin(look.seconds * 1.7 + i) * 4;
    g.globalAlpha = Math.max(0, 1 - rise / (look.size * 1.6));
    g.fillStyle = EMBER[i % EMBER.length];
    g.fillRect(Math.round(x), Math.round(bottom - rise), 2, 2);
  }
  g.globalAlpha = 1;
}

export function drawSigil(game, sigil, text, sub, { twist, scale, forgive, onDrawn } = {}) {
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
    scale,
    forgive,
    onDrawn,
  });
}

export function installSigil(game) {
  const { registry } = game;
  /* a little quicker and wider than the engine's default, so the Gale Loft drawing is a real challenge */
  registry.add('draw.twist', 'drift', (options) => driftTwist({ period: 3.2, reach: 0.12, ...options }));
  registry.add('draw.twist', 'mirror', (options) => mirrorTwist({ axis: 'y', paint: paintPool, note: words(game, 'shared.feat.draw.mirror'), ...options }));
  registry.add('draw.twist', 'quick', (options) => quickTwist({
    seconds: QUICK_SECONDS, paint: paintWire, note: words(game, 'shared.feat.draw.quick'), late: words(game, 'shared.feat.draw.late'), ...options,
  }));

  /* the Ember Crucible: the line burns away behind the finger, so the shape is drawn in one sure stroke */
  registry.add('draw.twist', 'burn', (options) => burnTwist({ paint: paintEmbers, note: words(game, 'shared.feat.draw.burn'), ...options }));

  /* Hollow Moon: no line shows while drawing, only the result */
  registry.add('draw.twist', 'unseen', (options) => unseenTwist({ note: words(game, 'shared.feat.draw.unseen'), ...options }));
  /* Halo Court: only a Flawless sigil counts (the battle grade's threshold, game/battle/spells.js) */
  registry.add('draw.twist', 'flawless', (options) => flawlessTwist({
    accuracy: FLAWLESS, note: words(game, 'shared.feat.draw.flawless'), rough: words(game, 'shared.feat.draw.rough') || ROUGH, ...options,
  }));

  registry.add('story.command', 'ext:draw', async (node, ctx) => {
    const sigil = ctx.value(node.sigil);
    const text = node.text ? ctx.text(node.text, node.params) : '';
    await drawSigil(game, sigil, text, undefined, { twist: node.twist });
    return ctx.story.ended(ctx) ? 'stop' : undefined;
  });
}
