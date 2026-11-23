/*
 * fighters.js  (Hontori game layer)
 * Job: paint one hontori on the battle picture with everything that shows on it: the white flash of a hit,
 * the faded look of a fainted or veiled one, and the visuals of each status (sleep letters, stun stars, the
 * ward arc, rally chevrons, the warm glow, the stone shell, tailwind lines, mist, roots).
 *
 * Public API:
 *   newActor(side)       the picture state of one side: { side, key, name, level, el, el2, stage, hp, max, sta,
 *                        staMax, status: {}, fx: { dx, dy, hit, alpha, lift, kb } }
 *   fillActor(actor, fighter)   copy a rules fighter into it (statuses cleared, picture offsets reset)
 *   settle(actor, dt)    one tick: the hit flash fades, a knock-back eases out
 *   drawFighter(g, art, actor, place, time, env, mine)
 *        place: { x, y, gy, sc }; env: { time, weather, indoor }; mine: the kid's own hontori (seen from behind)
 *   setDress(fn)         fn(g, actor, x, y, env, pose) paints what the kid's own hontori wears over it (the
 *                        capsule prizes); guarded: one that throws is dropped
 */

import { blob } from './moveAnims.js';
import { UP, DOWN } from '../../core/units.js';

const HIT_FADE = 1.8;

let dress = null;

export function setDress(fn) {
  dress = typeof fn === 'function' ? fn : null;
}

export function newActor(side) {
  return {
    side, key: '', name: '', level: 1, el: 'fire', el2: null, stage: undefined, hp: 0, max: 1, sta: 0, staMax: 0,
    status: {}, fx: { dx: 0, dy: 0, hit: 0, alpha: 1, lift: 0, kb: 0 }
  };
}

export function fillActor(actor, f) {
  actor.key = f.key;
  actor.name = f.name;
  actor.level = f.level;
  actor.el = f.el;
  actor.el2 = f.el2;
  actor.stage = f.stage;
  actor.hp = f.hp;
  actor.max = f.max;
  actor.sta = f.sta;
  actor.staMax = f.staMax;
  actor.status = {};
  Object.assign(actor.fx, { dx: 0, dy: 0, hit: 0, lift: 0, kb: 0 });
  return actor;
}

export function settle(actor, dt) {
  const fx = actor.fx;
  fx.hit = Math.max(0, fx.hit - dt * HIT_FADE);
  if (!fx.kb) return;
  fx.dx = fx.kb;
  fx.kb *= 0.85;
  if (Math.abs(fx.kb) < 0.2) {
    fx.kb = 0;
    fx.dx = 0;
  }
}

export function drawFighter(g, art, actor, place, T, env, mine) {
  const fx = actor.fx;
  const st = actor.status;
  const x = Math.round(place.x + fx.dx);
  const y = Math.round(place.y + fx.dy + fx.lift);
  const sc = place.sc;
  const out = actor.hp <= 0;
  const alpha = fx.alpha * (out && mine ? 0.45 : 1) * (st.veil ? 0.6 : 1);
  if (alpha <= 0.01) return;
  const senv = { t: T, time: env.time, weather: env.weather, wind: 0.3, indoor: !!env.indoor };
  const pose = { scale: sc, stage: actor.stage, sit: !!st.asleep || out, dir: mine ? UP : DOWN, alpha };
  art.drawCreature(g, actor.key, x, y, senv, pose);
  if (mine && dress) {
    try {
      dress(g, actor, x, y, senv, pose);
    } catch (error) {
      dress = null;
      console.warn('fighters: what the hontori wears could not be drawn', error);
    }
  }
  if (fx.hit > 0) {
    g.globalCompositeOperation = 'lighter';
    art.drawCreature(g, actor.key, x, y, senv, Object.assign({}, pose, { alpha: Math.min(1, fx.hit * 1.6), noShadow: true }));
    g.globalCompositeOperation = 'source-over';
  }
  if (st.asleep) {
    g.fillStyle = '#e8e0ff';
    g.font = 'bold 7px Nunito, sans-serif';
    g.textAlign = 'left';
    for (let z = 0; z < 2; z++) {
      const u = (T * 0.6 + z * 0.5) % 1;
      g.globalAlpha = 1 - u;
      g.fillText('z', x + 8 * sc + u * 4, y - 12 * sc - u * 8);
    }
    g.globalAlpha = 1;
  }
  if (st.stun) {
    g.fillStyle = '#ffe27a';
    for (let s = 0; s < 3; s++) {
      const an = T * 4 + s * 2.1;
      g.fillRect(x + (Math.cos(an) * 9 * sc) / 1.4, y - 13 * sc + Math.sin(an) * 2.5, 1.5, 1.5);
    }
  }
  g.globalCompositeOperation = 'lighter';
  if (st.shield) {
    g.strokeStyle = '#8fd8ff';
    g.lineWidth = 1;
    g.globalAlpha = 0.55 + 0.15 * Math.sin(T * 3);
    g.beginPath();
    g.ellipse(x, y, 13 * sc, 12 * sc, 0, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    g.globalAlpha = 0.15;
    g.beginPath();
    g.ellipse(x, y, 13 * sc, 12 * sc, 0, 0, 6.283);
    g.stroke();
  }
  if (st.boost) {
    g.strokeStyle = '#ffb35a';
    g.lineWidth = 1;
    for (let c = 0; c < 2; c++) {
      const u = (T * 0.8 + c * 0.5) % 1;
      const cy = y + 6 * sc - u * 16 * sc;
      g.globalAlpha = 1 - u;
      g.beginPath();
      g.moveTo(x - 9 * sc - 2, cy + 2);
      g.lineTo(x - 9 * sc, cy);
      g.lineTo(x - 9 * sc + 2, cy + 2);
      g.stroke();
    }
  }
  if (st.glow) blob(g, x, y, 14 * sc, 'rgba(255,150,60,1)', 0.25 + 0.08 * Math.sin(T * 4));
  if (st.harden) {
    g.globalAlpha = 0.5;
    g.strokeStyle = '#d8b088';
    g.lineWidth = 1;
    g.beginPath();
    for (let h = 0; h <= 6; h++) {
      const a = (h / 6) * 6.283 + T * 0.3;
      if (h) g.lineTo(x + Math.cos(a) * 11 * sc, y + 2 + Math.sin(a) * 10 * sc);
      else g.moveTo(x + Math.cos(a) * 11 * sc, y + 2 + Math.sin(a) * 10 * sc);
    }
    g.stroke();
  }
  if (st.tail) {
    g.globalAlpha = 0.5;
    g.strokeStyle = '#dffcf6';
    g.lineWidth = 0.6;
    for (let t = 0; t < 3; t++) {
      const tx = x - 14 * sc - ((T * 40 + t * 9) % 18);
      g.beginPath();
      g.moveTo(tx, y - 4 + t * 5);
      g.lineTo(tx + 6, y - 4 + t * 5);
      g.stroke();
    }
  }
  if (st.mist) blob(g, x, y + 4, 16 * sc, 'rgba(220,235,255,1)', 0.25);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  if (st.root) {
    g.fillStyle = '#6a4a28';
    for (let r = 0; r < 5; r++) g.fillRect((x + Math.cos(r * 1.3) * 9 * sc) | 0, (place.gy + 1 + Math.sin(r * 1.3) * 2) | 0, 3, 1);
    g.fillStyle = '#a8ec6c';
    g.fillRect(x - 6, place.gy - 1 - ((T * 2) % 2), 1, 1);
  }
}
