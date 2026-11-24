/*
 * WandDuelScene.js  (Hontori game layer)
 * Job: the screen of a wand duel (ring rule wandDuel, game/battle/wandDuel.js): no hontori on the field, the
 * kid and the Warden face each other in the ring of the school. The Warden's sigil for the round glows above
 * her head as a turning magic circle, with a pill that names it (and, while the kid is still learning her
 * order, the sigil that answers it). The kid draws the answer on the picture; the three sigils sit in the move
 * row, and a tap on one shows its tracing guide. Both focus bars are the two cards. A sealed kid gets one wide
 * button to let the turn pass. Same title card, owner strip, end card and pacing as the battle screen.
 *
 * Public API (registry kind "scene", id "wand-duel"; started by startBattle in index.js for a wandDuel setup):
 *   enter({ battle, env, rewards, look })   battle: a WandDuel that has not begun; rewards as for the battle
 *                                           scene; look: the kid's look (default the game's player look)
 *   finished                                a Promise of { result, report, rewards } (see index.js)
 */

import { BattleScene } from '../../systems/battle-scene/BattleScene.js';
import { pathLength } from '../../systems/battle-scene/gesture.js';
import { BattleCard } from '../../ui/BattleCard.js';
import { BattleActionBar } from '../../ui/BattleActionBar.js';
import {
  BattleMessage, BattleIntent, BattleTurn, BattleOwner, BattleEndCard, showRule, showTitleCard, showGrade
} from '../../ui/BattleNotices.js';
import { SPELLS, GRADES, battleRewards } from '../battle/index.js';
import { line } from '../battle/text.js';
import { WAND_SPELLS, ANSWER } from '../battle/wandDuel.js';
import { Arena } from './arena.js';
import { sigils, sigilSvg, drawSigil, RUNES } from './sigils.js';
import { drawGuide } from './spellFx.js';
import { SPELL_COLORS, GRADE_COLORS, END_CARDS, label, ringCrest, rgba } from './look.js';

const UI_HEIGHT = 172;
const TITLE_MS = 5200;
const END_CARD_MS = 600;
const MIN_STROKE = 30;
const LIVE_GUESS = 0.28;
const INK = '#ffe6b0';
const FOE = { x: 0.68, gy: 0.42, sc: 1.6 };
const ME = { x: 0.3, gy: 0.66, sc: 1.9 };
/* how long the lines of one exchange stay before the next turn (they are short) */
const READ_MS = 900;
const MOVE_MS = 520;
const HIT_MS = 520;

const ROLE = { shield: 'wdRoleWard', stun: 'wdRoleSeal', boost: 'wdRoleStrike' };
const WORDS = {
  wdRoleWard: 'Ward', wdRoleSeal: 'Seal', wdRoleStrike: 'Strike',
  wdBeats_shield: 'Stops a Strike', wdBeats_stun: 'Breaks a Ward', wdBeats_boost: 'Breaks a Seal',
  wdFocus: 'Focus', wdYou: 'You', wdWait: 'Let the turn pass', wdWaitNote: 'Your wand is sealed',
  wdSealed: 'Sealed', wdNext: 'Next sigil', wdAnswerWith: 'answer: {spell}', wdLoses: '-{n} focus', wdHeld: 'Held',
  wdYourDraw: 'Your draw', wdTheirs: 'Warden draws'
};
const word = (id, vars) => String(WORDS[id] || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? String(vars[k]) : ''));

function svgUrl(markup) {
  const own = markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(own)}`;
}

/* the pill's small drawing of a sigil (its glyph, in a 30 x 30 box) */
function glyphMarkup(kind) {
  let d = '';
  sigils.glyph(kind).forEach((q, i) => {
    d += `${i ? 'L' : 'M'}${(15 + q[0] * 11).toFixed(1)} ${(15 + q[1] * 11).toFixed(1)}`;
  });
  return `<path d="${d}"/>`;
}

export class WandDuelScene extends BattleScene {
  places = { me: { x: 0, y: 0, gy: 0, sc: ME.sc }, foe: { x: 0, y: 0, gy: 0, sc: FOE.sc } };
  uiTop = 0;
  message = null;
  tail = 0;
  drawn = null;

  #env = { time: 12, weather: 'clear', indoor: true };
  #arena = null;
  #look = 'kid';
  #trainer = null;
  #view = { focus: 0, focusMax: 1, foeFocus: 0, foeFocusMax: 1, foeSigil: null, sealed: false, foeSealed: false, hint: '' };
  #ui = {};
  #guide = { kind: null, t: 0 };
  #flying = { me: null, foe: null };
  #ended = false;
  #outcome = null;
  #ward = { me: 0, foe: 0 };

  handlers = {
    say: async (e) => this.#say(e),
    duelTurn: async (e) => this.#turn(e),
    duelCast: async (e) => this.#cast(e),
    duelClash: async (e) => this.#clash(e),
    focus: async (e) => this.#focus(e),
    roundEnd: async () => this.#roundEnd(),
    end: async (e) => this.#finish(e)
  };

  createBattle(params) {
    if (!params.battle) throw new Error('WandDuelScene: enter needs { battle }');
    this.#env = Object.assign(this.#env, params.env);
    this.#look = params.look || (this.game.config && this.game.config.playerLook) || 'kid';
    return params.battle;
  }

  build(root) {
    const b = this.battle;
    this.#trainer = b.trainer || {};
    const v = this.#view;
    v.focus = b.focus;
    v.focusMax = b.focusMax;
    v.foeFocus = b.foeFocus;
    v.foeFocusMax = b.foeFocusMax;
    const ui = this.#ui;
    ui.intent = new BattleIntent(root);
    ui.foe = new BattleCard(root, 'foe');
    ui.me = new BattleCard(root, 'me');
    this.message = new BattleMessage(root);
    ui.bar = new BattleActionBar(root);
    /* no mana, items, switch or escape in a wand duel: the small row stays away */
    ui.bar.row.hidden = true;
    ui.bar.setMoves(WAND_SPELLS.map((kind) => ({
      name: SPELLS[kind].name, icon: svgUrl(sigilSvg(kind, SPELL_COLORS[kind])), color: SPELL_COLORS[kind],
      kind: word(ROLE[kind]), cost: '', desc: word(`wdBeats_${kind}`)
    })), {
      onPress: (i) => this.#showGuide(WAND_SPELLS[i]),
      onHold: (i) => this.#showGuide(WAND_SPELLS[i])
    });
    ui.bar.wide.setLabel(word('wdWait'));
    ui.bar.wide.setDesc(word('wdWaitNote'));
    ui.bar.wide.element.addEventListener('click', () => this.act((battle) => battle.waitSealed()));
    if (this.surface) this.surface.color = this.#ink();
    this.#buildOwner(root);
    ui.turn = new BattleTurn(root);
    this.message.say('');
    this.refresh();
    const sound = this.game.sound;
    if (sound && typeof sound.battle === 'function') sound.battle('duel');
  }

  layout() {
    const { stage, places } = this;
    const W = stage.width;
    const H = stage.height;
    places.foe.x = Math.round(W * FOE.x);
    places.foe.gy = Math.round(H * FOE.gy);
    places.me.x = Math.round(W * ME.x);
    places.me.gy = Math.round(H * ME.gy);
    for (const p of [places.foe, places.me]) p.y = p.gy - 14 * p.sc;
    this.uiTop = (this.cssHeight - UI_HEIGHT) / stage.unit;
    this.#arena = new Arena(W, H, 'indoor', this.#env, places);
    if (this.#ui.bar) this.#ui.bar.fit(true);
  }

  leaving() {
    if (this.#ui.bar) this.#ui.bar.dispose();
    const sound = this.game.sound;
    if (sound && typeof sound.battle === 'function') sound.battle(null);
  }

  step(dt) {
    if (this.#arena) this.#arena.update(dt);
    if (this.#guide.kind) this.#guide.t += dt;
    for (const k of ['me', 'foe']) if (this.#ward[k] > 0) this.#ward[k] = Math.max(0, this.#ward[k] - dt);
  }

  playing() {
    this.tail = 0;
    this.refresh();
  }

  idle() {
    this.refresh();
  }

  mayDraw() {
    return !this.busy && !this.battle.over && !this.battle.sealed;
  }

  /* ---------- the picture ---------- */

  paintBack(g) {
    if (this.#arena) this.#arena.drawBack(g, this.stage.time);
  }

  paintActors(g) {
    const T = this.stage.time;
    const env = { t: T, time: this.#env.time, indoor: true };
    const art = this.game.art;
    const v = this.#view;
    this.#person(g, art, this.#trainer.key || 'kid', this.places.foe, 0, env, true);
    this.#person(g, art, this.#look, this.places.me, 1, env, false);
    for (const side of ['me', 'foe']) {
      const P = this.places[side];
      const sealed = side === 'me' ? v.sealed : v.foeSealed;
      if (sealed) drawSigil(g, 'stun', P.x, P.gy, 16 * P.sc * 0.7, '#a8a8b8', { rot: T * 0.4, alpha: 0.55, flat: 0.32, simple: true });
      const ward = this.#ward[side];
      if (ward > 0) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = Math.min(1, ward * 2) * 0.5;
        g.strokeStyle = SPELL_COLORS.shield;
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(P.x, P.gy, 18 * P.sc * 0.7, Math.PI, 0);
        g.stroke();
        g.restore();
      }
    }
    /* the Warden's sigil for this round, glowing over her head: the shape the kid answers */
    if (v.foeSigil && !this.#flying.foe && !this.#ended) {
      const P = this.places.foe;
      const pulse = 0.78 + 0.22 * Math.sin(T * 3);
      drawSigil(g, v.foeSigil, P.x, P.gy - 34 * P.sc, 13, SPELL_COLORS[v.foeSigil], { rot: T * 0.8, alpha: pulse, lw: 1 });
    }
    for (const side of ['me', 'foe']) {
      const f = this.#flying[side];
      if (f) drawSigil(g, f.kind, f.x, f.y, f.r, SPELL_COLORS[f.kind], { rot: T * 2, alpha: f.a, lw: 1 });
    }
  }

  paintFront(g) {
    if (this.#arena) this.#arena.drawFront(g, this.stage.time, this.uiTop);
  }

  paintOver(g) {
    const guide = this.#guide;
    if (guide.kind && !this.#ended) {
      g.save();
      drawGuide(g, guide.kind, guide.t, this.stage.width, this.stage.height);
      g.restore();
    }
    this.surface.draw(g, 1);
  }

  inkMarks() {
    return RUNES;
  }

  stageTouched() {}

  strokeGrew(trail, count) {
    if (count % 6 || trail.length <= 10) return;
    const guess = sigils.score(trail, WAND_SPELLS, this.#slack());
    if (guess && guess.guess && guess.distance < LIVE_GUESS) this.surface.color = SPELL_COLORS[guess.guess];
  }

  strokeEnded(trail) {
    const { surface, stage } = this;
    const unit = stage.unit;
    surface.color = this.#ink();
    if (trail.length < 6 || pathLength(trail) < MIN_STROKE / unit) {
      surface.drop();
      return;
    }
    if (this.busy || this.battle.over) {
      surface.ash();
      return;
    }
    const score = sigils.score(trail.map((q) => [q[0] * unit, q[1] * unit]), WAND_SPELLS, this.#slack());
    const kind = score && score.kind;
    if (!kind) {
      this.message.say(line('wdRefuseShape'));
      surface.ash();
      this.game.sound.play('bump');
      return;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const q of trail) {
      minX = Math.min(minX, q[0]);
      maxX = Math.max(maxX, q[0]);
      minY = Math.min(minY, q[1]);
      maxY = Math.max(maxY, q[1]);
    }
    this.#guide.kind = null;
    surface.drop();
    this.drawn = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, size: Math.max(maxX - minX, maxY - minY) };
    this.play(this.battle.castSpell(kind, score.accuracy));
  }

  refresh() {
    const b = this.battle;
    const v = this.#view;
    const ui = this.#ui;
    if (!ui.bar) return;
    const over = this.#ended || b.over;
    const idle = !this.busy && !over;
    const name = this.#trainer.name || label('rival');
    ui.foe.set({
      name, level: '', badges: [], edge: null,
      bars: [{ kind: '', label: word('wdFocus'), value: v.foeFocus, max: v.foeFocusMax, low: v.foeFocus / v.foeFocusMax < 0.3 }],
      tags: v.foeSealed ? [{ text: word('wdSealed'), color: '#ffe27a' }] : []
    });
    ui.me.set({
      name: word('wdYou'), level: '', badges: [], edge: null,
      bars: [{ kind: '', label: word('wdFocus'), value: v.focus, max: v.focusMax, low: v.focus / v.focusMax < 0.3 }],
      tags: v.sealed ? [{ text: word('wdSealed'), color: '#ffe27a' }] : []
    });
    const sealed = !over && v.sealed;
    ui.bar.showWide(sealed);
    ui.bar.wide.off = !idle;
    WAND_SPELLS.forEach((kind, i) => {
      ui.bar.updateMove(i, { off: !idle || v.sealed, cover: null, hot: idle && !v.sealed && v.hint && v.foeSigil && ANSWER[v.foeSigil] === kind && this.#teaching() });
    });
    if (over) ui.intent.hide();
    else if (v.foeSigil) {
      const answer = ANSWER[v.foeSigil];
      ui.intent.set({
        drawing: glyphMarkup(v.foeSigil), word: word(ROLE[v.foeSigil]),
        note: this.#teaching() ? word('wdAnswerWith', { spell: SPELLS[answer].name }) : word('wdNext'),
        color: SPELL_COLORS[v.foeSigil], pulse: idle
      });
    } else {
      ui.intent.set({ drawing: glyphMarkup('stun'), word: word('wdSealed'), note: '', color: '#a8a8b8', pulse: false });
    }
    ui.turn.set(over ? '' : idle ? (v.sealed ? word('wdSealed') : word('wdYourDraw')) : '', idle);
    ui.bar.fit();
  }

  /* ---------- the events ---------- */

  async #say(e) {
    await this.#settle();
    this.message.say(e.text);
    this.tail = READ_MS;
  }

  async #turn(e) {
    await this.#settle();
    const v = this.#view;
    v.foeSigil = e.foeSigil;
    v.sealed = !!e.sealed;
    v.foeSealed = !!e.foeSealed;
    v.hint = e.hint;
    this.message.say(e.hintText);
    if (e.foeSigil) this.game.sound.play('blip');
    this.refresh();
  }

  async #cast(e) {
    const stage = this.stage;
    if (e.side === 'me') {
      const d = this.drawn || { cx: this.places.me.x, cy: this.places.me.y - 30, size: 30 };
      this.#flying.me = { kind: e.kind, x: d.cx, y: d.cy, r: Math.max(10, d.size * 0.5), a: 1 };
      this.drawn = null;
      const G = GRADES[e.grade];
      if (G) {
        const unit = stage.unit;
        showGrade(this.root, G.name, GRADE_COLORS[e.grade], d.cx * unit, d.cy * unit);
      }
      if (e.masteryUp) stage.float(this.places.me.x, this.places.me.y - 20, label('floatMastery', { n: e.mastery }), '#ffd98a');
      this.game.sound.play('spell');
      await stage.wait(260);
    } else {
      const P = this.places.foe;
      this.#flying.foe = { kind: e.kind, x: P.x, y: P.gy - 34 * P.sc, r: 13, a: 1 };
    }
  }

  async #clash(e) {
    const stage = this.stage;
    const W = stage.width;
    const H = stage.height;
    const mid = { x: W * 0.5, y: H * 0.42 };
    const from = {};
    for (const side of ['me', 'foe']) {
      const f = this.#flying[side];
      if (f) from[side] = { x: f.x, y: f.y, r: f.r };
    }
    await stage.tween(MOVE_MS, (k) => {
      const ease = k * k * (3 - 2 * k);
      for (const side of ['me', 'foe']) {
        const f = this.#flying[side];
        const o = from[side];
        if (!f || !o) continue;
        f.x = o.x + (mid.x - o.x) * ease;
        f.y = o.y + (mid.y - o.y) * ease;
        f.r = o.r + (10 - o.r) * ease;
      }
    });
    const colors = [e.mine, e.theirs].filter(Boolean).map((k) => SPELL_COLORS[k]);
    if (colors.length) {
      stage.burst(mid.x, mid.y, colors[0], 18, 1.2);
      if (colors[1]) stage.burst(mid.x, mid.y, colors[1], 18, 1.2);
      stage.flash('#ffffff', 0.18);
      this.game.sound.play('hit');
    }
    this.#flying.me = null;
    this.#flying.foe = null;
    for (const side of ['me', 'foe']) {
      const r = e[side];
      const P = this.places[side];
      if (r.blocked) {
        this.#ward[side] = 0.9;
        stage.float(P.x, P.y - 10, word('wdHeld'), SPELL_COLORS.shield);
      }
      if (r.broke) stage.burst(P.x, P.gy - 10, SPELL_COLORS.shield, 14, 1);
      if (r.sealed) {
        stage.burst(P.x, P.y, SPELL_COLORS.stun, 16, 1);
        stage.float(P.x, P.y - 18, label('floatStunned'), SPELL_COLORS.stun);
      }
    }
    await stage.wait(200);
  }

  async #focus(e) {
    const v = this.#view;
    const P = this.places[e.target];
    if (e.target === 'me') v.focus = e.focus;
    else v.foeFocus = e.focus;
    const stage = this.stage;
    const color = SPELL_COLORS.boost;
    stage.fx(HIT_MS, (g, k) => {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 1 - k;
      g.fillStyle = rgba(color, 0.6);
      g.beginPath();
      g.arc(P.x, P.y, 6 + 18 * k, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });
    stage.float(P.x, P.y - 16, word('wdLoses', { n: e.amount }), '#ff9a7a', true);
    stage.shake(e.target === 'me' ? 3 : 2);
    this.refresh();
    await stage.wait(HIT_MS);
  }

  async #roundEnd() {
    await this.#settle();
  }

  async #settle() {
    if (!this.tail) return;
    const ms = this.tail;
    this.tail = 0;
    this.refresh();
    await this.stage.wait(ms);
  }

  async #finish(e) {
    if (this.#ended) return;
    await this.#settle();
    this.#ended = true;
    const report = e.report;
    this.#outcome = { result: e.result, report, rewards: this.#rewards(report) };
    this.#guide.kind = null;
    const ui = this.#ui;
    this.refresh();
    ui.bar.finish();
    const school = this.#trainer.school;
    const kind = report.won ? (school ? 'ring' : 'duelWon') : 'duelLost';
    const card = END_CARDS[kind];
    await this.stage.wait(END_CARD_MS);
    ui.end = new BattleEndCard(this.root, {
      kicker: card.kicker, label: label('continue'), color: (kind === 'ring' && school.col) || card.color,
      icon: this.#icon('back'), onPress: () => this.close(this.#outcome)
    });
  }

  /* ---------- private ---------- */

  /* the first time round her order, and after a wrong answer, the pill names the answer */
  #teaching() {
    const h = this.#view.hint || '';
    return h.indexOf('wdHint_') === 0;
  }

  #person(g, art, look, P, dir, env, npc) {
    g.save();
    try {
      if (typeof art.drawShadow === 'function') art.drawShadow(g, P.x, P.gy, 7 * P.sc, 2.5 * P.sc, env);
      g.translate(P.x, P.gy);
      g.scale(P.sc, P.sc);
      art.drawPerson(g, look, 0, 0, dir, 0, env, npc ? { npc: true, seed: 0.3 } : undefined);
    } catch (error) {
      /* a missing look draws nothing; the duel goes on */
    }
    g.restore();
  }

  #slack() {
    const slack = {};
    for (const k of WAND_SPELLS) slack[k] = this.battle.tolerance(k);
    return slack;
  }

  #showGuide(kind) {
    if (this.busy || this.battle.over) return;
    this.#guide.kind = kind;
    this.#guide.t = 0;
    this.message.say(`${SPELLS[kind].name}: ${word(`wdBeats_${kind}`)}.`);
    this.game.sound.play('blip');
  }

  #icon(name) {
    try {
      return this.game.art.iconUrl(name) || '';
    } catch (error) {
      return '';
    }
  }

  #ink() {
    try {
      const capsules = this.game.registry.get('service', 'capsules');
      const colour = capsules && typeof capsules.inkColor === 'function' ? capsules.inkColor() : null;
      return typeof colour === 'string' && colour ? colour : INK;
    } catch (error) {
      return INK;
    }
  }

  #rewards(report) {
    const given = this.params.rewards;
    const context = Object.assign({ partySize: 0, coins: 0 }, typeof given === 'function' ? given(report) : given);
    try {
      return battleRewards(report, context);
    } catch (error) {
      console.error('WandDuelScene: rewards failed', error);
      return { exp: [], wandExp: 0, money: null };
    }
  }

  #buildOwner(root) {
    const tr = this.#trainer;
    let portrait = null;
    try {
      portrait = this.game.art.portrait('person', tr.key || 'kid');
    } catch (error) {
      portrait = null;
    }
    const name = tr.name || label('rival');
    const school = tr.school;
    this.#ui.owner = new BattleOwner(root, { portrait, label: school ? label('ownerRing', { name }) : name, team: 0 });
    if (!school) return;
    root.classList.add('framed');
    root.style.setProperty('--sc', school.col || '#ffd98a');
    if (school.rule) showRule(root, label('rule', { rule: school.rule }));
    const card = showTitleCard(root, {
      crest: ringCrest(school.col), kicker: label('ringDuel'), title: school.name, name, rule: school.rule,
      hint: label('tapToBegin')
    });
    this.stage.after(TITLE_MS, card.hide);
    this.game.sound.play('spell');
  }
}
