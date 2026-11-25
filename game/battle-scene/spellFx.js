/*
 * spellFx.js  (Hontori game layer)
 * Job: what a wand spell looks like on the battle picture: the drawn stroke snapping to its perfect sigil,
 * sinking to the ground under the target as a turning magic circle with a pillar of light; the Binding Spiral
 * wrapping a foe, its three shakes and the streak of light into the wand; the owner's hand that pushes a
 * binding away; and the dashed guide of a sigil to trace. (Old src/battle.js castSpell, bind, repelHand.)
 *
 * Public API (scene: the HontoriBattleScene; places are its { x, y, gy, sc } per side):
 *   castSigil(scene, kind, target, drawn)   drawn: { cx, cy, size } of the stroke; resolves when the spell lands
 *   wrapFoe(scene)                          the spiral and the three shakes (about 1.7 s)
 *   intoWand(scene)                         the bound foe becomes light and flies to the wand
 *   breakFree(scene), slipAway(scene)       a failed spiral; the foe leaving after the last one
 *   repelHand(scene)                        the open hand and its golden ward over the foe
 *   drawGuide(g, kind, seconds, width, height)   the dashed shape and the dot gliding along it
 *   drawVeil(g, veil, P, seconds)           the veil of glass around the foe under the rule seal: one ring of panes per
 *                                           layer (veil { layers, max, hit }: hit is the time of the last crack, which
 *                                           flashes the rings white for a moment); nothing while there are no layers
 */

import { element } from '../../ui/dom.js';
import { inkStroke } from '../../systems/battle-scene/SigilSurface.js';
import { drawSigil, glyphPath } from './sigils.js';
import { blob } from './moveAnims.js';
import { SPELL_COLORS, handPicture, rgba } from './look.js';

const CAST_MS = 1700;
const SNAP_MS = 380;
const SINK_MS = 300;
const LANDS_AFTER = 0.2;
const GUIDE_LOOP = 3.2;

export function castSigil(scene, kind, target, drawn) {
  const stage = scene.stage;
  const P = scene.places[target];
  const color = SPELL_COLORS[kind];
  const { cx, cy } = drawn;
  const rr = Math.max(12, drawn.size * 0.62);
  const rest = CAST_MS - SNAP_MS - SINK_MS;
  stage.fx(CAST_MS, (g, k, ms) => {
    const T = stage.time;
    let x = cx;
    let y = cy;
    let r = rr;
    let flat = 1;
    let a = 1;
    if (ms < SNAP_MS) {
      const u = ms / SNAP_MS;
      r = rr * (1 + 0.12 * Math.sin(u * Math.PI));
      blob(g, cx, cy, rr * 1.6, rgba(color, 1), 0.5 * (1 - u));
    } else if (ms < SNAP_MS + SINK_MS) {
      const v = (ms - SNAP_MS) / SINK_MS;
      const e = v * v * (3 - 2 * v);
      x = cx + (P.x - cx) * e;
      y = cy + (P.gy - cy) * e;
      r = rr + (22 - rr) * e;
      flat = 1 - 0.68 * e;
    } else {
      const w = (ms - SNAP_MS - SINK_MS) / rest;
      x = P.x;
      y = P.gy;
      r = 22 + w * 6;
      flat = 0.32;
      a = w < 0.6 ? 1 : 1 - (w - 0.6) / 0.4;
      const pillar = 10 * Math.sin(Math.min(1, w * 1.6) * Math.PI);
      if (pillar > 0) {
        g.globalCompositeOperation = 'lighter';
        const light = g.createLinearGradient(0, y - 70, 0, y);
        light.addColorStop(0, 'rgba(255,255,255,0)');
        light.addColorStop(1, rgba(color, 0.55));
        g.fillStyle = light;
        g.fillRect(x - pillar, y - 70, pillar * 2, 70);
        g.globalCompositeOperation = 'source-over';
      }
    }
    const sunk = ms >= SNAP_MS + SINK_MS;
    drawSigil(g, kind, x, y, r, color, { rot: T * (sunk ? 2.2 : 0.5), alpha: a, flat, lw: 1 });
    if (sunk) drawSigil(g, kind, x, y, r * 0.62, '#ffffff', { rot: -T * 3, alpha: a * 0.5, flat, simple: true, glyph: 0, seed: 3 });
  });
  return stage.wait(SNAP_MS + SINK_MS + rest * LANDS_AFTER).then(() => stage.burst(P.x, P.y, color, 26, 1.4));
}

export async function wrapFoe(scene) {
  const stage = scene.stage;
  const P = scene.places.foe;
  const fx = scene.view.foe.fx;
  stage.fx(2000, (g, k) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * 12 + k * 8;
      const r = 22 * (1 - t * 0.8) * (1 - k * 0.3);
      pts.push([P.x + Math.cos(a) * r, P.y + Math.sin(a) * r * 0.8]);
    }
    inkStroke(g, pts, 0.8, '#ffd98a', Math.sin(k * Math.PI));
  });
  for (let s = 0; s < 3; s++) {
    await stage.wait(420);
    fx.dx = s % 2 ? 3 : -3;
    fx.alpha = 0.5;
    scene.game.sound.play('bump');
    await stage.wait(140);
    fx.dx = 0;
    fx.alpha = 1;
  }
}

export async function intoWand(scene) {
  const stage = scene.stage;
  const P = scene.places.foe;
  const wandX = scene.places.me.x - 30;
  const fx = scene.view.foe.fx;
  await stage.run(600, {
    step(k) {
      fx.alpha = 1 - k;
      fx.lift = -k * 6;
    },
    draw(g, k) {
      blob(g, P.x + (wandX - P.x) * k, P.y + (stage.height - P.y) * k * k, 10, 'rgba(255,230,160,1)', 1 - k * 0.5);
    }
  });
  stage.burst(wandX, scene.uiTop, '#ffd98a', 30, 1.5);
}

export function breakFree(scene) {
  const P = scene.places.foe;
  scene.stage.burst(P.x, P.y, '#ffd98a', 20, 1.4);
}

export function slipAway(scene) {
  const fx = scene.view.foe.fx;
  fx.alpha = 1;
  return scene.stage.run(700, {
    step(k) {
      fx.dx = k * 60;
      fx.alpha = 1 - k;
    }
  });
}

export function repelHand(scene) {
  const stage = scene.stage;
  const P = scene.places.foe;
  const unit = stage.unit;
  const x = P.x * unit;
  const y = P.y * unit;
  const size = Math.max(70, Math.min(120, scene.cssWidth * 0.24));
  const ward = element('div', 'bt-ward', scene.root);
  ward.style.left = `${x - size * 0.8}px`;
  ward.style.top = `${y - size * 0.8}px`;
  ward.style.width = `${size * 1.6}px`;
  ward.style.height = `${size * 1.6}px`;
  const hand = element('img', 'bt-hand', scene.root);
  hand.alt = '';
  hand.src = handPicture();
  hand.style.left = `${x - size / 2 - size * 0.15}px`;
  hand.style.top = `${y - size * 0.6}px`;
  hand.style.width = `${size}px`;
  for (const node of [ward, hand]) node.addEventListener('animationend', () => node.remove());
  stage.after(380, () => {
    scene.game.sound.play('bump');
    stage.shake(0.3);
    for (let i = 0; i < 22; i++) {
      const an = Math.random() * Math.PI * 2;
      stage.particle({
        x: P.x + Math.cos(an) * 18, y: P.y + Math.sin(an) * 18, vx: Math.cos(an) * (1 + Math.random() * 2),
        vy: Math.sin(an) * (1 + Math.random() * 2), l: 1, d: 0.03, c: i % 3 ? '#ffd98a' : '#ffffff', s: 1.5
      });
    }
  });
}

export function drawGuide(g, kind, seconds, width, height) {
  const path = glyphPath(kind);
  const pts = path.points;
  if (pts.length < 2) return;
  const size = Math.min(width, height) * 0.3;
  const ox = width / 2;
  const oy = height * 0.46;
  const color = SPELL_COLORS[kind] || '#ffd98a';
  g.globalAlpha = Math.min(1, seconds * 2) * 0.8;
  g.setLineDash([3, 4]);
  g.lineWidth = 1.6;
  g.strokeStyle = color;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  pts.forEach((q, i) => {
    if (i) g.lineTo(ox + q[0] * size, oy + q[1] * size);
    else g.moveTo(ox + q[0] * size, oy + q[1] * size);
  });
  g.stroke();
  g.setLineDash([]);
  const at = ((seconds / GUIDE_LOOP) % 1) * path.total;
  let seg = 1;
  while (seg < pts.length - 1 && path.lengths[seg] < at) seg++;
  const from = path.lengths[seg - 1];
  const to = path.lengths[seg];
  const f = to > from ? (at - from) / (to - from) : 0;
  const x = ox + (pts[seg - 1][0] + (pts[seg][0] - pts[seg - 1][0]) * f) * size;
  const y = oy + (pts[seg - 1][1] + (pts[seg][1] - pts[seg - 1][1]) * f) * size;
  g.fillStyle = color;
  g.globalAlpha = 0.35;
  g.beginPath();
  g.arc(x, y, 4, 0, 7);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(x, y, 1.8, 0, 7);
  g.fill();
}

const VEIL_GLASS = '#d8e6ff';
const VEIL_PANES = 7;
const VEIL_FLASH = 0.5;

export function drawVeil(g, veil, P, seconds) {
  if (!veil || !(veil.layers > 0) || !P) return;
  const flash = veil.hit > 0 ? Math.max(0, 1 - (seconds - veil.hit) / VEIL_FLASH) : 0;
  const s = P.sc || 1;
  g.save();
  g.lineCap = 'butt';
  for (let i = 0; i < veil.layers; i++) {
    const rx = (19 + i * 5) * s;
    const ry = rx * 0.86;
    const turn = seconds * (i % 2 ? -0.35 : 0.3) + i * 0.7;
    g.lineWidth = Math.max(1, 1.4 * s);
    g.strokeStyle = flash > 0 ? '#ffffff' : VEIL_GLASS;
    g.globalAlpha = 0.32 + 0.1 * Math.sin(seconds * 1.6 + i) + 0.5 * flash;
    for (let p = 0; p < VEIL_PANES; p++) {
      const a0 = turn + (p / VEIL_PANES) * Math.PI * 2;
      g.beginPath();
      g.ellipse(P.x, P.y, rx, ry, 0, a0, a0 + (Math.PI * 2) / VEIL_PANES - 0.16);
      g.stroke();
    }
  }
  g.restore();
}
