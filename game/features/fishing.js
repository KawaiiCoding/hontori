/*
 * fishing.js  (Hontori: features)
 * Job: the Fishing Sigil at the water (src/fishing.js): one cast and what it brings (a fish of this water,
 * a water hontori that bites, or only weeds), the fisher's weight in the contest, and the small glowing hook
 * on the water in front of the player once the sigil is known. The flow itself (asking, the lesson, the
 * contest, keeping the fish) is content: content/shared/scripts.js; the odds are content/shared/waters.js; each
 * chapter adds its own waters (`waters` in its folder). While a thing with the effect "nightHook" is carried, the
 * big night fish bite more often.
 *
 * Public API:
 *   installFishing(game)
 *
 * What it registers:
 *   story.command  "ext:cast"         { ext: 'cast', contest, as }: spends the mana of one cast and stores
 *                                     { kind: 'fish' | 'hontori' | 'none' | 'nomana', fish, name, kg, hontori, level }
 *   story.value    "ext:fishWeight"   { ext: 'fishWeight', index }: a random weight of that fish of this water
 *   system         "fishing-spot"     the first-touch card when water is in front (script "shared.fish.helper")
 *   a float (floats.js)               the hook and its ripple on that water
 *   a pointer listener (for good)     a tap on or near the hook (at least 44 by 44 CSS pixels) is the action
 *                                     button, in both control modes; the hook dips first. A tap anywhere else is
 *                                     left alone.
 */

import { DIR_STEP, TILE } from '../../core/units.js';
import { tables } from './content.js';
import { addFloat } from './floats.js';
import { word } from './words.js';

const FISH_SPELL = 'fish';
const WATER = 'water';
const HELPER_SCRIPT = 'shared.fish.helper';
const HOOK = [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [5, 8], [4, 9], [3, 9], [2, 9], [1, 8], [1, 7], [2, 6]];

/* the hook is a touch target of at least this many CSS pixels; when tapped it dips, then the cast begins */
const TOUCH_CSS = 44;
const TOUCH_MIN = 24;
const DIP_MS = 160;
const DIP_PIXELS = 3;
const press = { at: -Infinity, timer: 0 };

/* where the hook floats, in map pixels: out on the water, past the companion */
function hookPoint(player, step) {
  return { x: (player.tx + step[0] * 1.8) * TILE + 8, y: (player.ty + step[1] * 1.8) * TILE + 9 };
}

function knowsFishing(game) {
  const wand = game.save.state.wand;
  return !!(wand && Array.isArray(wand.spells) && wand.spells.includes(FISH_SPELL));
}

/* this map's water from whichever content folder names it (a chapter brings its own waters); the cast rules
   are the first folder's */
function waterOf(game, mapId) {
  const all = tables(game, 'waters');
  const first = all[0] || {};
  let water = null;
  for (const waters of all) if (waters && waters[mapId]) water = waters[mapId];
  if (!water) water = first[first.default];
  return { water: water && Array.isArray(water.fish) ? water : null, rules: first.rules || {} };
}

/* a carried thing with this effect makes the big night fish bite more often (the Night Hook) */
const NIGHT_HOOK = 'nightHook';
const NIGHT_HOOK_ODDS = 0.45;

function carriesNightHook(game) {
  try {
    const items = game.registry.has('service', 'items') ? game.registry.get('service', 'items') : null;
    if (!items || !items.inventory || !items.book) return false;
    return items.inventory.list().some((entry) => items.book.effect(entry.id) === NIGHT_HOOK);
  } catch (error) {
    return false;
  }
}

function isNight(hour) {
  return hour >= 19 || hour < 5;
}

function weight(range) {
  const low = Number(range && range[0]) || 0;
  const high = Number(range && range[1]) || low;
  return Math.round((low + Math.random() * (high - low)) * 10) / 10;
}

function wildLevel(game, mapId) {
  for (const wild of tables(game, 'wild')) {
    const place = wild && wild[mapId];
    if (place && Array.isArray(place.level)) return place.level;
  }
  return [2, 4];
}

/* the tile in front of the player is water, and the player stands still */
function facingWater(world) {
  const player = world && world.player;
  if (!player || player.moving || !world.map) return null;
  const step = DIR_STEP[player.dir] || DIR_STEP[0];
  if (world.map.tileAt(player.tx + step[0], player.ty + step[1]) !== WATER) return null;
  return step;
}

function cast(game, node, ctx) {
  const world = ctx.story.world;
  const mapId = world && world.map ? world.map.id : null;
  const { water, rules } = waterOf(game, mapId);
  const mana = game.registry.get('service', 'mana');
  const cost = Number(rules.manaCost) || 1;
  const store = (result) => {
    if (node.as) ctx.vars[node.as] = result;
    return result;
  };
  if (mana && mana.get() < cost) return store({ kind: 'nomana' });
  if (mana) {
    mana.set(mana.get() - cost);
    game.ui.toast(word(game, 'shared.feat.mana.left', { mana: mana.get(), max: mana.max() }));
  }
  try {
    game.sound.play('wand');
  } catch (error) {
    /* silent */
  }
  if (world) world.effect('sparkle', world.player.x, world.player.y - 8, 10);
  const contest = !!ctx.value(node.contest);
  return ctx.run([{ wait: 900 + Math.floor(Math.random() * 900) }]).then(() => {
    if (!water) return store({ kind: 'none' });
    const env = world ? world.env : { time: 12, weather: 'clear' };
    const night = isNight(env.time);
    const rain = env.weather === 'rain';
    const r = Math.random();
    const biteOdds = contest ? Number(rules.hontoriContest) || 0 : Number(rain ? rules.hontoriRain : rules.hontori) || 0;
    const nothing = Number(rules.nothing) || 0;
    const kinds = Array.isArray(water.kinds) ? water.kinds : [];
    if (r < biteOdds && kinds.length) {
      const [low, high] = wildLevel(game, mapId);
      const level = low + Math.floor(Math.random() * (high - low + 1));
      return store({ kind: 'hontori', hontori: kinds[Math.floor(Math.random() * kinds.length)], level });
    }
    if (r < biteOdds + nothing) return store({ kind: 'none' });
    const pool = water.fish.filter((fish) => !fish.night || night);
    let fish = pool[Math.floor(Math.random() * pool.length)] || water.fish[0];
    const bigOdds = carriesNightHook(game) ? Math.max(NIGHT_HOOK_ODDS, Number(rules.bigAtNight) || 0) : Number(rules.bigAtNight) || 0;
    if (night && Math.random() < bigOdds) fish = water.fish[water.fish.length - 1];
    const items = game.registry.get('service', 'items');
    const name = items ? items.name(fish.item) : fish.item;
    game.save.commit();
    return store({ kind: 'fish', fish: fish.item, name, kg: weight(fish.kg) });
  });
}

function hookPainter(game) {
  return {
    draw(ctx, world, now) {
      if (game.scenes.top !== world || !knowsFishing(game)) return;
      const step = facingWater(world);
      if (!step) return;
      const player = world.player;
      const t = world.env.t || now / 1000;
      const { x: cx, y: cy } = hookPoint(player, step);
      /* tapped: it dips into the water and comes back */
      const pressed = (now - press.at) / DIP_MS;
      const dip = pressed >= 0 && pressed < 1 ? Math.sin(pressed * Math.PI) * DIP_PIXELS : 0;
      const k = (t * 0.9) % 1;
      ctx.save();
      ctx.strokeStyle = `rgba(220,245,255,${(0.9 - k * 0.9).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3, 3 + k * 6, 1.5 + k * 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      const bx = Math.round(cx) - 5;
      const by = Math.round(cy - 15 + Math.sin(t * 3) * 1.2 + dip);
      const glow = ctx.createRadialGradient(bx + 4, by + 5, 0, bx + 4, by + 5, 10);
      glow.addColorStop(0, 'rgba(127,216,255,.45)');
      glow.addColorStop(1, 'rgba(127,216,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(bx - 8, by - 6, 24, 24);
      /* a dark edge so the hook reads on any water */
      ctx.fillStyle = '#0e2440';
      for (const q of HOOK) ctx.fillRect(bx + q[0] - 1, by + q[1] - 1, 3, 3);
      ctx.fillStyle = '#7fd8ff';
      for (const q of HOOK) ctx.fillRect(bx + q[0], by + q[1], 1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 6, by, 1, 2);
      ctx.fillRect(bx + 2, by + 9, 1, 1);
      ctx.restore();
    },
  };
}

/* the hook under this pointer, if it shows: the world it floats in, else null */
function hookUnder(game, event) {
  const world = game.scenes.top;
  const canvas = game.screen && game.screen.canvas;
  if (!world || !world.player || !world.camera || !canvas || event.target !== canvas || !knowsFishing(game)) return null;
  const story = game.registry.has('service', 'story') ? game.registry.get('service', 'story') : null;
  if (story && story.busy) return null;
  const step = facingWater(world);
  if (!step) return null;
  const at = hookPoint(world.player, step);
  const point = game.screen.toView(event.clientX, event.clientY);
  const zero = game.screen.toView(0, 0);
  const far = game.screen.toView(TOUCH_CSS, 0);
  const half = Math.max(TOUCH_MIN, Math.abs(far.x - zero.x)) / 2;
  const dx = point.x + world.camera.x - at.x;
  const dy = point.y + world.camera.y - (at.y - 6);
  return Math.abs(dx) <= half && Math.abs(dy) <= half ? world : null;
}

/* a tap on the hook is the action button: the same cast as pressing it while facing the water */
function watchHook(game) {
  window.addEventListener('pointerdown', (event) => {
    try {
      const world = hookUnder(game, event);
      if (!world) return;
      /* this press is the hook's: tap-to-move does not also walk to the water */
      event.stopPropagation();
      if (press.timer) return;
      press.at = performance.now();
      press.timer = setTimeout(() => {
        press.timer = 0;
        if (game.scenes.top === world && facingWater(world)) game.input.setButton('action', true);
      }, DIP_MS);
    } catch (error) {
      console.warn('Fishing: the tap on the hook failed', error);
    }
  }, true);
}

export function installFishing(game) {
  const { registry } = game;
  registry.add('story.command', 'ext:cast', (node, ctx) => cast(game, node, ctx));

  registry.add('story.value', 'ext:fishWeight', (node, ctx) => {
    const world = ctx.story.world;
    const { water } = waterOf(game, world && world.map ? world.map.id : null);
    const fish = water ? water.fish[Number(ctx.value(node.index)) || 0] || water.fish[0] : null;
    return fish ? weight(fish.kg) : 0;
  });

  registry.add('system', 'fishing-spot', {
    start(owner) {
      addFloat(owner, hookPainter(owner));
      watchHook(owner);
      let asked = false;
      owner.bus.on('world:tick', ({ scene }) => {
        const story = owner.registry.get('service', 'story');
        if (!story || story.busy || owner.scenes.top !== scene || !knowsFishing(owner)) return;
        if (asked || story.flag('help:fishspot') || !facingWater(scene)) return;
        if (!story.library || !story.library.scripts || !story.library.scripts[HELPER_SCRIPT]) return;
        asked = true;
        story.run([{ run: HELPER_SCRIPT }]);
      });
    },
  });
}
