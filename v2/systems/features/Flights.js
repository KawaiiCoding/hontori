/*
 * Flights.js  (engine: features)
 * Job: something that flies over the world for a moment along a few key points: a kite on its string, a
 * bird bringing a note, a leaf in the wind. The flyer's place is worked out from the time alone, so drawing
 * changes nothing; the flight ends on a timer, so a script waiting for it never hangs, whatever is on screen.
 *
 * Public API:
 *   installFlights(game)   registers "world.layer" "features:flights"; a flight still in the air when the
 *                          map changes is taken away (its Promise resolves)
 *   fly(game, options)     a Promise that resolves when the flight is over
 *     options: {
 *       keys      [{ x, y, at }]   map pixels; at: ms from the start (the first key is at 0, in order)
 *       sway      pixels the flyer rocks from side to side while it flies (default 0)
 *       tether    optional { from: 'player' | { x, y }, color, sag }   a string from the hand to the flyer
 *       paint(ctx, x, y, info)    the flyer at (x, y) in map pixels; info: { k (0..1 of the flight), tilt,
 *                                 seconds, env }; must not throw or change anything
 *       during    optional [{ at, run() }]   things to do on the way (a sound when the string tugs)
 *     }
 */

const FLIGHTS = new WeakMap();

function listOf(game) {
  let list = FLIGHTS.get(game);
  if (!list) {
    list = new Set();
    FLIGHTS.set(game, list);
  }
  return list;
}

const ease = (k) => k * k * (3 - 2 * k);

/* the place between the two keys around `ms`, eased, written into out */
function placeAt(keys, ms, out) {
  let i = 1;
  while (i < keys.length - 1 && keys[i].at < ms) i++;
  const a = keys[i - 1];
  const b = keys[i] || a;
  const span = b.at - a.at;
  const k = span > 0 ? ease(Math.max(0, Math.min(1, (ms - a.at) / span))) : 1;
  out.x = a.x + (b.x - a.x) * k;
  out.y = a.y + (b.y - a.y) * k;
  out.dx = b.x - a.x;
}

export function fly(game, options = {}) {
  const keys = (Array.isArray(options.keys) ? options.keys : []).filter((key) => key && Number.isFinite(key.x) && Number.isFinite(key.y));
  if (keys.length < 1 || typeof options.paint !== 'function') return Promise.resolve();
  if (keys.length === 1) keys.push({ ...keys[0], at: 600 });
  keys[0] = { ...keys[0], at: 0 };
  const total = Math.max(100, Number(keys[keys.length - 1].at) || 0);
  const list = listOf(game);
  const flight = { keys, total, since: performance.now(), options, place: { x: 0, y: 0, dx: 0 }, info: { k: 0, tilt: 0, seconds: 0, env: null } };
  return new Promise((resolve) => {
    const timers = [];
    for (const step of options.during || []) {
      if (!step || typeof step.run !== 'function') continue;
      timers.push(setTimeout(() => {
        try {
          step.run();
        } catch (error) {
          /* a step on the way never stops the flight */
        }
      }, Math.max(0, Math.min(total, Number(step.at) || 0))));
    }
    flight.end = () => {
      for (const timer of timers) clearTimeout(timer);
      list.delete(flight);
      resolve();
    };
    list.add(flight);
    timers.push(setTimeout(flight.end, total));
  });
}

function drawTether(ctx, world, flight, x, y) {
  const tether = flight.options.tether;
  if (!tether) return;
  let hx;
  let hy;
  if (tether.from === 'player') {
    if (!world.player) return;
    /* the player's place is the middle of the feet: the hand is a little to the side and up */
    hx = world.player.x + 5;
    hy = world.player.y - 12;
  } else if (tether.from && Number.isFinite(tether.from.x)) {
    hx = tether.from.x;
    hy = tether.from.y;
  } else return;
  const sag = Number.isFinite(tether.sag) ? tether.sag : 10;
  ctx.strokeStyle = tether.color || 'rgba(250,240,220,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo((hx + x) / 2, Math.max(hy, y) + sag, x, y);
  ctx.stroke();
}

export function installFlights(game) {
  const list = listOf(game);
  /* nothing flies on from one map into the next */
  game.bus.on('map:enter', () => {
    for (const flight of [...list]) flight.end();
  });
  game.registry.add('world.layer', 'features:flights', {
    draw(ctx, world) {
      if (!list.size || !world || !world.camera) return;
      const now = performance.now();
      ctx.save();
      ctx.translate(-world.camera.x, -world.camera.y);
      for (const flight of list) {
        try {
          const ms = Math.min(flight.total, now - flight.since);
          const seconds = ms / 1000;
          placeAt(flight.keys, ms, flight.place);
          const sway = Number(flight.options.sway) || 0;
          const x = flight.place.x + Math.sin(seconds * 2.4) * sway;
          const y = flight.place.y + Math.sin(seconds * 3.1) * sway * 0.4;
          drawTether(ctx, world, flight, x, y);
          const info = flight.info;
          info.k = ms / flight.total;
          info.tilt = Math.max(-1, Math.min(1, flight.place.dx / 60 + Math.cos(seconds * 2.4) * (sway ? 0.3 : 0)));
          info.seconds = seconds;
          info.env = world.env;
          flight.options.paint(ctx, x, y, info);
        } catch (error) {
          console.warn('Features: a flight failed and was taken away', error);
          flight.end();
        }
      }
      ctx.restore();
    },
  });
}
