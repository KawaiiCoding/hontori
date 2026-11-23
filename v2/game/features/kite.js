/*
 * kite.js  (Hontori: features)
 * Job: kites in the world, on the engine's flights (systems/features/Flights.js): the kid flies the diamond
 * kite on its string up to something out of reach (a letter stuck on a roof) and brings it down, and the
 * mail kites of Kitewick glide in on the wind with a letter for the kid and sail on. Only the flight is here;
 * whether the kite may fly (the bag holds it, the day is windy) and what is found are content conditions and
 * commands around it, so the same flight serves every later chapter.
 *
 * Public API:
 *   installKite(game)   registers:
 *     story.command  "ext:kiteFlight"
 *        { ext: 'kiteFlight', mode: 'fly', to: propType | [x, y], bring: itemId }
 *             the kite climbs from the kid's hand into the wind, flies to that prop or tile (or only up, without
 *             `to`), tugs, and comes back down, with the thing `bring` names hanging from it on the way back
 *        { ext: 'kiteFlight', mode: 'mail', bring: itemId }
 *             a mail kite glides in from the edge of the view, drops the thing to the kid and sails away
 *        The script waits for the flight. It gives nothing: a { give } after it does.
 *     a float (floats.js): the kites stuck out of reach. Content folders list them as
 *        stuckKites: [{ map, at: [x, y], until: condition }]; each hangs there, fluttering, until its
 *        condition holds or the kid's own kite has tugged it loose.
 *   paintKite(ctx, x, y, info, colors)   the diamond kite and its ribbon tail at (x, y), map pixels
 *   paintCarried(ctx, game, itemId, x, y)   the thing a flyer carries: the item's icon, or an envelope
 */

import { fly } from '../../systems/features/index.js';
import { TILE } from '../../core/units.js';
import { addFloat } from './floats.js';

const OWN = { body: '#d8442e', light: '#f07a4a', spar: '#5a2a18', bow: ['#ffd060', '#7ac0f0'] };
const MAIL = { body: '#e8dcb8', light: '#fff4d8', spar: '#7a5a3a', bow: ['#c03a24', '#e8c870'] };
const DIAMOND = [1, 2, 3, 4, 5, 4, 3, 2, 1];
const ICON = 10;

const images = new Map();
/* the stuck kites the kid's kite has already pulled loose (their flag follows at the end of the scene) */
const loose = new Set();
const STUCK_INFO = { seconds: 0, tilt: 0 };

/* the picture of a thing hanging from a kite: the item's own icon, loaded once */
function iconOf(game, id) {
  if (!id) return null;
  if (images.has(id)) return images.get(id);
  let image = null;
  try {
    const url = game.art.itemIconUrl ? game.art.itemIconUrl(id) : null;
    if (url) {
      image = new Image();
      image.src = url;
    }
  } catch (error) {
    image = null;
  }
  if (images.size > 16) images.clear();
  images.set(id, image);
  return image;
}

/* an envelope, while the icon is loading or when the thing has none */
function paintLetter(ctx, x, y) {
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(x - 4, y - 1, 9, 7);
  ctx.fillStyle = '#f4ead0';
  ctx.fillRect(x - 3, y, 7, 5);
  ctx.fillStyle = '#d8c8a0';
  ctx.fillRect(x - 2, y + 1, 1, 1);
  ctx.fillRect(x + 2, y + 1, 1, 1);
  ctx.fillRect(x - 1, y + 2, 3, 1);
  ctx.fillStyle = '#c03a24';
  ctx.fillRect(x, y + 3, 1, 1);
}

export function paintCarried(ctx, game, id, x, y) {
  const image = iconOf(game, id);
  if (image && image.complete && image.naturalWidth) ctx.drawImage(image, Math.round(x - ICON / 2), Math.round(y), ICON, ICON);
  else paintLetter(ctx, Math.round(x), Math.round(y));
}

export function paintKite(ctx, x, y, info, colors = OWN) {
  const t = info.seconds || 0;
  const cx = Math.round(x);
  const cy = Math.round(y);
  const lean = Math.round((info.tilt || 0) * 2);
  /* the ribbon tail waves below and behind */
  for (let i = 0; i < 6; i++) {
    const wave = Math.round(Math.sin(t * 6 - i * 0.9) * (1 + i * 0.4));
    ctx.fillStyle = i % 2 ? colors.bow[0] : colors.bow[1];
    ctx.fillRect(cx - lean * (i / 3) + wave, cy + 5 + i * 3, 2, 2);
  }
  /* the diamond, leaning with the wind */
  for (let row = 0; row < DIAMOND.length; row++) {
    const half = DIAMOND[row];
    const shift = Math.round((lean * (row - 4)) / 4);
    ctx.fillStyle = colors.spar;
    ctx.fillRect(cx - half - shift, cy - 4 + row, half * 2 + 1, 1);
    ctx.fillStyle = row < 4 ? colors.light : colors.body;
    if (half > 1) ctx.fillRect(cx - half + 1 - shift, cy - 4 + row, half * 2 - 1, 1);
  }
  ctx.fillStyle = colors.spar;
  ctx.fillRect(cx, cy - 4, 1, DIAMOND.length);
  ctx.fillRect(cx - 4, cy, 9, 1);
}

function sound(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* a missing sound never stops the flight */
  }
}

function targetOf(world, to) {
  if (Array.isArray(to) && to.length >= 2) return { x: to[0] * TILE + TILE / 2, y: to[1] * TILE + TILE / 2 };
  if (typeof to === 'string' && typeof world.pointOf === 'function') return world.pointOf(to);
  return null;
}

/* the kid's own kite: up into the wind, over to the thing, a tug, and home again */
function flyOwn(game, world, node, ctx) {
  const player = world.player;
  const hand = { x: player.x + 5, y: player.y - 14 };
  const side = (world.env && world.env.wind > 0.2 ? 1 : 0.6) * (player.dir === 2 ? -1 : 1);
  const high = { x: hand.x + 26 * side, y: hand.y - 56 };
  const goal = targetOf(world, ctx.value(node.to));
  const bring = ctx.value(node.bring) || null;
  const keys = [{ ...hand, at: 0 }, { ...high, at: 1400 }];
  let tug = 0;
  if (goal) {
    const over = { x: goal.x, y: goal.y - 10 };
    keys.push({ ...over, at: 2800 }, { x: over.x + 2, y: over.y - 3, at: 3400 }, { ...high, at: 4700 }, { ...hand, at: 6000 });
    tug = 3000;
  } else {
    keys.push({ x: high.x + 10 * side, y: high.y - 6, at: 2800 }, { ...hand, at: 4200 });
  }
  return fly(game, {
    keys,
    sway: 3,
    tether: { from: 'player', color: 'rgba(250,244,230,0.85)', sag: 8 },
    paint(g, x, y, info) {
      paintKite(g, x, y, info, OWN);
      if (bring && tug && info.k * keys[keys.length - 1].at > tug + 200) paintCarried(g, game, bring, x, y + 7);
    },
    during: tug ? [{ at: tug, run: () => { sound(game, 'bump'); if (Array.isArray(node.to)) loose.add(`${world.map.id}:${node.to[0]},${node.to[1]}`); } }, { at: keys[keys.length - 1].at - 100, run: () => sound(game, bring ? 'confirm' : 'blip') }] : [],
  });
}

/* a mail kite of Kitewick: in on the wind from the edge of the view, the letter drops, and on it sails */
async function flyMail(game, world, node, ctx) {
  const player = world.player;
  const cam = world.camera;
  const bring = ctx.value(node.bring) || null;
  const from = { x: cam.x - 20, y: player.y - 70 };
  const over = { x: player.x, y: player.y - 44 };
  const away = { x: cam.x + cam.width + 24, y: player.y - 84 };
  const drop = 2600;
  const total = 4600;
  let carrying = true;
  const kite = fly(game, {
    keys: [{ ...from, at: 0 }, { x: over.x - 12, y: over.y - 6, at: 1800 }, { ...over, at: drop }, { ...away, at: total }],
    sway: 2,
    paint(g, x, y, info) {
      paintKite(g, x, y, info, MAIL);
      if (carrying && bring) paintCarried(g, game, bring, x, y + 7);
    },
    during: [{ at: drop, run: () => { carrying = false; } }],
  });
  await new Promise((resolve) => setTimeout(resolve, drop));
  if (bring) {
    await fly(game, {
      keys: [{ x: over.x, y: over.y + 7, at: 0 }, { x: player.x + 3, y: player.y - 18, at: 700 }],
      sway: 1,
      paint: (g, x, y) => paintCarried(g, game, bring, x, y),
    });
    sound(game, 'blip');
  }
  await kite;
}

function stuckKites(game) {
  const all = [];
  for (const folder of game.registry.all('content')) {
    for (const kite of (folder && folder.stuckKites) || []) if (kite && Array.isArray(kite.at)) all.push(kite);
  }
  return all;
}

/* a kite caught in a tree: it hangs askew and flutters a little */
function stuckPainter(game) {
  let list = null;
  return {
    draw(ctx, world, now) {
      if (!list) list = stuckKites(game);
      if (!list.length || !world.map) return;
      const story = game.registry.get('service', 'story');
      for (const kite of list) {
        if (kite.map !== world.map.id || loose.has(`${kite.map}:${kite.at[0]},${kite.at[1]}`)) continue;
        if (story && kite.until && story.test(kite.until)) continue;
        const x = kite.at[0] * TILE + TILE / 2;
        const y = kite.at[1] * TILE + TILE / 2 - 10;
        if (!world.camera.sees(x - 12, y - 12, x + 12, y + 28)) continue;
        STUCK_INFO.seconds = now / 1000;
        STUCK_INFO.tilt = -0.8 + Math.sin(now / 700) * 0.15;
        paintKite(ctx, x, y, STUCK_INFO, MAIL);
      }
    },
  };
}

export function installKite(game) {
  addFloat(game, stuckPainter(game));
  game.registry.add('story.command', 'ext:kiteFlight', async (node, ctx) => {
    const world = ctx.story.world;
    if (!world || !world.player || !world.camera) return undefined;
    const mode = ctx.value(node.mode) || 'fly';
    if (mode === 'mail') await flyMail(game, world, node, ctx);
    else await flyOwn(game, world, node, ctx);
    return ctx.story.ended(ctx) ? 'stop' : undefined;
  });
}
