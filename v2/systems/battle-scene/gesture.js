/*
 * gesture.js  (engine: battle scene)
 * Job: recognise a shape drawn in one stroke. A stroke is resampled to 48 points, centred and scaled, then
 * compared with the shapes a game supplies (from any start point for closed shapes, in either direction, or
 * at any rotation). It knows no game: the shapes and their limits come from the caller.
 *
 * Public API:
 *   pathLength(points)            the length of a polyline of [x, y] points
 *   resample(points, n)           n points spread evenly along the polyline
 *   new Recognizer(shapes)        shapes: id -> { points, closed, turns, maxCorners, minCorners, limit }
 *       points       the shape as drawn, any size ([x, y] pairs)
 *       closed       the stroke may start anywhere on the shape (a circle, a star)
 *       turns        the stroke may be turned or mirrored (a spiral); the number of rotations tried
 *       maxCorners   a smooth shape: a stroke with more sharp corners than this is not it
 *       minCorners   a pointed shape: a stroke with fewer sharp corners is not it
 *       limit        the largest mean distance that still counts (default 0.2)
 *   recognizer.score(stroke, allowed, slack)
 *       stroke in screen pixels; allowed: the ids to try (all when not given); slack: id -> extra limit
 *       -> null for a stroke that is too short, else { kind, guess, distance, accuracy }
 *          kind: the shape, or null when nothing is close enough; guess: the nearest shape;
 *          accuracy: 0 (at the limit) to 1 (perfect)
 *   recognizer.recognize(stroke, allowed)   the kind or null
 *   recognizer.glyph(id)          the shape as 64 points (65 when closed) centred on its box, size 1, for drawing
 *   recognizer.has(id)
 */

const N = 48;
const MIN_POINTS = 6;
const MIN_LENGTH = 30;
const DEFAULT_LIMIT = 0.2;
const CLOSED_SHIFTS = 12;
/* a corner is a turn sharper than this cosine, measured three points to each side */
const CORNER_COS = 0.35;
const CORNER_GAP = 4;

export function pathLength(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return d;
}

export function resample(points, n) {
  const step = pathLength(points) / (n - 1);
  const p = points.map((q) => [q[0], q[1]]);
  const out = [[p[0][0], p[0][1]]];
  let run = 0;
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (run + d >= step && d > 0) {
      const t = (step - run) / d;
      const q = [p[i - 1][0] + t * (p[i][0] - p[i - 1][0]), p[i - 1][1] + t * (p[i][1] - p[i - 1][1])];
      out.push(q);
      p.splice(i, 0, q);
      run = 0;
    } else run += d;
  }
  const last = p[p.length - 1];
  while (out.length < n) out.push([last[0], last[1]]);
  return out.slice(0, n);
}

function box(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const q of points) {
    if (q[0] < minX) minX = q[0];
    if (q[0] > maxX) maxX = q[0];
    if (q[1] < minY) minY = q[1];
    if (q[1] > maxY) maxY = q[1];
  }
  return { minX, minY, maxX, maxY, size: Math.max(maxX - minX, maxY - minY) || 1 };
}

/* 48 points, centred on their mean, the longer side scaled to 1 */
function normalize(points) {
  const r = resample(points, N);
  const b = box(r);
  let cx = 0;
  let cy = 0;
  for (const q of r) {
    cx += q[0];
    cy += q[1];
  }
  cx /= N;
  cy /= N;
  return r.map((q) => [(q[0] - cx) / b.size, (q[1] - cy) / b.size]);
}

function distance(a, b) {
  let d = 0;
  for (let i = 0; i < N; i++) d += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]);
  return d / N;
}

function countCorners(g) {
  let corners = 0;
  let last = -9;
  for (let i = 3; i < g.length - 3; i++) {
    const ax = g[i][0] - g[i - 3][0];
    const ay = g[i][1] - g[i - 3][1];
    const bx = g[i + 3][0] - g[i][0];
    const by = g[i + 3][1] - g[i][1];
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    if (!la || !lb) continue;
    if ((ax * bx + ay * by) / (la * lb) < CORNER_COS && i - last > CORNER_GAP) {
      corners++;
      last = i;
    }
  }
  return corners;
}

function turned(g, turns) {
  const out = [];
  for (let r = 0; r < turns; r++) {
    const a = (r / turns) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    for (const mirror of [1, -1]) out.push(g.map((q) => [(q[0] * c - q[1] * s) * mirror, q[0] * s + q[1] * c]));
  }
  return out;
}

export class Recognizer {
  #shapes = new Map();
  #glyphs = new Map();

  constructor(shapes) {
    for (const id of Object.keys(shapes || {})) {
      const s = shapes[id];
      this.#shapes.set(id, {
        raw: s.points, closed: !!s.closed, turns: s.turns || 0, points: normalize(s.points),
        maxCorners: s.maxCorners == null ? Infinity : s.maxCorners, minCorners: s.minCorners || 0,
        limit: s.limit || DEFAULT_LIMIT
      });
    }
  }

  has(id) {
    return this.#shapes.has(id);
  }

  score(stroke, allowed, slack) {
    if (!stroke || stroke.length < MIN_POINTS || pathLength(stroke) < MIN_LENGTH) return null;
    const g = normalize(stroke);
    const corners = countCorners(g);
    let both = null;
    let best = null;
    let bestD = Infinity;
    for (const id of allowed || this.#shapes.keys()) {
      const shape = this.#shapes.get(id);
      if (!shape || corners > shape.maxCorners || corners < shape.minCorners) continue;
      if (!both) both = [g, g.slice().reverse()];
      const tries = shape.turns ? turned(g, shape.turns) : both;
      const shifts = shape.closed ? CLOSED_SHIFTS : 1;
      for (let s = 0; s < shifts; s++) {
        const off = Math.round((s * N) / shifts);
        const target = off ? shape.points.slice(off).concat(shape.points.slice(0, off)) : shape.points;
        for (const t of tries) {
          const d = distance(t, target);
          if (d < bestD) {
            bestD = d;
            best = id;
          }
        }
      }
    }
    if (best == null) return { kind: null, guess: null, distance: Infinity, accuracy: 0 };
    const limit = this.#shapes.get(best).limit + ((slack && slack[best]) || 0);
    return { kind: bestD < limit ? best : null, guess: best, distance: bestD, accuracy: Math.max(0, Math.min(1, 1 - bestD / limit)) };
  }

  recognize(stroke, allowed) {
    const s = this.score(stroke, allowed);
    return s ? s.kind : null;
  }

  glyph(id) {
    let g = this.#glyphs.get(id);
    if (g) return g;
    const shape = this.#shapes.get(id);
    if (!shape) return [];
    const r = resample(shape.raw, 64);
    const b = box(r);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    if (shape.closed) r.push(r[0]);
    g = r.map((q) => [(q[0] - cx) / b.size, (q[1] - cy) / b.size]);
    this.#glyphs.set(id, g);
    return g;
  }
}
