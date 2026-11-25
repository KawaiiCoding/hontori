/*
 * battleEvents.js  (Hontori game layer)
 * Job: how each event of Hontori's battle rules looks and sounds. The rules answer a choice with a list of
 * events (game/battle: fight.js, turn.js, cast.js, rules.js); the scene plays them in order through these
 * handlers, each called with the scene as `this`. A handler changes only the picture: the scene's view (what
 * the cards and sprites show), the stage and the message line. Timings are the current game's.
 *
 * Public API:
 *   handlers     { eventType: async function (event) }
 *
 * Pacing: an event that needs reading time leaves a "tail" (scene.tail, in ms). The tail is waited out by
 * the next event that starts something new (an announcing line, a move, the round end, the next turn), so the
 * lines that belong to one action appear together and the next action never talks over them.
 */

import { ANIM, linger, charge, guard, heal, hex } from './moveAnims.js';
import { castSigil, wrapFoe, intoWand, breakFree, slipAway, repelHand } from './spellFx.js';
import { ELEMENT_COLORS, GRADE_COLORS, label } from './look.js';
import { fillActor } from './fighters.js';
import { GRADES } from '../battle/index.js';
import { showGrade } from '../../ui/BattleNotices.js';

/* lines that open an action: they wait for the previous action to be read */
const ANNOUNCING = new Set(['introWild', 'introDuel', 'moveName', 'foeUses', 'foeUnleash', 'foeCharge', 'foeGuard', 'foeHex', 'go', 'chooseNext']);
const GREEN = '#9cf0a6';
const BLUE = '#9fd0ff';
const VIOLET = '#b9a8ff';
const VEIL = '#d8e6ff';
const other = (side) => (side === 'me' ? 'foe' : 'me');

/* the next line of the rules, shown now instead of in its turn */
function sayNext(scene) {
  const next = scene.take('say');
  if (next) scene.message.say(next.text);
  return next;
}

/* a hit that wakes its target: the rules report the lost sleep a few events later */
function wakesUp(scene, target) {
  for (let i = 0; i < 4; i++) {
    const e = scene.peek(i);
    if (!e || (e.type !== 'say' && e.type !== 'status')) return false;
    if (e.type === 'status' && e.target === target && e.name === 'asleep' && !e.value && e.before) return true;
  }
  return false;
}

export const handlers = {
  async say(e) {
    if (ANNOUNCING.has(e.id)) await this.settle();
    this.message.say(e.text);
  },

  /* a trainer's hontori flares up into its next phase (game/battle/phases.js): a hot flash on it and the
     place's phase music (game/music/places.js `phase`); the music of the place comes back when the screen closes */
  async phase() {
    await this.settle();
    const P = this.places.foe;
    const color = ELEMENT_COLORS[this.view.foe.el] || '#ff8a3c';
    this.stage.flash(color, 0.35);
    this.stage.burst(P.x, P.y, color, 30, 1.6);
    this.stage.shake(3);
    const sound = this.game.sound;
    if (sound && typeof sound.battle === 'function') sound.battle('phase');
    await this.stage.wait(400);
  },

  /* rule seal: the veil of glass around the foe closes in phase two, and the V drawn cracks it (spellFx.js drawVeil) */
  async veilShield(e) {
    await this.settle();
    const P = this.places.foe;
    const veil = this.view.veil;
    veil.max = e.max;
    if (e.change === 'up') {
      veil.layers = e.layers;
      this.stage.flash(VEIL, 0.3);
      this.stage.burst(P.x, P.y, VEIL, 20, 1.2);
      this.game.sound.play('spell');
    } else {
      veil.layers = e.layers;
      veil.hit = this.stage.time;
      this.stage.flash('#ffffff', 0.45);
      this.stage.shake(4);
      for (let i = 0; i < 2 + 2 * (e.by || 1); i++) this.stage.after(i * 90, () => this.stage.burst(P.x + (i % 2 ? 12 : -12), P.y - 4, i % 2 ? VEIL : '#ffffff', 12, 1.4));
      this.stage.float(P.x, P.y - 24, label(e.layers > 0 ? 'floatVeil' : 'floatVeilBroken', { n: e.layers }), VEIL, true);
      this.game.sound.play('sparkle');
    }
    this.refresh();
    await this.stage.wait(500);
  },

  /* the tide of a flooded ring stands a little higher (ring rule tideRise) */
  tide(e) {
    this.setTide(e.level, e.max);
  },

  async matchup(e) {
    await this.stage.wait(300);
    this.showMatchup(e);
    await this.stage.wait(2400);
  },

  mana(e) {
    const P = this.places.me;
    this.view.mana = e.mana;
    if (e.source === 'herb') {
      this.game.sound.play('sparkle');
      this.stage.burst(P.x, P.y, BLUE, 16, 1);
      this.stage.float(P.x, P.y - 18, label('floatMana'), BLUE, true);
    } else this.stage.float(P.x - 18, P.y - 20, label('floatMana'), BLUE);
    this.refresh();
  },

  async turn(e) {
    await this.settle();
    this.view.intent = e.intent;
    /* the Lantern Sigil's look ahead belongs to the round it was drawn in */
    if (e.round !== this.view.nextRound) this.view.next = null;
    this.view.quick = e.quick;
    this.forced = !!e.forced;
    this.refresh();
    this.message.say(e.hintText);
  },

  chooseNext() {
    this.openParty(true);
  },

  status(e) {
    const actor = this.view[e.target];
    if (!actor) return;
    actor.status[e.name] = e.value;
    if (e.target === 'me' && e.name === 'asleep' && e.value && !e.before) {
      const P = this.places.me;
      this.stage.float(P.x, P.y - 20, label('floatAsleep'), VIOLET, true);
    }
    this.refresh();
  },

  async stamina(e) {
    await this.settle();
    const P = this.places.me;
    this.view.me.sta = e.sta;
    this.refresh();
    if (e.change <= 0) return;
    this.stage.float(P.x, P.y - 20, label('floatStamina', { n: e.change }), '#ffd98a', true);
    this.tail = 800;
  },

  async move(e) {
    await this.settle();
    const from = e.side;
    const play = ANIM[e.anim] || ANIM.ember_nip;
    if (from === 'me' && e.util) {
      this.game.sound.play('sparkle');
      const onFoe = e.util === 'mist' || e.util === 'static';
      const X = this.stageApi('me', onFoe ? 'foe' : 'me');
      if (!onFoe) X.b = X.a;
      await play(X);
      this.tail = 600;
      return;
    }
    if (from === 'me') this.game.sound.play('spell');
    await play(this.stageApi(from, other(from)));
  },

  miss(e) {
    const B = this.places[e.target];
    const A = this.places[e.attacker];
    this.view[e.target].fx.kb = (B.x > A.x ? -1 : 1) * -5;
    this.stage.float(B.x, B.y - 18, label(e.dodged ? 'floatDodged' : 'floatMiss'), '#dfe6ff', true);
    this.tail = 500;
  },

  damage(e) {
    const to = e.target;
    const from = other(to);
    const def = this.view[to];
    const B = this.places[to];
    const stage = this.stage;
    def.hp = e.hp;
    if (e.source !== 'move') {
      stage.float(B.x, B.y - 14, `-${e.amount}`, '#fff', true);
      this.refresh();
      return;
    }
    def.fx.hit = 0.7;
    def.fx.kb = (B.x > this.places[from].x ? 1 : -1) * 6;
    stage.shake(e.amount > 7 ? 1.3 : 0.8);
    this.game.sound.play('bump');
    linger(this.stageApi(from, to), this.view[from].el);
    stage.float(B.x, B.y - 14, `-${e.amount}`, to === 'me' ? '#ff9a8a' : e.matchup > 1 ? '#ffd24a' : '#ffffff', true);
    const notes = [];
    if (e.crit) notes.push('Critical!');
    if (e.shielded) notes.push('Warded');
    if (e.guarded) notes.push('Guarded');
    notes.forEach((text, i) => stage.after(120 + i * 160, () => stage.float(B.x + (i % 2 ? 10 : -10), B.y - 26 - i * 2, text, '#cfe9ff')));
    if (e.hp > 0 && def.status.asleep && wakesUp(this, to)) {
      def.status.asleep = 0;
      stage.after(300, () => stage.float(B.x, B.y - 30, label('floatWoke'), VIOLET));
    }
    this.refresh();
    this.tail = 700;
  },

  heal(e) {
    const actor = this.view[e.target];
    const P = this.places[e.target];
    actor.hp = Math.min(actor.max, actor.hp + e.amount);
    if (e.amount || e.source !== 'root') this.stage.float(P.x, P.y - 16, `+${e.amount}`, GREEN, true);
    this.refresh();
  },

  async skip(e) {
    await this.settle();
    const P = this.places[e.side];
    if (e.why === 'dozing') this.stage.float(P.x, P.y - 20, label('floatDoze'), VIOLET);
    if (e.why === 'stunned') this.stage.float(P.x, P.y - 22, label('floatStunned'), '#ffe27a');
    this.tail = 900;
  },

  async foeAction(e) {
    await this.settle();
    const X = this.stageApi('foe', 'me');
    const element = this.view.foe.el;
    if (e.action === 'charge') await charge(X, element);
    else if (e.action === 'guard') await guard(X, element);
    else if (e.action === 'hex') await hex(X);
    else if (e.action === 'heal') {
      X.b = X.a;
      await heal(X, ELEMENT_COLORS[element]);
    }
    this.tail = 500;
  },

  async faint(e) {
    await this.settle();
    const stage = this.stage;
    if (e.target === 'me') {
      this.view.me.fx.alpha = 1;
      this.refresh();
      this.tail = 900;
      return;
    }
    const P = this.places.foe;
    const more = !!this.peek() && this.peek().type === 'nextFoe';
    if (!more) this.game.sound.play('wand');
    this.message.say('');
    this.refresh();
    for (let i = 0; i < (more ? 4 : 6); i++) {
      stage.burst(P.x, P.y, '#fff2a8', more ? 10 : 12, 1);
      await stage.wait(more ? 100 : 110);
    }
    this.view.foe.fx.alpha = more ? 0 : 0.6;
    await stage.wait(more ? 300 : 500);
  },

  nextFoe(e) {
    const foe = this.view.foe;
    const P = this.places.foe;
    fillActor(foe, this.battle.foe);
    foe.hp = foe.max;
    this.view.intent = 'strike';
    this.setTeamOut(e.defeated);
    sayNext(this);
    this.game.sound.play('spell');
    foe.fx.alpha = 1;
    this.stage.burst(P.x, P.y, ELEMENT_COLORS[foe.el] || '#ffffff', 14, 1);
    this.refresh();
    this.tail = 1100;
  },

  async roundEnd() {
    await this.settle();
    this.advanceTutorial();
    this.refresh();
    await this.stage.wait(300);
  },

  async spell(e) {
    const stage = this.stage;
    const drawn = this.drawn || { cx: stage.width / 2, cy: stage.height * 0.46, size: 30 };
    const { cx, cy } = drawn;
    this.view.mana = e.mana;
    this.game.sound.play('wand');
    this.refresh();
    const unit = stage.unit;
    const gx = Math.max(30, Math.min(this.cssWidth - 30, cx * unit));
    const gy = Math.max(20, (cy - Math.max(12, drawn.size * 0.62) - 6) * unit);
    showGrade(this.root, GRADES[e.grade].name, GRADE_COLORS[e.grade], gx, gy);
    sayNext(this);
    if (e.masteryUp) stage.after(500, () => stage.float(cx, cy - 4, label('floatMastery', { n: e.mastery }), '#ffd98a', true));
    this.refreshSpell(e.kind);
    this.tipOnce('grade', 900);
    const P = this.places[e.target];
    await castSigil(this, e.kind, e.target, drawn);
    if (e.kind === 'mend') {
      for (let i = 0; i < 3; i++) stage.after(i * 120, () => stage.burst(P.x, P.y + 4, GREEN, 10, 0.8));
    } else if (e.kind === 'stun') stage.flash('#fff8c0', 0.4);
    else if (e.kind === 'revive') {
      stage.flash('#fff6e0', 0.6);
      for (let i = 0; i < 5; i++) {
        stage.burst(P.x, P.y, i % 2 ? '#ffb060' : '#fff2a8', 14, 1.2);
        await stage.wait(100);
      }
    }
    this.tail = 700;
  },

  async bindTry(e) {
    await wrapFoe(this);
    if (e.success) {
      await intoWand(this);
      this.game.sound.play('wand');
      sayNext(this);
      return;
    }
    sayNext(this);
    if (e.triesLeft > 0) breakFree(this);
    else await slipAway(this);
  },

  item() {
    this.refresh();
  },

  calm() {
    const P = this.places.foe;
    this.game.sound.play('sparkle');
    this.stage.burst(P.x, P.y, '#ffd890', 14, 1);
    sayNext(this);
    if (this.firstTime('bread')) this.message.add(label('tipBread'));
    this.refresh();
  },

  async switch(e) {
    const stage = this.stage;
    const me = this.view.me;
    const P = this.places.me;
    this.game.sound.play('wand');
    this.refresh();
    await stage.run(320, {
      step(k) {
        me.fx.dx = -k * 50;
        me.fx.alpha = 1 - k;
      }
    });
    fillActor(me, this.battle.me);
    if (this.incoming) {
      me.hp = Math.max(0, Math.min(me.max, this.incoming.hp));
      me.sta = Math.max(0, Math.min(me.staMax, this.incoming.sta));
    }
    this.incoming = null;
    me.fx.alpha = 0;
    this.buildMoves();
    this.refresh();
    sayNext(this);
    stage.burst(P.x, P.y, ELEMENT_COLORS[me.el], 18, 1.2);
    await stage.run(320, {
      step(k) {
        me.fx.dx = -(1 - k) * 50;
        me.fx.alpha = k;
      }
    });
    me.fx.dx = 0;
    me.fx.alpha = 1;
    this.tail = e.free ? 300 : 0;
  },

  async escape(e) {
    const stage = this.stage;
    sayNext(this);
    if (!e.success) {
      this.game.sound.play('bump');
      this.tail = 500;
      return;
    }
    const P = this.places.me;
    const me = this.view.me;
    this.game.sound.play('sparkle');
    this.closeTrays();
    for (let i = 0; i < 10; i++) {
      stage.particle({ x: P.x + 6, y: P.gy - Math.random() * 10, vx: 1 + Math.random(), vy: -Math.random() * 0.4, l: 1, d: 0.04, c: '#dfe6ff', s: 1.5 });
    }
    await stage.run(450, {
      step(k) {
        me.fx.dx = -k * k * (P.x + 30);
        me.fx.alpha = 1 - k * 0.5;
      }
    });
  },

  refused(e) {
    if (e.reason === 'repel') repelHand(this);
    if (e.text) this.message.say(e.text);
  },

  async end(e) {
    await this.settle();
    this.refresh();
    if (e.result === 'captured') {
      await this.stage.wait(900);
      const line = this.captureLine(e.report);
      if (line) this.message.say(line);
    }
    await this.finish(e);
  }
};
