/*
 * entrance.js  (Hontori: features)
 * Job: the fire hontori's first entrance (src/engine.js spiritEntrance): soot rumbles down the flue three
 * times, the little fox drops out of the fireplace with a bounce, shakes the soot off and trots through the
 * house to the kid, who turns to it. Then it walks with the player like any companion.
 *
 * Public API:
 *   installEntrance(game)   registers "companion.entrance" "chimney": (node, ctx) => Promise
 *        node: the story's companion command { companion: 'join', kind, entrance, from }; the entrance makes
 *        the world's companion that kind and places it beside the player when it has arrived.
 *        The story's companion command (systems/story/Effects.js) must await this kind when it is
 *        registered (see the lane report).
 */

import { TILE, DOWN, UP, LEFT, RIGHT } from '../../core/units.js';
import { addFloat } from './floats.js';

const DROP_FROM = 46;
const FALL_MS = 500;
const BOUNCE_MS = 260;
const WALK_SPEED = 46;
const BODY_LIFT = 10;
const SCALE = 0.75;
const PAN_STEP = 1 / 30;
const NEAR = [[0, 1], [0, -1], [-1, 0], [1, 0]];

function sound(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* silent */
  }
}

/* tiles from the start to a free tile next to the goal (the start itself may be solid: the hearth) */
function pathTo(world, sx, sy, gx, gy) {
  const key = (x, y) => `${x},${y}`;
  const seen = new Map([[key(sx, sy), null]]);
  const queue = [[sx, sy]];
  let end = null;
  for (let guard = 0; queue.length && guard < 4000; guard++) {
    const [x, y] = queue.shift();
    if (Math.abs(x - gx) + Math.abs(y - gy) === 1) {
      end = [x, y];
      break;
    }
    for (const [dx, dy] of NEAR) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (seen.has(k) || (nx === gx && ny === gy)) continue;
      let blocked = true;
      try {
        blocked = world.isBlocked(nx, ny);
      } catch (error) {
        blocked = true;
      }
      if (blocked) continue;
      seen.set(k, [x, y]);
      queue.push([nx, ny]);
    }
  }
  if (!end) return [];
  const out = [];
  for (let at = end; at; at = seen.get(key(at[0], at[1]))) out.unshift(at);
  return out;
}

function dirOf(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? LEFT : RIGHT;
  return dy < 0 ? UP : DOWN;
}

async function chimney(game, node, ctx) {
  const world = ctx.story.world;
  const companion = world && world.companion;
  if (!companion) return;
  const kind = ctx.value(node.kind) || companion.key;
  if (kind) companion.key = kind;
  const wait = (ms) => ctx.run([{ wait: ms }]);
  const from = (typeof node.from === 'string' && world.pointOf(node.from)) || null;
  const hx = from ? from.x : world.player.x + 14;
  const hy = from ? from.y + 12 : world.player.y;
  companion.visible = false;

  /* what the float shows; the sequence below changes it, drawing only reads it */
  const fox = { phase: 'hidden', since: performance.now(), x: hx, y: hy, dir: DOWN, route: [], lengths: [0] };
  const set = (phase) => {
    fox.phase = phase;
    fox.since = performance.now();
  };
  /* where the fox is at a moment: { x, y, h, dir, moving } (ground point, height above it) */
  const place = (now) => {
    const t = now - fox.since;
    const at = { x: fox.x, y: fox.y, h: 0, dir: fox.dir, moving: false };
    if (fox.phase === 'fall') {
      if (t < FALL_MS) at.h = DROP_FROM * (1 - (t / FALL_MS) ** 2);
      else if (t < FALL_MS + BOUNCE_MS) at.h = 6 * Math.sin((Math.PI * (t - FALL_MS)) / BOUNCE_MS);
    } else if (fox.phase === 'shake') {
      at.x += Math.round(Math.sin(t / 30) * 1.5);
    } else if (fox.phase === 'walk' && fox.route.length > 1) {
      const total = fox.lengths[fox.lengths.length - 1];
      const along = Math.min(total, (t / 1000) * WALK_SPEED);
      let seg = 1;
      while (seg < fox.route.length - 1 && fox.lengths[seg] < along) seg++;
      const a = fox.route[seg - 1];
      const b = fox.route[seg];
      const span = fox.lengths[seg] - fox.lengths[seg - 1] || 1;
      const f = Math.min(1, (along - fox.lengths[seg - 1]) / span);
      at.x = a[0] + (b[0] - a[0]) * f;
      at.y = a[1] + (b[1] - a[1]) * f;
      at.dir = dirOf(b[0] - a[0], b[1] - a[1]);
      at.moving = along < total;
    }
    return at;
  };
  const remove = addFloat(game, {
    draw(g, scene, now) {
      if (fox.phase === 'hidden') return;
      const env = scene.env;
      const at = place(now);
      game.art.drawShadow(g, at.x, at.y, 7, 2, env);
      game.art.drawCreature(g, companion.key, Math.round(at.x), Math.round(at.y - BODY_LIFT - at.h), env, { scale: SCALE, dir: at.dir, moving: at.moving });
    },
  });
  /* the camera looks at the hearth, then follows the fox (the world itself stands still meanwhile) */
  const pan = setInterval(() => {
    try {
      const at = place(performance.now());
      world.camera.follow(at.x, at.y - BODY_LIFT, PAN_STEP);
    } catch (error) {
      /* the world was left */
    }
  }, PAN_STEP * 1000);

  try {
    await wait(700);
    /* soot rumbles down the flue */
    for (let i = 0; i < 3; i++) {
      world.effect('smoke', hx, hy - 34, 10);
      world.effect('ember', hx, hy - 20, 6);
      sound(game, 'cough');
      ctx.story.shake(0.25);
      await wait(380);
    }
    /* it drops with a small bounce */
    set('fall');
    await wait(FALL_MS);
    world.effect('smoke', hx, hy - 4, 34);
    world.effect('ember', hx, hy - 6, 18);
    sound(game, 'bump');
    ctx.story.shake(0.35);
    await wait(BOUNCE_MS + 240);
    /* it shakes off the soot */
    set('shake');
    sound(game, 'sparkle');
    for (let i = 0; i < 4; i++) {
      world.effect('smoke', hx + (i % 2 ? 6 : -6), hy - 8, 6);
      await wait(180);
    }
    world.effect('sparkle', hx, hy - 10, 16);
    set('still');
    await wait(300);
    /* it walks through the house to the kid */
    const player = world.player;
    const tiles = pathTo(world, Math.floor(hx / TILE), Math.floor((hy - 2) / TILE), player.tx, player.ty);
    fox.route = [[hx, hy], ...tiles.slice(1).map(([x, y]) => [x * TILE + 8, y * TILE + 14])];
    for (let i = 1; i < fox.route.length; i++) {
      const a = fox.route[i - 1];
      const b = fox.route[i];
      fox.lengths.push(fox.lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    set('walk');
    await wait(Math.ceil((fox.lengths[fox.lengths.length - 1] / WALK_SPEED) * 1000) + 60);
    const last = fox.route[fox.route.length - 1];
    player.dir = dirOf(last[0] - player.x, last[1] - player.y);
    fox.dir = dirOf(player.x - last[0], player.y - last[1]);
    fox.x = last[0];
    fox.y = last[1];
    set('still');
    await wait(400);
  } finally {
    clearInterval(pan);
    remove();
    const end = fox.route.length ? fox.route[fox.route.length - 1] : [hx, hy];
    companion.visible = true;
    companion.joinAt(end[0], end[1]);
  }
}

export function installEntrance(game) {
  game.registry.add('companion.entrance', 'chimney', (node, ctx) => chimney(game, node, ctx));
}
