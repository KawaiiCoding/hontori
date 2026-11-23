/*
 * wear.js  (Hontori: capsules)
 * Job: draw the hat the lead hontori wears, centred on the top of its head between its ears, exactly where the
 * hontori painter put it this frame, whatever the kind, stage, direction, pose, bob or hover. The creature is
 * painted once more into a recorder (a context that draws nothing and only notes where the picture went); the
 * picture it used is measured once (the top of the head and its middle) and the result is cached.
 *
 * Public API:
 *   createWear(art, rules, prizeOf)
 *        art: the game's art provider (drawCreature); rules: the capsule rules (worn(slot));
 *        prizeOf(id): the prize data
 *     .drawOn(ctx, key, x, y, env, pose)   paint the worn things over a creature drawn with the same
 *                                          arguments; never throws
 *     .wearing()                           true when a hat is worn
 */

import { hatSprite } from './art.js';

const SOLID = 200;
/* the head a hat rests on is at least this many figure pixels wide */
const HEAD_SPAN = 5;
/* a hat looks for the head away from the picture's edges (tails, wing tips, raised paws); a side view
   (painted facing left) looks in its front part */
const HEAD_FRONT = [0.3, 0.7];
const HEAD_SIDE = [0.12, 0.62];
/* figure pixels below the resting place that still count as the top of the head */
const CROWN_TOLERANCE = 1.5;
const CACHE_CAP = 600;

/* a context that paints nothing: it notes the glow (its width is 32 figure pixels), the move to the
   creature's place, a mirror, and the first picture drawn after the move (the creature itself) */
function recorder() {
  const r = {
    canvas: null, globalAlpha: 1, imageSmoothingEnabled: false, fillStyle: '', strokeStyle: '', globalCompositeOperation: 'source-over',
    moved: false, flip: false, tx: 0, ty: 0, unit: 0, src: null, sx: 0, sy: 0, sw: 0, sh: 0, dx: 0, dy: 0, dw: 0, dh: 0,
    reset() {
      r.moved = false;
      r.flip = false;
      r.unit = 0;
      r.src = null;
    },
    save() {},
    restore() {},
    fillRect() {},
    beginPath() {},
    fill() {},
    stroke() {},
    arc() {},
    rect() {},
    clip() {},
    moveTo() {},
    lineTo() {},
    setTransform() {},
    translate(x, y) {
      if (r.moved) return;
      r.moved = true;
      r.tx = x;
      r.ty = y;
    },
    scale(x) {
      if (r.moved && x < 0) r.flip = !r.flip;
    },
    drawImage(src, a, b, c, d, e, f, g, h) {
      if (!r.moved) {
        if (!r.unit && c) r.unit = c / 32;
        return;
      }
      if (r.src) return;
      const w = src.naturalWidth || src.width;
      const ht = src.naturalHeight || src.height;
      if (e === undefined) {
        r.src = src;
        r.sx = 0;
        r.sy = 0;
        r.sw = w;
        r.sh = ht;
        r.dx = a;
        r.dy = b;
        r.dw = c === undefined ? w : c;
        r.dh = d === undefined ? ht : d;
      } else {
        r.src = src;
        r.sx = a;
        r.sy = b;
        r.sw = c;
        r.sh = d;
        r.dx = e;
        r.dy = f;
        r.dw = g;
        r.dh = h;
      }
    },
  };
  return r;
}

export function createWear(art, rules, prizeOf) {
  const rec = recorder();
  const found = new Map();
  let probe = null;
  let probeCtx = null;

  /* the top of the head where a hat rests (its middle and its height), in pixels of the source picture */
  function measure(src, sx, sy, sw, sh, perUnit, side) {
    let ids = found.get(src);
    if (!ids) {
      ids = new Map();
      found.set(src, ids);
    }
    const key = `${sx},${sy},${sw},${sh},${side ? 1 : 0}`;
    if (ids.has(key)) return ids.get(key);
    let result = null;
    try {
      const w = Math.max(1, Math.round(sw));
      const h = Math.max(1, Math.round(sh));
      if (!probe) {
        probe = document.createElement('canvas');
        probeCtx = probe.getContext('2d', { willReadFrequently: true });
      }
      if (probe.width < w || probe.height < h) {
        probe.width = Math.max(probe.width, w);
        probe.height = Math.max(probe.height, h);
      }
      probeCtx.clearRect(0, 0, probe.width, probe.height);
      probeCtx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
      const data = probeCtx.getImageData(0, 0, w, h).data;
      const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] >= SOLID;
      const tops = new Array(w).fill(Infinity);
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h - 2; y++) {
          if (solid(x, y) && solid(x, y + 1) && solid(x, y + 2)) {
            tops[x] = y;
            break;
          }
        }
      }
      let first = 0;
      let last = w - 1;
      while (first < w && tops[first] === Infinity) first++;
      while (last > first && tops[last] === Infinity) last--;
      const [from, to] = side ? HEAD_SIDE : HEAD_FRONT;
      const lo = Math.floor(first + (last - first) * from);
      const hi = Math.ceil(first + (last - first) * to);
      const span = Math.max(2, Math.round(HEAD_SPAN * perUnit));
      let best = Infinity;
      let hx = -1;
      for (let x = lo; x + span <= hi + 1; x++) {
        let low = -1;
        for (let i = x; i < x + span; i++) low = Math.max(low, tops[i]);
        if (low < best || (low === best && Math.abs(x + span / 2 - (lo + hi) / 2) < Math.abs(hx - (lo + hi) / 2))) {
          best = low;
          hx = x + span / 2;
        }
      }
      if (hx >= 0 && best < Infinity) {
        /* centre on the whole top of the head: every column around the resting place that reaches as high
           (ears and tufts included, so the hat sits between them), not on the window that was found first */
        const reach = best + CROWN_TOLERANCE * perUnit;
        let left = Math.floor(hx);
        let right = left;
        while (left > lo && tops[left - 1] <= reach) left--;
        while (right < hi && tops[right + 1] <= reach) right++;
        result = { hx: (left + right + 1) / 2, hy: best };
      }
    } catch (error) {
      result = null;
    }
    if (ids.size > CACHE_CAP) ids.clear();
    ids.set(key, result);
    return result;
  }

  function worn(slot) {
    try {
      const id = rules.worn(slot);
      return id ? prizeOf(id) : null;
    } catch (error) {
      return null;
    }
  }

  function wearing() {
    return !!worn('hat');
  }

  function drawOn(ctx, key, x, y, env, pose) {
    try {
      const hat = worn('hat');
      const s = hat ? hatSprite(hat.look, hat.color) : null;
      if (!s) return;
      rec.reset();
      art.drawCreature(rec, key, x, y, env, pose);
      if (!rec.src || !rec.unit || !rec.sw || !rec.dw) return;
      /* source pixels per figure pixel, and figure pixels on the screen */
      const toLocal = rec.dw / rec.sw;
      const unit = rec.unit;
      const sideView = !!(pose && (pose.dir === 2 || pose.dir === 3));
      const m = measure(rec.src, rec.sx, rec.sy, rec.sw, rec.sh, unit / toLocal, sideView);
      if (!m) return;
      /* the painter mirrors a picture facing right: the hat's place and the hat are mirrored with it */
      const side = rec.flip ? -1 : 1;
      const hx = rec.tx + side * (rec.dx + m.hx * toLocal);
      const hy = rec.ty + rec.dy + m.hy * (rec.dh / rec.sh);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = pose && pose.alpha != null ? pose.alpha : 1;
      ctx.translate(Math.round(hx), Math.round(hy - (s.ay - s.sink) * unit));
      if (rec.flip) ctx.scale(-1, 1);
      ctx.drawImage(s.canvas, -s.ax * unit, 0, s.canvas.width * unit, s.canvas.height * unit);
      ctx.restore();
    } catch (error) {
      /* a picture that cannot be measured simply shows no hat */
    }
  }

  return { drawOn, wearing };
}
