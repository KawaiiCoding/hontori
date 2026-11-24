/*
 * rideArt.js  (Hontori: features)
 * Job: the picture of the kid riding a hontori (used by ride.js only). The mount is the hontori painter's
 * own picture, drawn larger; the saddle, the blanket, the stirrups and the kid's bent legs are painted here
 * in the same pixel style, and the kid's upper body is the person painter's picture, cut at the hip.
 *
 * Layering by direction:
 *   down   the kid's upper body behind the crown, a thin strip of blanket at its waist, then the mount
 *          over both: the head hides the kid from the waist down and the ears frame it
 *   up     the mount, then the kid's back low in the fur with the strip of blanket at the waist
 *   side   mount, girth, blanket, stirrup leather, saddle, kid, the near leg and the stirrup
 *
 * Public API:
 *   createRideArt(game) -> { paint(ctx, env, shadow, state), forget() }
 *     state: { player, key, blanket, seated }
 *       key      the mount's kind
 *       blanket  the blanket colour (a css colour)
 *       seated   0..1: 0 the kid stands beside the mount, 1 it sits in the saddle (the hop in between)
 *     forget()   drops the measured seats (when the kid steps down)
 *
 * Where the back is: nothing in the painters says where a hontori's back is, so the seat is measured once
 * per kind, direction and gait from the painter's own pictures (the 16 frames of a cycle, painted into a
 * small canvas and read back). The kid then follows the back frame by frame: it rises and falls with the
 * mount's steps and with its breath. Measuring happens on the first frame of a direction; after that a
 * frame costs two painter calls and a few rectangles.
 *
 * Mirrors of src/spirits.js draw() (kept together in `floatOf`, `frameOf` and `seedOf`): the painter lets a
 * hontori float a little and picks its frame from a per-kind seed. To keep the rider glued to the back the
 * same numbers are computed here. If they ever drift apart the rider is off by a pixel or two, nothing more.
 */

import { RENDER_SCALE } from '../../core/units.js';

/* the walking follower is drawn at 0.75; the mount is 1.6 times that, which also rasterises at whole pixels */
const MOUNT_SCALE = 1.2;
const MOUNT_STAGE = 3;
/* src/spirits.js: SS[2], the size of a third stage */
const STAGE_SCALE = 1.25;
const BODY_SCALE = MOUNT_SCALE * STAGE_SCALE;
/* the painter's centre sits this far above the feet */
const MOUNT_LIFT = 12;
const FRAMES = 16;
const FLYERS = new Set(['wind', 'dark', 'light', 'raven', 'firefly', 'kestrip', 'pufflet', 'skyfin', 'voltmoth', 'bellfish', 'coralet', 'driftjelly', 'inkling', 'wireling', 'lampwisp', 'stormowl', 'cavebat', 'ashmoth', 'emberfinch', 'sunflare', 'mothlight', 'gloomowl', 'nightfin', 'glimmerbee', 'prismbird', 'brightcarp']);

/* the kid's picture: feet at y, hip (top of the legs) this far above them */
const KID_HIP = 5.5;
const HOP_HEIGHT = 7;
/* facing the camera the kid's hip sits this far under the crown; facing away, this share of the way down the back */
const DOWN_SINK = 5;
const UP_SEAT = 0.64;
/* the kid's chin is this far above its hip; facing the camera the kid rises at most TUFT_RISE to show its face */
const KID_CHIN = 6.5;
const TUFT_RISE = 8;
/* seen from the side, nothing of the mount may stand higher than this above the seat in front of the face */
const FACE_CLEAR = 8;

const INK = '#2a1c2e';
const LEATHER = '#96603a';
const LEATHER_LIGHT = '#c08a54';
const LEATHER_DARK = '#5e3a24';
const TRIM = '#e8c860';
const IRON = '#d4d4e0';
const IRON_DARK = '#7c7c92';
const DEFAULT_LEGS = { cloth: '#46466a', light: '#767589', dark: '#343151', shoe: '#c4523a', shoeLight: '#d37e65', shoeDark: '#873931' };

/* the measuring canvas, in logical pixels; the mount is painted with its centre at ORIGIN */
const PROBE = 96;
const ORIGIN_X = 48;
const ORIGIN_Y = 56;
const SOLID = 150;
const PROBE_ENV = { t: 0, time: 12, weather: 'clear', wind: 0, indoor: false };

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function seedOf(key) {
  const out = { seed: 0, flies: false };
  try {
    const spirits = window.H && window.H.spirits;
    const list = spirits.list;
    let index = list.findIndex((entry) => entry.key === key);
    if (index < 0) index = list.findIndex((entry) => entry.key === 'hontori');
    if (index < 0) return out;
    const entry = list[index];
    out.seed = entry.dual ? hash((index + 1) * 3.7 + 9.1) : hash(index * 3.7 + 1.3);
    const base = spirits.dual && spirits.dual[entry.key] ? spirits.dual[entry.key].base : entry.key;
    out.flies = FLYERS.has(base);
  } catch (error) {
    /* the defaults stand */
  }
  return out;
}

function floatOf(kind, moving, t) {
  const rs = RENDER_SCALE;
  if (kind.flies) return Math.round((Math.sin(t * 2.6 + kind.seed * 6) * 2 - 2) * BODY_SCALE * rs) / rs;
  if (!moving) return Math.round((Math.sin(t * 1.7 + kind.seed * 6) * 1.2 - 1.4) * BODY_SCALE * rs) / rs;
  return 0;
}

function frameOf(kind, moving, t) {
  const f = Math.floor((t + kind.seed * 3) * (moving ? 16 : 12)) % FRAMES;
  return f < 0 ? f + FRAMES : f;
}

/* a time at which the painter shows frame f */
function timeOfFrame(kind, moving, f) {
  const rate = moving ? 16 : 12;
  return (f + 0.5) / rate - kind.seed * 3 + (FRAMES / rate) * 3;
}

/* where the painter puts its picture's centre for a mount standing on (x, footY) */
function centreY(kind, moving, t, footY) {
  const y = Math.round(footY - MOUNT_LIFT);
  return Math.round(y + floatOf(kind, moving, t) + 12 * MOUNT_SCALE - 12 * BODY_SCALE);
}

function shade(colour, factor) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(colour).trim());
  if (!m) return colour;
  const n = parseInt(m[1], 16);
  const part = (shift) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)));
  return `rgb(${part(16)},${part(8)},${part(0)})`;
}

export function createRideArt(game) {
  const art = game.art;
  const rs = RENDER_SCALE;
  const size = PROBE * rs;
  let probe = null;
  let probeCtx = null;
  let seatsOf = '';
  const seats = new Map();
  const kinds = new Map();
  const legsOf = new Map();
  const shades = new Map();
  const mountPose = { scale: MOUNT_SCALE, dir: 0, noShadow: true, moving: false, stage: MOUNT_STAGE };
  const wearPose = { scale: MOUNT_SCALE, dir: 0, noShadow: true, moving: false, stage: MOUNT_STAGE, env: null };

  /* what the lead wears (a capsule hat) sits on the mount's head, in the pose the mount was just drawn with */
  function wear(ctx, key, x, y, env) {
    try {
      const capsules = game.registry.get('service', 'capsules');
      if (!capsules || typeof capsules.drawOn !== 'function') return;
      wearPose.scale = mountPose.scale;
      wearPose.dir = mountPose.dir;
      wearPose.noShadow = mountPose.noShadow;
      wearPose.moving = mountPose.moving;
      wearPose.stage = mountPose.stage;
      wearPose.env = env;
      capsules.drawOn(ctx, key, x, y, wearPose);
    } catch (error) {
      /* the mount is simply shown without its hat */
    }
  }

  function probeContext() {
    if (!probe) {
      probe = document.createElement('canvas');
      probe.width = size;
      probe.height = size;
      probeCtx = probe.getContext('2d', { willReadFrequently: true });
    }
    probeCtx.setTransform(1, 0, 0, 1, 0, 0);
    probeCtx.clearRect(0, 0, size, size);
    probeCtx.setTransform(rs, 0, 0, rs, 0, 0);
    return probeCtx;
  }

  function kindOf(key) {
    let kind = kinds.get(key);
    if (!kind) {
      kind = seedOf(key);
      kinds.set(key, kind);
    }
    return kind;
  }

  function darker(colour) {
    let pair = shades.get(colour);
    if (!pair) {
      pair = { dark: shade(colour, 0.72), light: shade(colour, 1.18) };
      shades.set(colour, pair);
    }
    return pair;
  }

  /* the colours of the kid's trousers and shoes, read from its own picture */
  function legColours(look) {
    let legs = legsOf.get(look);
    if (legs) return legs;
    legs = DEFAULT_LEGS;
    try {
      const ctx = probeContext();
      art.drawPerson(ctx, look, 14, 27.5, 0, 0, PROBE_ENV, undefined);
      const data = ctx.getImageData(0, 0, 28 * rs, 28 * rs).data;
      const at = (x, y) => {
        const i = (Math.floor(y * rs) * 28 * rs + Math.floor(x * rs)) * 4;
        return data[i + 3] > SOLID ? `rgb(${data[i]},${data[i + 1]},${data[i + 2]})` : null;
      };
      const read = {
        cloth: at(11.5, 23.5), light: at(11, 23.5), dark: at(13, 23.5),
        shoe: at(11.5, 26), shoeLight: at(10.5, 26), shoeDark: at(13, 26),
      };
      if (Object.values(read).every(Boolean)) legs = read;
    } catch (error) {
      legs = DEFAULT_LEGS;
    }
    legsOf.set(look, legs);
    return legs;
  }

  /* ---------- measuring the back ---------- */

  function readFrame(key, kind, dir, moving, f) {
    const ctx = probeContext();
    const t = timeOfFrame(kind, moving, f);
    PROBE_ENV.t = t;
    mountPose.dir = dir;
    mountPose.moving = moving;
    art.drawCreature(ctx, key, ORIGIN_X, ORIGIN_Y, PROBE_ENV, mountPose);
    PROBE_ENV.t = 0;
    return { data: ctx.getImageData(0, 0, size, size).data, zero: centreY(kind, moving, t, ORIGIN_Y + MOUNT_LIFT) * rs };
  }

  /* the first row (device pixels) of column x where the body starts: a solid run, not a stray spark */
  function columnTop(data, x) {
    const need = 3 * rs;
    let run = 0;
    for (let y = 0; y < size; y++) {
      if (data[(y * size + x) * 4 + 3] > SOLID) {
        run += 1;
        if (run >= need) return y - need + 1;
      } else {
        run = 0;
      }
    }
    return -1;
  }

  function columnBottom(data, x, from) {
    let last = from;
    let gap = 0;
    for (let y = from; y < size && gap < 2 * rs; y++) {
      if (data[(y * size + x) * 4 + 3] > SOLID) {
        last = y;
        gap = 0;
      } else {
        gap += 1;
      }
    }
    return last;
  }

  /* the height of the back under a seat centred on logical column x (relative to the origin): the middle
     one of its columns, so the saddle rests in the fur and a passing ear or spike does not lift it */
  function windowTop(data, x, half) {
    const tops = [];
    for (let c = (ORIGIN_X + x - half) * rs; c <= (ORIGIN_X + x + half) * rs; c++) {
      const y = columnTop(data, Math.round(c));
      if (y >= 0) tops.push(y);
    }
    if (tops.length < half * rs) return size;
    tops.sort((p, q) => p - q);
    return tops[tops.length >> 1];
  }

  /* smooth a cycle of heights (a swinging ear or tail must not jolt the rider) and keep it near its middle */
  function settle(rows) {
    const mid = Array.from(rows).sort((a, b) => a - b)[FRAMES >> 1];
    const out = new Float32Array(FRAMES);
    for (let f = 0; f < FRAMES; f++) {
      const three = [rows[(f + FRAMES - 1) % FRAMES], rows[f], rows[(f + 1) % FRAMES]].sort((a, b) => a - b);
      out[f] = Math.round(Math.max(mid - 2, Math.min(mid + 2, three[1])) * rs) / rs;
    }
    return out;
  }

  function measureSide(key, kind, moving) {
    const first = readFrame(key, kind, 2, false, 0);
    /* the lowest stretch of the back near the middle: behind the neck, in front of a raised tail */
    let seatX = -1;
    let best = -Infinity;
    for (let x = -6; x <= 10; x++) {
      const top = windowTop(first.data, x, 3);
      if (top >= size) continue;
      const score = (top - first.zero) / rs - Math.abs(x - 2) * 0.5;
      if (score > best) {
        best = score;
        seatX = x;
      }
    }
    /* an ear or a horn standing where the kid's face would be: sit a little further back, clear of it */
    for (let back = 0; back < 4; back++) {
      const level = windowTop(first.data, seatX, 3);
      let clear = true;
      for (let x = seatX - 8; x <= seatX - 2 && clear; x++) {
        const y = columnTop(first.data, Math.round((ORIGIN_X + x) * rs));
        if (y >= 0 && level < size && (level - y) / rs > FACE_CLEAR) clear = false;
      }
      if (clear) break;
      seatX += 1;
    }
    const top0 = windowTop(first.data, seatX, 3);
    const column = Math.round((ORIGIN_X + seatX) * rs);
    const belly = (columnBottom(first.data, column, Math.min(size - 1, top0 + 4 * rs)) - top0) / rs;
    const rows = new Float32Array(FRAMES);
    for (let f = 0; f < FRAMES; f++) {
      const shot = moving || f ? readFrame(key, kind, 2, moving, f) : first;
      const top = windowTop(shot.data, seatX, 3);
      rows[f] = top >= size ? (top0 - first.zero) / rs : (top - shot.zero) / rs;
    }
    return { seatX, y: settle(rows), belly: Math.max(8, Math.min(11, belly)) };
  }

  /* the crown: the top of the head between the ears, not the tip of an ear, a horn or a tuft */
  function crownTop(data, centre) {
    const tops = [];
    for (let x = -8; x <= 8; x++) {
      const y = columnTop(data, Math.round((ORIGIN_X + centre + x) * rs));
      if (y >= 0) tops.push(y);
    }
    if (!tops.length) return -1;
    tops.sort((a, b) => a - b);
    return tops[Math.floor(tops.length * 0.7)];
  }

  /* the middle of the head on one row (device pixels), walking out from the origin to the first gap (a tail
     held beside the head is a separate shape on the crown's row) */
  function headCentre(data, row) {
    const y = Math.max(0, Math.min(size - 1, Math.round(row)));
    const walk = (step) => {
      let x = ORIGIN_X * rs;
      let last = x;
      let gap = 0;
      while (x >= 0 && x < size && gap < 1) {
        if (data[(y * size + x) * 4 + 3] > SOLID) {
          last = x;
          gap = 0;
        } else {
          gap += 1;
        }
        x += step;
      }
      return last;
    };
    return ((walk(-1) + walk(1)) / 2 - ORIGIN_X * rs) / rs;
  }

  function measureFacing(key, kind, dir, moving) {
    const first = readFrame(key, kind, dir, false, 0);
    const rough = crownTop(first.data, 0);
    const centre = rough < 0 ? 0 : Math.max(-6, Math.min(6, Math.round(headCentre(first.data, rough + 1.5 * rs) * rs) / rs));
    const top0 = crownTop(first.data, centre);
    const fallback = top0 < 0 ? -14 : (top0 - first.zero) / rs;
    const rows = new Float32Array(FRAMES);
    for (let f = 0; f < FRAMES; f++) {
      const shot = moving || f ? readFrame(key, kind, dir, moving, f) : first;
      const top = crownTop(shot.data, centre);
      rows[f] = top < 0 ? fallback : (top - shot.zero) / rs;
    }
    /* a tuft or a horn in front of the kid's face: how far the kid must rise for its chin to clear it */
    let tuft = size;
    for (let x = -1.5; x <= 1.5; x += 0.5) {
      const y = columnTop(first.data, Math.round((ORIGIN_X + centre + x) * rs));
      if (y >= 0 && y < tuft) tuft = y;
    }
    const rise = top0 < 0 || tuft >= size ? 0 : Math.max(0, Math.min(TUFT_RISE, (top0 - tuft) / rs + DOWN_SINK - KID_CHIN));
    /* from the crown down to the feet, which stand 12 scaled pixels under the picture's centre */
    return { x: centre, rise, y: settle(rows), height: Math.max(12, Math.min(40, 12 * MOUNT_SCALE - fallback)) };
  }

  function seatOf(key, kind, dir, moving) {
    if (seatsOf !== key) {
      seats.clear();
      seatsOf = key;
    }
    const side = dir >= 2;
    const id = (side ? 2 : dir) * 2 + (moving ? 1 : 0);
    let seat = seats.get(id);
    if (seat === undefined) {
      try {
        seat = side ? measureSide(key, kind, moving) : measureFacing(key, kind, dir, moving);
      } catch (error) {
        seat = null;
      }
      seats.set(id, seat);
    }
    return seat;
  }

  /* ---------- painting ---------- */

  function box(ctx, x, y, w, h, fill) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 0.5, y - 0.5, w + 1, h + 1);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  function rect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  /* a blanket hanging down one flank: x is its middle */
  function blanketFlap(ctx, x, y, w, h, colour) {
    const tone = darker(colour);
    ctx.fillStyle = INK;
    ctx.fillRect(x - w / 2 - 0.5, y - 0.5, w + 1, h);
    ctx.fillRect(x - w / 2 + 0.5, y + h - 0.5, w - 1, 1);
    rect(ctx, x - w / 2, y, w, h - 0.5, colour);
    rect(ctx, x - w / 2 + 0.5, y + h - 0.5, w - 1, 0.5, colour);
    rect(ctx, x - w / 2, y, w, 1, tone.light);
    rect(ctx, x - w / 2, y + h - 3, w, 1, TRIM);
    rect(ctx, x - w / 2, y + h - 2, w, 1.5, tone.dark);
  }

  function drawKid(ctx, player, x, hipY, dir, env, whole) {
    const feetY = hipY + KID_HIP;
    if (whole) {
      art.drawPerson(ctx, player.look, x, feetY, dir, 0, env, player.pose);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 16, feetY - 34, 32, 34 - KID_HIP);
    ctx.clip();
    art.drawPerson(ctx, player.look, x, feetY, dir, 0, env, player.pose);
    ctx.restore();
  }

  /* a leg seen from the side, bent at the knee, the foot in the stirrup; drawn facing left around the hip */
  function sideLeg(ctx, hx, hy, legs) {
    /* stirrup leather, behind the shin */
    rect(ctx, hx - 3.5, hy + 1, 1, 6.5, LEATHER_DARK);
    /* thigh: forward and a little down */
    box(ctx, hx - 4, hy - 0.5, 5.5, 3, legs.cloth);
    rect(ctx, hx - 4, hy - 0.5, 5.5, 1, legs.light);
    rect(ctx, hx - 4, hy + 1.5, 5.5, 1, legs.dark);
    /* shin: down from the knee */
    box(ctx, hx - 5, hy + 1.5, 3, 4.5, legs.cloth);
    rect(ctx, hx - 5, hy + 0.5, 3, 1.5, legs.cloth);
    rect(ctx, hx - 5, hy + 0.5, 1, 5.5, legs.light);
    rect(ctx, hx - 3, hy + 2.5, 1, 3.5, legs.dark);
    /* shoe, toes forward */
    box(ctx, hx - 6.5, hy + 6, 5, 2, legs.shoe);
    rect(ctx, hx - 6.5, hy + 6, 3, 0.5, legs.shoeLight);
    rect(ctx, hx - 6.5, hy + 7.5, 5, 0.5, legs.shoeDark);
    /* the stirrup iron under the sole */
    rect(ctx, hx - 6, hy + 8.5, 4.5, 1, INK);
    rect(ctx, hx - 5.5, hy + 8.5, 3.5, 0.5, IRON);
    rect(ctx, hx - 2.5, hy + 7, 0.5, 1.5, IRON_DARK);
  }

  /* the kid in the air between the ground and the saddle */
  function hopPoint(fromX, fromY, toX, toY, seated) {
    const e = seated * seated * (3 - 2 * seated);
    return { x: fromX + (toX - fromX) * e, y: fromY + (toY - fromY) * e - Math.sin(seated * Math.PI) * HOP_HEIGHT };
  }

  function paintSide(ctx, env, state, seat, px, py, zero, f) {
    const { player, key } = state;
    const flip = player.dir === 3 ? -1 : 1;
    const sx = seat ? seat.seatX : -1;
    /* the saddle rests a little into the fur */
    const sy = zero + (seat ? seat.y[f] : -6) - 1.5;
    const belly = seat ? seat.belly : 12;
    art.drawCreature(ctx, key, px, py - MOUNT_LIFT, env, mountPose);
    wear(ctx, key, px, py - MOUNT_LIFT, env);
    ctx.save();
    ctx.translate(px, 0);
    ctx.scale(flip, 1);
    /* girth: round the belly behind the blanket */
    rect(ctx, sx - 1.5, sy + 4, 2.5, belly - 4.5, INK);
    rect(ctx, sx - 1, sy + 4, 1.5, belly - 5, LEATHER);
    rect(ctx, sx - 1, sy + 4, 0.5, belly - 5, LEATHER_LIGHT);
    blanketFlap(ctx, sx, sy + 0.5, 13, 7.5, state.blanket);
    /* saddle: a leather seat with a low front and a raised back */
    ctx.fillStyle = INK;
    ctx.fillRect(sx - 5.5, sy - 2, 11, 3.5);
    ctx.fillRect(sx - 5.5, sy - 3, 2.5, 1.5);
    ctx.fillRect(sx + 2.5, sy - 4, 3.5, 2.5);
    rect(ctx, sx - 5, sy - 1.5, 10, 2.5, LEATHER);
    rect(ctx, sx - 5, sy - 2.5, 1.5, 1.5, LEATHER);
    rect(ctx, sx + 3, sy - 3.5, 2.5, 2.5, LEATHER);
    rect(ctx, sx - 5, sy - 2.5, 1.5, 0.5, LEATHER_LIGHT);
    rect(ctx, sx + 3, sy - 3.5, 2.5, 0.5, LEATHER_LIGHT);
    rect(ctx, sx - 3.5, sy - 1.5, 6.5, 0.5, LEATHER_LIGHT);
    rect(ctx, sx - 5, sy + 0.5, 10, 0.5, LEATHER_DARK);
    const hipY = sy - 1.5;
    if (state.seated >= 1) {
      drawKid(ctx, player, sx + 0.5, hipY, 2, env, false);
      sideLeg(ctx, sx + 0.5, hipY, legColours(player.look));
    } else {
      /* from the near side of the mount, up and over */
      const at = hopPoint(sx + 1, py + 4 - KID_HIP, sx + 0.5, hipY, state.seated);
      drawKid(ctx, player, at.x, at.y, 2, env, true);
    }
    ctx.restore();
  }

  /* a thin strip of the blanket across the kid's waist */
  function waistStrip(ctx, x, y, half, colour) {
    rect(ctx, x - half - 0.5, y - 0.5, half * 2 + 1, 3, INK);
    rect(ctx, x - half, y, half * 2, 1.5, colour);
    rect(ctx, x - half, y + 1.5, half * 2, 0.5, TRIM);
  }

  /* facing the camera: the kid sits behind the crown, between the ears; the head hides it from the waist down */
  function paintDown(ctx, env, state, seat, px, py, zero, f) {
    const { player, key } = state;
    const hipY = zero + (seat ? seat.y[f] - seat.rise : -14) + DOWN_SINK;
    const kidX = seat ? seat.x : 0;
    if (state.seated >= 1) {
      drawKid(ctx, player, px + kidX, hipY, 0, env, false);
      waistStrip(ctx, px + kidX, hipY - 1.5, 6, state.blanket);
    } else {
      const at = hopPoint(px + 18, py - KID_HIP, px + kidX, hipY, state.seated);
      drawKid(ctx, player, at.x, at.y, 0, env, true);
    }
    art.drawCreature(ctx, key, px, py - MOUNT_LIFT, env, mountPose);
    wear(ctx, key, px, py - MOUNT_LIFT, env);
  }

  /* facing away: the kid's back is nearest, low in the fur, with the ears beside its head and the tail below */
  function paintUp(ctx, env, state, seat, px, py, zero, f) {
    const { player, key } = state;
    const top = zero + (seat ? seat.y[f] : -14);
    const hipY = top + (seat ? seat.height : 28) * UP_SEAT;
    const kidX = seat ? seat.x : 0;
    art.drawCreature(ctx, key, px, py - MOUNT_LIFT, env, mountPose);
    wear(ctx, key, px, py - MOUNT_LIFT, env);
    if (state.seated >= 1) {
      drawKid(ctx, player, px + kidX, hipY, 1, env, false);
      waistStrip(ctx, px + kidX, hipY - 1.5, 6, state.blanket);
    } else {
      const at = hopPoint(px + 18, py - KID_HIP, px + kidX, hipY, state.seated);
      drawKid(ctx, player, at.x, at.y, 1, env, true);
    }
  }

  function paint(ctx, env, shadow, state) {
    const { player, key } = state;
    const kind = kindOf(key);
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    const dir = player.dir & 3;
    const moving = !!player.moving;
    const side = dir >= 2;
    if (shadow) art.drawShadow(ctx, px, py, side ? 13 : 9, side ? 3 : 4, env);
    /* measured first (once): measuring uses the mount's pose, which is then set for this frame */
    const seat = seatOf(key, kind, dir, moving);
    mountPose.dir = dir;
    mountPose.moving = moving;
    const zero = centreY(kind, moving, env.t, py);
    const f = frameOf(kind, moving, env.t);
    if (side) paintSide(ctx, env, state, seat, px, py, zero, f);
    else if (dir === 0) paintDown(ctx, env, state, seat, px, py, zero, f);
    else paintUp(ctx, env, state, seat, px, py, zero, f);
  }

  function forget() {
    seats.clear();
    seatsOf = '';
  }

  return { paint, forget };
}
