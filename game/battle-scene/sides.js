/*
 * sides.js  (Hontori game layer)
 * Job: the extra pieces of Hontori's battle screen for chapters 8 and 9: the double battle (mode ally: the ally's
 * hontori behind the kid's, the second foe behind the first, each with a small name and health bar under it, and
 * their blows), the Lantern Sigil showing the foe's next turn, a sealed spell slot (rule blind) and a sigil that
 * fades under the twist flawless. The rules are game/battle (ally.js, cast.js); this only shows them.
 *
 * Public API:
 *   SIDE_PLACES              { ally, foe2 }: { x, gy, sc } as shares of the stage, like the scene's own places
 *   newSides(battle)         { ally, foe2 } actors from battle.double (null when there is none)
 *   placeSides(scene)        fill scene.places.ally / foe2 from the stage size (call from layout)
 *   paintSides(g, scene, T, env)   the two extra hontori with their health bars (call from paintActors, before the
 *                            others)
 *   trainerX(scene)          where the trainer stands: behind the first foe, or between both foes
 *   sideHandlers             { sideMove, sideDamage, sideFaint, sideUp, foresee, fizzle, sealedSlot } for the scene
 */

import { ELEMENT_COLORS } from './look.js';
import { line } from '../battle/text.js';
import { handlers as baseHandlers } from './battleEvents.js';

export const SIDE_PLACES = Object.freeze({
  ally: { x: 0.14, gy: 0.42, sc: 1.15 },
  foe2: { x: 0.84, gy: 0.33, sc: 1.15 },
});
/* in a double battle the first foe stands a little to the left, so both fit */
const FOE_X = 0.54;

const BAR_W = 26;
const HIT_FADE = 2.5;

function actorOf(v) {
  if (!v) return null;
  return { key: v.key, el: v.el, stage: v.stage, name: v.name, owner: v.owner || '', hp: v.hp, max: v.max || 1, out: !!v.fainted, hit: 0, hop: 0, alpha: 1 };
}

export function newSides(battle) {
  const d = battle && battle.double;
  return { ally: actorOf(d && d.ally), foe2: actorOf(d && d.partner) };
}

export function placeSides(scene) {
  const { stage, places } = scene;
  if (scene.sides && scene.sides.foe2 && places.foe) places.foe.x = Math.round(stage.width * FOE_X);
  for (const id of ['ally', 'foe2']) {
    const o = SIDE_PLACES[id];
    const gy = Math.round(stage.height * o.gy);
    places[id] = { x: Math.round(stage.width * o.x), gy, sc: o.sc, y: gy - 10 * o.sc - 2 };
  }
}

function bar(g, x, y, a) {
  const w = BAR_W;
  g.fillStyle = 'rgba(10,10,20,0.75)';
  g.fillRect(x - w / 2 - 1, y - 1, w + 2, 4);
  const frac = Math.max(0, Math.min(1, a.hp / a.max));
  g.fillStyle = frac < 0.3 ? '#ff7a6a' : '#7ee08a';
  g.fillRect(x - w / 2, y, Math.round(w * frac), 2);
}

export function paintSides(g, scene, T, env) {
  const sides = scene.sides;
  if (!sides) return;
  const art = scene.game.art;
  const senv = { t: T, time: env.time, weather: env.weather, wind: 0.3, indoor: !!env.indoor };
  for (const id of ['foe2', 'ally']) {
    const a = sides[id];
    const P = scene.places[id];
    if (!a || !P) continue;
    if (a.hit > 0) a.hit = Math.max(0, a.hit - HIT_FADE / 30);
    const lift = a.hop > 0 ? -Math.sin(a.hop * Math.PI) * 4 : 0;
    if (a.hop > 0) a.hop = Math.max(0, a.hop - 0.06);
    const alpha = a.alpha * (a.out ? 0.4 : 1);
    if (alpha <= 0.01) continue;
    const x = Math.round(P.x);
    const y = Math.round(P.y + lift);
    const pose = { scale: P.sc, stage: a.stage, sit: a.out, dir: id === 'ally' ? 1 : 0, alpha };
    try {
      art.drawCreature(g, a.key, x, y, senv, pose);
      if (a.hit > 0) {
        g.globalCompositeOperation = 'lighter';
        art.drawCreature(g, a.key, x, y, senv, Object.assign({}, pose, { alpha: Math.min(1, a.hit), noShadow: true }));
        g.globalCompositeOperation = 'source-over';
      }
    } catch (error) {
      g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = 1;
    bar(g, x, P.gy + 3, a);
  }
}

export function trainerX(scene) {
  const P = scene.places;
  return scene.sides && scene.sides.foe2 && P.foe2 ? Math.round((P.foe.x + P.foe2.x) / 2) : P.foe.x + 28;
}

function actorAt(scene, id) {
  if (id === 'ally' || id === 'foe2') return scene.sides && scene.sides[id];
  return null;
}

export const sideHandlers = {
  async sideMove(e) {
    await this.settle();
    const a = actorAt(this, e.side);
    if (a) a.hop = 1;
    const from = this.places[e.side];
    const to = this.places[e.target];
    if (from && to) {
      const color = (a && ELEMENT_COLORS[a.el]) || '#ffffff';
      this.stage.fx(380, (g, k) => {
        const x = from.x + (to.x - from.x) * k;
        const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 10;
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = color;
        g.globalAlpha = 0.85;
        g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      });
      await this.stage.wait(380);
    }
  },

  sideDamage(e) {
    const a = actorAt(this, e.target);
    const P = this.places[e.target];
    if (a) {
      a.hp = e.hp;
      a.hit = 1;
    }
    if (P) this.stage.float(P.x, P.y - 12, `-${e.amount}`, '#ffffff', true);
    this.game.sound.play('bump');
    this.tail = 500;
  },

  sideFaint(e) {
    const a = actorAt(this, e.target);
    if (a) a.out = true;
    this.tail = 600;
  },

  async sideUp(e) {
    await this.settle();
    if (this.sides && this.sides.foe2) this.sides.foe2.alpha = 0;
    await baseHandlers.nextFoe.call(this, e);
  },

  /* the Lantern Sigil: the plan of this turn shows, and the next one under it */
  foresee(e) {
    this.view.intent = e.now;
    this.view.next = e.next || null;
    this.view.nextRound = this.battle.round;
    this.refresh();
  },

  fizzle() {
    this.message.say(line('flawlessOnly'));
    this.game.sound.play('bump');
  },

  sealedSlot(e) {
    this.sealSpell(e.kind);
  },
};
