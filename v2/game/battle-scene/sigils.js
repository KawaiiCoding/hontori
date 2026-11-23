/*
 * sigils.js  (Hontori game layer)
 * Job: Hontori's sigils: the shape of every spell as it is drawn (always starting on the left), the recogniser
 * built from them, and the pictures of a sigil: the turning magic circle on the battle picture and the small
 * emblem on the spell sheet. Values are the current game's (src/battle.js RAW, drawSigil, sigilSVG).
 *
 * Public API:
 *   SHAPES                 spell id -> the template the engine's Recognizer takes (points, closed, turns, limits)
 *   sigils                 the Recognizer over SHAPES: score(stroke, allowed, slack), recognize, glyph(id)
 *   RUNES                  eight small rune drawings (also the marks that peel off the ink)
 *   drawSigil(g, kind, x, y, r, color, { rot, alpha, flat, lw, simple, glyph, seed })
 *                          a magic circle: double ring, turning rune band, inner ticks, a faint hexagram and the
 *                          spell's glyph; flat squashes it onto the ground; glyph 0 leaves the glyph out
 *   sigilSvg(kind, color)  svg markup of the emblem (64 x 64 units)
 *   glyphPath(kind)        { points, lengths, total } of the glyph, for a dot gliding along it
 */

import { Recognizer } from '../../systems/battle-scene/gesture.js';
import { inkStroke } from '../../systems/battle-scene/SigilSurface.js';

function arc(n, a0, a1, cx, cy, rx, ry) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
  }
  return out;
}

function plot(n, fn) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(fn(i / n, i));
  return out;
}

/* a cup: down the left side, round bottom, up the right side */
const CUP = [[0, 0], [0, 0.3]].concat(arc(16, Math.PI, 0, 0.5, 0.45, 0.5, 0.55), [[1, 0.3], [1, 0]])
  .map((q, i) => (i > 1 && i < 19 ? [q[0], q[1] < 0.45 ? 0.45 : q[1]] : q));

export const SHAPES = Object.freeze({
  /* a circle that starts on the left and goes over the top */
  mend: { points: arc(32, Math.PI, Math.PI * 3, 0, 0, 1, 1), closed: true, maxCorners: 1 },
  shield: { points: CUP },
  /* a peak */
  boost: { points: [[0, 1], [0.5, 0], [1, 1]] },
  stun: { points: [[0.25, 0], [0.75, 0.38], [0.25, 0.62], [0.75, 1]] },
  sleep: { points: plot(40, (x) => [x, 0.5 + 0.22 * Math.sin(x * Math.PI * 4)]), maxCorners: 1 },
  /* a spiral from the outside in, two turns, starting on the left; it may be turned or mirrored */
  bind: {
    points: plot(60, (t) => [Math.cos(Math.PI + t * Math.PI * 4) * (1 - t * 0.85), Math.sin(Math.PI + t * Math.PI * 4) * (1 - t * 0.85)]),
    turns: 16, maxCorners: 3, limit: 0.29
  },
  /* a five-point star in one stroke: from the lower left up to the top first */
  revive: {
    points: plot(5, (t, i) => [Math.cos(Math.PI * 0.7 + (i * Math.PI * 4) / 5), Math.sin(Math.PI * 0.7 + (i * Math.PI * 4) / 5)]),
    closed: true, minCorners: 3, limit: 0.16
  },
  /* the veil spell: a V, opening the curtain */
  veil: { points: [[0, 0], [0.5, 1], [1, 0]] },
  /* the fishing sigil: a hook, straight down, then curling up to the left */
  fish: { points: [[0.7, 0], [0.7, 0.62]].concat(arc(12, 0, Math.PI, 0.45, 0.62, 0.25, 0.3), [[0.2, 0.45]]) }
});

export const sigils = new Recognizer(SHAPES);

export const RUNES = Object.freeze([
  [[[0, -1], [0, 1]], [[0, -0.2], [0.7, -0.9]]],
  [[[-0.6, -1], [0.6, 0], [-0.6, 1]]],
  [[[0, -1], [0, 1]], [[-0.7, -0.3], [0.7, 0.3]]],
  [[[-0.6, 1], [0, -1], [0.6, 1]], [[-0.3, 0.2], [0.3, 0.2]]],
  [[[-0.6, -1], [0.6, -1], [-0.6, 1], [0.6, 1]]],
  [[[0, -1], [0.7, 0], [0, 1], [-0.7, 0], [0, -1]]],
  [[[-0.6, -1], [-0.6, 1]], [[0.6, -1], [0.6, 1]], [[-0.6, 0], [0.6, 0]]],
  [[[-0.7, -1], [0, 0], [0.7, -1]], [[0, 0], [0, 1]]]
]);

const TAU = 6.283;
const paths = new Map();

export function glyphPath(kind) {
  let path = paths.get(kind);
  if (path) return path;
  const points = sigils.glyph(kind);
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  path = { points, lengths, total: lengths[lengths.length - 1] || 1 };
  paths.set(kind, path);
  return path;
}

function poly(g, points, width, color, alpha) {
  if (points.length < 2) return;
  g.globalAlpha = alpha;
  g.lineWidth = width;
  g.strokeStyle = color;
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.stroke();
}

export function drawSigil(g, kind, x, y, r, color, options) {
  const o = options || {};
  const rot = o.rot || 0;
  const a = o.alpha == null ? 1 : o.alpha;
  const flat = o.flat || 1;
  const lw = Math.max(0.6, r * 0.035) * (o.lw || 1);
  if (a <= 0) return;
  g.save();
  g.translate(x, y);
  g.scale(1, flat);
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const ringAt = (radius, width, alpha) => {
    g.globalAlpha = alpha * a;
    g.lineWidth = width;
    g.strokeStyle = color;
    g.beginPath();
    g.arc(0, 0, radius, 0, TAU);
    g.stroke();
  };
  ringAt(r, lw * 3, 0.18);
  ringAt(r, lw, 0.95);
  ringAt(r * 0.84, lw * 0.8, 0.8);
  const count = 10;
  for (let i = 0; i < count; i++) {
    const an = rot + (i / count) * TAU;
    const size = r * 0.055;
    g.save();
    g.translate(Math.cos(an) * r * 0.92, Math.sin(an) * r * 0.92);
    g.rotate(an + Math.PI / 2);
    for (const stroke of RUNES[(i + (o.seed || 0)) % RUNES.length]) {
      poly(g, stroke.map((q) => [q[0] * size, q[1] * size]), lw * 0.7, '#ffffff', 0.85 * a);
    }
    g.restore();
    const tb = an + 3.14159 / count;
    g.globalAlpha = 0.7 * a;
    g.lineWidth = lw * 0.7;
    g.strokeStyle = color;
    g.beginPath();
    g.moveTo(Math.cos(tb) * r * 0.86, Math.sin(tb) * r * 0.86);
    g.lineTo(Math.cos(tb) * r * 0.98, Math.sin(tb) * r * 0.98);
    g.stroke();
  }
  if (!o.simple) {
    g.globalAlpha = 0.6 * a;
    g.strokeStyle = color;
    g.lineWidth = lw * 0.6;
    g.beginPath();
    for (let j = 0; j < 24; j++) {
      const b = -rot * 1.4 + (j / 24) * TAU;
      const len = j % 3 ? 0.06 : 0.11;
      g.moveTo(Math.cos(b) * r * 0.7, Math.sin(b) * r * 0.7);
      g.lineTo(Math.cos(b) * r * (0.7 - len), Math.sin(b) * r * (0.7 - len));
    }
    g.stroke();
    ringAt(r * 0.72, lw * 0.5, 0.45);
    g.globalAlpha = 0.22 * a;
    g.lineWidth = lw * 0.6;
    g.beginPath();
    for (let h = 0; h < 2; h++) {
      for (let v = 0; v <= 3; v++) {
        const c = rot * 0.5 + (h * Math.PI) / 3 + v * 2.094;
        if (v) g.lineTo(Math.cos(c) * r * 0.84, Math.sin(c) * r * 0.84);
        else g.moveTo(Math.cos(c) * r * 0.84, Math.sin(c) * r * 0.84);
      }
    }
    g.stroke();
  }
  g.restore();
  const size = r * (o.glyph == null ? 1 : o.glyph);
  if (!size) return;
  inkStroke(g, sigils.glyph(kind).map((q) => [x + q[0] * size, y + q[1] * size * flat]), lw * 1.4, color, a);
}

export function sigilSvg(kind, color) {
  let glyph = '';
  sigils.glyph(kind).forEach((q, i) => {
    glyph += `${i ? 'L' : 'M'}${(q[0] * 26).toFixed(1)} ${(q[1] * 26).toFixed(1)}`;
  });
  let ticks = '';
  let runes = '';
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU - Math.PI / 2;
    const cx = Math.cos(an) * 27;
    const cy = Math.sin(an) * 27;
    const ca = Math.cos(an + Math.PI / 2);
    const sa = Math.sin(an + Math.PI / 2);
    for (const stroke of RUNES[i % RUNES.length]) {
      let d = '';
      stroke.forEach((q, k) => {
        const rx = q[0] * 1.5;
        const ry = q[1] * 1.5;
        d += `${k ? 'L' : 'M'}${(cx + rx * ca - ry * sa).toFixed(1)} ${(cy + rx * sa + ry * ca).toFixed(1)}`;
      });
      runes += `<path d="${d}"/>`;
    }
    const tb = an + Math.PI / 8;
    ticks += `<path d="M${(Math.cos(tb) * 25).toFixed(1)} ${(Math.sin(tb) * 25).toFixed(1)}L${(Math.cos(tb) * 29).toFixed(1)} ${(Math.sin(tb) * 29).toFixed(1)}"/>`;
  }
  return `<svg viewBox="-32 -32 64 64" style="filter:drop-shadow(0 0 3px ${color})"><g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">`
    + `<circle r="30" stroke-width="1.4"/><circle r="24.5" stroke-width="1" opacity=".8"/><g stroke-width="1" opacity=".9">${ticks}</g>`
    + `<g stroke="#fff" stroke-width=".9">${runes}</g>`
    + `<path d="${glyph}" stroke-width="7" opacity=".25"/><path d="${glyph}" stroke-width="3.6"/><path d="${glyph}" stroke="#fff" stroke-width="1.4"/></g></svg>`;
}
