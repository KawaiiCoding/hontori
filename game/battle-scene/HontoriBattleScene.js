/*
 * HontoriBattleScene.js  (Hontori game layer)
 * Job: Hontori's battle screen, as in the current game: the arena of the place and hour, the two hontori (and
 * the trainer behind theirs), the foe's intent, both cards, mana orbs, the Spells sheet with its tracing guide,
 * the move buttons, Switch and Escape, sigils drawn on the arena, and the cards that open and close a battle.
 * It asks game/battle for every rule and only shows the answers (battleEvents.js).
 *
 * Public API (registry kind "scene", id "battle"; start one with startBattle in index.js):
 *   enter({ battle, env, biome, species, tutorial, joinsParty, rewards })
 *       battle      a HontoriBattle that has not begun
 *       env         { time, weather, indoor } of the place
 *       biome       'meadow' | 'forest' | 'river' | 'indoor' (default: indoor when env.indoor, else meadow)
 *       species     (key) => { element, element2, name }
 *       tutorial    the player's first wild battle: the moves, then the Spells button, then the intent glow
 *       joinsParty  true when a bound hontori joins the party, false when it rests in the wand (the closing line)
 *       rewards     { partySize, coins, pursePaid } for game/battle battleRewards, or (report) => that
 *       music       optional: the tune for this battle (a song key or 'duel'), else duel or wild
 *   finished        a Promise of { result, report, rewards } (see index.js)
 *
 * For battleEvents.js and spellFx.js (the scene's working parts):
 *   view            what is shown now: { me, foe (actors, see fighters.js), mana, maxMana, intent, next (the Lantern
 *                   Sigil's next turn), quick };  sides: { ally, foe2 } of a double battle (sides.js)
 *   places          { me, foe }: { x, y (body centre), gy (ground), sc } in art pixels;  uiTop: where the interface begins
 *   message, tail, forced, drawn, incoming
 *   sealSpell(kind), refresh(), settle(), stageApi(from, to), buildMoves(), refreshSpell(kind), openParty(forced), closeTrays(),
 *   showMatchup(event), setTeamOut(count), advanceTutorial(), tipOnce(id, afterMs), firstTime(id),
 *   captureLine(report), finish(endEvent)
 */

import { BattleScene } from '../../systems/battle-scene/BattleScene.js';
import { pathLength } from '../../systems/battle-scene/gesture.js';
import { BattleCard, badge, edgeMark } from '../../ui/BattleCard.js';
import { BattleActionBar } from '../../ui/BattleActionBar.js';
import { BattleTray } from '../../ui/BattleTray.js';
import {
  BattleMessage, BattleIntent, BattleTurn, BattleOwner, BattleEndCard, showBanner, showRule, showTitleCard
} from '../../ui/BattleNotices.js';
import { matrix, battleRewards, line, SPELLS, BATTLE_SPELLS } from '../battle/index.js';
import { Arena } from './arena.js';
import { handlers } from './battleEvents.js';
import { sideHandlers, newSides, placeSides, paintSides, trainerX } from './sides.js';
import { newActor, fillActor, settle, drawFighter } from './fighters.js';
import { sigils, sigilSvg, RUNES } from './sigils.js';
import { drawGuide } from './spellFx.js';
import {
  ELEMENT_COLORS, SPELL_COLORS, SPELL_NOTES, INTENTS, STATUS_TAGS, END_CARDS, BREATH_GAIN, label, elementBadge, edgeOf, ringCrest
} from './look.js';

/* the save section of this screen: the tracing guide and the tips that are told once */
export const BATTLE_SCENE_SAVE = { guideOff: false, told: {} };

const TICK = 1 / 30;
const UI_HEIGHT = 172;
const TITLE_MS = 5200;
const END_CARD_MS = 600;
const MIN_STROKE = 30;
const LIVE_GUESS = 0.28;
/* the wand's own ink, when no capsule ink is chosen */
const INK = '#ffe6b0';
const FOE = { x: 0.68, gy: 0.4, sc: 1.45 };
const ME = { x: 0.3, gy: 0.655, sc: 1.8 };
const STRIP_ENV = { t: 0, time: 12, weather: 'clear' };

export class HontoriBattleScene extends BattleScene {
  handlers = { ...handlers, ...sideHandlers };
  view = { me: newActor('me'), foe: newActor('foe'), mana: 0, maxMana: 0, intent: 'strike', next: null, quick: false };
  sides = null;
  places = { me: { x: 0, y: 0, gy: 0, sc: ME.sc }, foe: { x: 0, y: 0, gy: 0, sc: FOE.sc } };
  uiTop = 0;
  tail = 0;
  forced = false;
  drawn = null;
  incoming = null;
  message = null;

  #env = { time: 12, weather: 'clear', indoor: false };
  #biome = 'meadow';
  #arena = null;
  #tide = -1;
  #trainer = null;
  #species = null;
  #saved = null;
  #ui = {};
  #chips = {};
  #castable = [];
  #guide = { kind: null, t: 0 };
  #tutorial = -1;
  #escapeArmed = false;
  #ended = false;
  #outcome = null;
  #sealed = null;

  /* ---------- the scene ---------- */

  createBattle(params) {
    if (!params.battle) throw new Error('HontoriBattleScene: enter needs { battle }');
    this.#env = Object.assign(this.#env, params.env);
    this.#biome = params.biome || (this.#env.indoor ? 'indoor' : 'meadow');
    this.#species = params.species || (() => null);
    this.#tutorial = params.tutorial ? 0 : -1;
    const saved = this.game.save.state && this.game.save.state.battleScene;
    this.#saved = saved || { guideOff: false, told: {} };
    /* a double battle's extra hontori, known before the first layout places them */
    this.sides = newSides(params.battle);
    return params.battle;
  }

  build(root) {
    const b = this.battle;
    const { art } = this.game;
    const v = this.view;
    this.#trainer = b.trainer;
    fillActor(v.me, b.me);
    fillActor(v.foe, b.foe);
    v.mana = b.mana;
    v.maxMana = b.maxMana;
    this.#castable = BATTLE_SPELLS.filter((k) => b.loadout.includes(k));

    const ui = this.#ui;
    ui.intent = new BattleIntent(root);
    ui.foe = new BattleCard(root, 'foe');
    ui.me = new BattleCard(root, 'me');
    this.message = new BattleMessage(root);
    ui.spells = new BattleTray(root, { room: true });
    ui.bar = new BattleActionBar(root);
    ui.party = new BattleTray(root, { strip: true, room: true });
    /* every button of the row has a picture, so a crowded row can drop its words and still fit */
    ui.spellsButton = ui.bar.addButton({ label: label('spells'), picture: this.#icon('book'), onPress: () => this.#pressSpells() });
    ui.herb = ui.bar.addButton({ label: '', picture: this.#itemIcon('herb', 'sprout'), onPress: () => this.act((battle) => battle.useItem('herb')) });
    ui.bread = ui.bar.addButton({ label: label('bread'), picture: this.#itemIcon('bread', 'energy'), onPress: () => this.act((battle) => battle.useItem('bread')) });
    /* a thing that mends the hontori on the field (an earth treat): shown while one is carried */
    const treat = b.treat;
    ui.treat = ui.bar.addButton({
      label: '', picture: this.#itemIcon(treat ? treat.id : 'herb', 'heart'),
      onPress: () => this.act((battle) => (battle.treat ? battle.useItem(battle.treat.id) : []))
    });
    ui.bar.addGap();
    ui.switch = ui.bar.addButton({ label: label('switch'), picture: this.#icon('swap'), onPress: () => this.#pressSwitch() });
    ui.escape = ui.bar.addButton({ label: label('escape'), picture: this.#icon('run'), odds: true, onPress: () => this.#pressEscape() });
    ui.bar.wide.setLabel(label('breath'));
    ui.bar.wide.setPicture(this.#icon('breath'));
    if (this.surface) this.surface.color = this.#ink();
    ui.bar.wide.element.addEventListener('click', () => this.act((battle) => battle.catchBreath()));
    this.#buildSpells();
    this.buildMoves();
    this.#buildOwner(root);
    ui.turn = new BattleTurn(root);
    this.message.say('');
    this.refresh();
    const sound = this.game.sound;
    /* a battle may name its own tune (a tournament round); else the duel or wild tune of the place */
    if (typeof sound.battle === 'function') sound.battle(this.params.music || (this.#trainer ? 'duel' : 'wild'));
  }

  layout() {
    const { stage, places } = this;
    const W = stage.width;
    const H = stage.height;
    places.foe.x = Math.round(W * FOE.x);
    places.foe.gy = Math.round(H * FOE.gy);
    places.me.x = Math.round(W * ME.x);
    places.me.gy = Math.round(H * ME.gy);
    for (const p of [places.foe, places.me]) p.y = p.gy - 10 * p.sc - 2;
    placeSides(this);
    this.uiTop = (this.cssHeight - UI_HEIGHT) / stage.unit;
    this.#arena = new Arena(W, H, this.#biome, this.#env, places);
    if (this.#tide >= 0) this.#arena.setTide(this.#tide);
    if (this.#ui.bar) this.#ui.bar.fit(true);
  }

  /* the ring rule of a flooded hall: how high the sea stands in the ring (battleEvents.js "tide") */
  setTide(level, max) {
    this.#tide = max > 0 ? Math.max(0, Math.min(1, level / max)) : 0;
    if (this.#arena) this.#arena.setTide(this.#tide);
  }

  leaving() {
    if (this.#ui.bar) this.#ui.bar.dispose();
    const sound = this.game.sound;
    if (typeof sound.battle === 'function') sound.battle(null);
  }

  step(dt) {
    if (this.#arena) this.#arena.update(dt);
    if (this.#guide.kind) this.#guide.t += dt;
  }

  tick() {
    settle(this.view.me, TICK);
    settle(this.view.foe, TICK);
  }

  playing() {
    this.tail = 0;
    this.#ui.party.close();
    this.#ui.spellsButton.hot = false;
    if (this.#chips.mend) this.#chips.mend.state('hot', false);
    this.refresh();
  }

  idle() {
    this.tail = 0;
    this.refresh();
    if (this.#tutorial === 1 && !this.battle.over) {
      this.#ui.spellsButton.hot = true;
      if (this.#chips.mend) this.#chips.mend.state('hot', true);
    }
  }

  /* ---------- the picture ---------- */

  paintBack(g) {
    if (!this.#arena) return;
    const T = this.stage.time;
    this.#arena.drawBack(g, T);
    const tr = this.#trainer;
    if (!tr) return;
    const P = this.places.foe;
    this.game.art.drawPerson(g, tr.key || 'kid', trainerX(this), P.gy - 4 - (this.sides && this.sides.foe2 ? 6 : 0), 0, 0, { t: T, time: this.#env.time }, { npc: true, seed: 0.3 });
  }

  paintActors(g) {
    const { art } = this.game;
    const T = this.stage.time;
    paintSides(g, this, T, this.#env);
    drawFighter(g, art, this.view.foe, this.places.foe, T, this.#env, false);
    drawFighter(g, art, this.view.me, this.places.me, T, this.#env, true);
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

  /* ---------- sigils ---------- */

  inkMarks() {
    return RUNES;
  }

  stageTouched() {
    this.#ui.spells.close();
    if (!this.forced) this.#ui.party.close();
  }

  strokeGrew(trail, count) {
    if (count % 6 || trail.length <= 10) return;
    const guess = sigils.score(trail, this.#castable, this.#slack());
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
    const score = sigils.score(trail.map((q) => [q[0] * unit, q[1] * unit]), this.#castable, this.#slack());
    const kind = score && score.kind;
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
    if (!kind) {
      this.message.say(line('refuseShape'));
      surface.ash();
      this.game.sound.play('bump');
      return;
    }
    const events = this.battle.castSpell(kind, score.accuracy);
    const refused = events[0] && events[0].type === 'refused' ? events[0] : null;
    if (events[0] && events[0].type === 'fizzle') surface.ash();
    else if (refused) {
      surface.ash();
      if (refused.reason !== 'repel') this.game.sound.play('bump');
    } else {
      surface.drop();
      this.drawn = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, size: Math.max(maxX - minX, maxY - minY) };
    }
    this.play(events);
  }

  /* ---------- for the event handlers ---------- */

  async settle() {
    if (!this.tail) return;
    const ms = this.tail;
    this.tail = 0;
    this.refresh();
    await this.stage.wait(ms);
  }

  stageApi(from, to) {
    const { stage, places } = this;
    const A = places[from];
    const B = places[to];
    const fa = this.view[from].fx;
    const fb = this.view[to].fx;
    return {
      a: { x: A.x + fa.dx, y: A.y, gy: A.gy, sc: A.sc },
      b: { x: B.x, y: B.y, gy: B.gy, sc: B.sc },
      foe: { x: places.foe.x, y: places.foe.y, gy: places.foe.gy },
      W: stage.width,
      Hh: stage.height,
      P: (o) => stage.particle(o),
      fx: (ms, draw, back) => stage.fx(ms, draw, back),
      tween: (ms, step, draw) => stage.tween(ms, step, draw),
      flash: (color, alpha) => stage.flash(color, alpha),
      dim: (alpha, ms) => stage.dim(alpha, ms),
      shake: (amount) => stage.shake(amount),
      wait: (ms) => stage.wait(ms),
      lunge(frac, ms) {
        const dx = (B.x - A.x) * frac;
        const dy = (B.y - A.y) * frac;
        stage.run(ms, {
          step(k) {
            const s = Math.sin(k * Math.PI);
            fa.dx = dx * s;
            fa.dy = dy * s;
          }
        });
      },
      lift(pixels, ms) {
        stage.run(ms, {
          step(k) {
            fb.lift = -pixels * Math.sin(k * Math.PI);
          }
        });
      },
      fade(alpha, ms) {
        stage.run(ms, {
          step(k) {
            fa.alpha = 1 - (1 - alpha) * Math.sin(k * Math.PI);
          }
        });
      }
    };
  }

  refresh() {
    const b = this.battle;
    const v = this.view;
    const ui = this.#ui;
    const over = this.#ended;
    const idle = !this.busy && !b.over;
    const attack = matrix(v.me.el, v.foe.el, v.foe.el2);
    const defend = matrix(v.foe.el, v.me.el, v.me.el2);
    ui.foe.set(this.#card(v.foe, false, edgeOf(attack, defend)));
    ui.me.set(this.#card(v.me, true, null));
    ui.bar.setPips(label('mana'), v.mana, v.maxMana);
    const herbs = b.herbs;
    ui.herb.hidden = !herbs || v.mana >= v.maxMana;
    ui.herb.setLabel(label('herb', { n: herbs }));
    ui.herb.setCount(herbs);
    ui.bread.hidden = !b.breadReady;
    const treat = b.treat;
    ui.treat.hidden = !treat;
    if (treat) {
      ui.treat.setLabel(label('treat', { n: treat.n }));
      ui.treat.setCount(treat.n);
      ui.treat.off = !idle || v.me.hp <= 0 || v.me.hp >= v.me.max;
    }
    ui.switch.hidden = !b.canSwitch();
    ui.bar.fit();
    const out = v.me.hp <= 0;
    b.moves.forEach((m, i) => {
      const rest = b.cooldown(i);
      const cover = rest > 0 ? label('rest', { n: rest }) : out ? label('fainted') : v.me.status.asleep ? label('asleep') : null;
      ui.bar.updateMove(i, {
        off: rest > 0 || out || !idle || v.me.sta < b.moveCost(i), cover,
        edge: m.pow && attack !== 1 ? (attack > 1 ? 'up' : 'down') : null,
        hot: idle && this.#tutorial === 0
      });
    });
    /* out of stamina for every move: Catch breath takes the place of the moves (it covers nothing) */
    const tired = !over && b.canCatchBreath();
    ui.bar.showWide(tired);
    if (tired) ui.bar.wide.setDesc(label('breathGain', { n: Math.max(0, Math.min(BREATH_GAIN, v.me.staMax - v.me.sta)) }));
    ui.bar.wide.off = !idle;
    for (const k of this.#castable) this.#chips[k].state('no', b.canCast(k) !== true);
    ui.switch.off = !idle || !b.switchTargets().length;
    ui.escape.off = !!this.#trainer || !idle;
    ui.escape.setOdds(this.#trainer ? 0 : b.escapeBars());
    if (over) ui.intent.hide();
    else {
      const key = v.foe.status.stun ? 'stunned' : v.foe.status.asleep ? 'asleep' : v.intent;
      const it = INTENTS[key] || INTENTS.strike;
      const first = v.quick && key !== 'stunned' && key !== 'asleep' && key !== 'hidden' ? label('movesFirst') : '';
      /* the Lantern Sigil shows the next turn too */
      const then = v.next && INTENTS[v.next] ? label('thenIntent', { word: INTENTS[v.next].word }) : '';
      ui.intent.set({
        drawing: it.drawing, word: it.word, note: it.note + first + then, color: it.color,
        pulse: this.#tutorial === 2 || key === 'unleash' || key === 'charge'
      });
    }
    ui.turn.set(over ? '' : label(idle ? 'yourTurn' : 'enemyTurn'), idle);
  }

  buildMoves() {
    const me = this.view.me;
    const moves = this.battle.moves.map((m, i) => ({
      name: m.name, icon: this.#icon(m.el || me.el), color: ELEMENT_COLORS[me.el],
      kind: label(m.pow ? 'attack' : 'support'), cost: label('cost', { n: this.battle.moveCost(i) }),
      desc: (m.pow ? label('power', { n: m.pow }) : '') + m.desc.replace(/ Rests 2 turns\./, '')
    }));
    this.#ui.bar.setMoves(moves, {
      onPress: (i) => this.act((battle) => battle.useMove(i)),
      onHold: (i) => {
        const m = this.battle.moves[i];
        if (m) this.message.say(label('moveInfo', { name: m.name, desc: m.desc }));
      }
    });
  }

  refreshSpell(kind) {
    const chip = this.#chips[kind];
    if (chip) chip.set(this.#chip(kind));
  }

  openParty(forced) {
    const b = this.battle;
    const ui = this.#ui;
    const side = b.side('me');
    const art = this.game.art;
    this.forced = !!forced;
    ui.spells.close();
    ui.party.clear();
    side.members.forEach((m, i) => {
      const sp = this.#species(m.key) || {};
      const current = i === side.active;
      const max = m.maxHp || 20;
      const hp = current ? this.view.me.hp : m.hp == null ? max : m.hp;
      ui.party.addMember({
        name: m.nick || sp.name || m.key, value: hp, max, color: ELEMENT_COLORS[sp.element] || '#fff',
        state: current ? 'cur' : hp <= 0 ? 'out' : '',
        paint: (ctx) => art.drawCreature(ctx, m.key, 20, 26, STRIP_ENV, { scale: 1.3, stage: m.stage, sit: hp <= 0, noShadow: true }),
        onPress: () => this.#switchTo(i)
      });
    });
    ui.party.open();
    if (!forced && this.firstTime('switch')) this.message.say(label('tipSwitch'));
  }

  closeTrays() {
    this.#ui.spells.close();
    this.#ui.party.close();
  }

  showMatchup(e) {
    const { art } = this.game;
    const v = this.view;
    showBanner(this.root, [badge(elementBadge(art, v.me.el)), edgeMark(edgeOf(e.attack, e.defend), 34), badge(elementBadge(art, v.foe.el))]);
  }

  setTeamOut(count) {
    if (this.#ui.owner) this.#ui.owner.setOut(count);
  }

  advanceTutorial() {
    const t = this.#tutorial;
    if (t < 0) return;
    this.#tutorial = t === 0 ? (this.battle.loadout.includes('mend') ? 1 : 2) : t === 1 ? 2 : -1;
  }

  firstTime(id) {
    const told = this.#saved.told;
    if (told[id]) return false;
    told[id] = true;
    this.#commit();
    return true;
  }

  tipOnce(id, afterMs) {
    if (!this.firstTime(id)) return;
    const text = label(`tip${id.charAt(0).toUpperCase()}${id.slice(1)}`);
    this.stage.after(afterMs, () => {
      if (!this.battle.over) this.message.say(text);
    });
  }

  captureLine() {
    const joins = this.params.joinsParty;
    return joins == null ? '' : label(joins ? 'joins' : 'rests');
  }

  async finish(e) {
    if (this.#ended) return;
    this.#ended = true;
    const report = e.report;
    const ui = this.#ui;
    this.#outcome = { result: e.result, report, rewards: this.#rewards(report) };
    this.closeTrays();
    this.#guide.kind = null;
    this.refresh();
    if (e.result === 'fled') {
      await this.stage.wait(250);
      this.close(this.#outcome);
      return;
    }
    ui.bar.finish();
    const school = this.#trainer && this.#trainer.school;
    const kind = report.captured ? 'captured'
      : report.won ? (school ? 'ring' : this.#trainer ? 'duelWon' : 'won')
        : report.fled ? 'fled' : this.#trainer ? 'duelLost' : 'lost';
    const card = END_CARDS[kind];
    await this.stage.wait(END_CARD_MS);
    ui.end = new BattleEndCard(this.root, {
      kicker: card.kicker, label: label('continue'), color: (kind === 'ring' && school.col) || card.color,
      icon: this.#icon('back'), onPress: () => this.close(this.#outcome)
    });
  }

  /* ---------- private ---------- */

  #icon(name) {
    try {
      return this.game.art.iconUrl(name) || '';
    } catch (error) {
      return '';
    }
  }

  /* the wand's ink: the colour chosen in the Capsule Album, else the warm white of the wand */
  #ink() {
    try {
      const capsules = this.game.registry.get('service', 'capsules');
      const colour = capsules && typeof capsules.inkColor === 'function' ? capsules.inkColor() : null;
      return typeof colour === 'string' && colour ? colour : INK;
    } catch (error) {
      return INK;
    }
  }

  /* the pixel icon that looks like the item, else a named icon */
  #itemIcon(id, fallback) {
    try {
      const art = this.game.art;
      return (typeof art.itemIconUrl === 'function' && art.itemIconUrl(id)) || this.#icon(fallback);
    } catch (error) {
      return this.#icon(fallback);
    }
  }

  #slack() {
    const slack = {};
    for (const k of this.#castable) slack[k] = this.battle.tolerance(k);
    return slack;
  }

  #commit() {
    try {
      if (this.game.save.state && this.game.save.state.battleScene) this.game.save.commit();
    } catch (error) {
      console.error('HontoriBattleScene: saving failed', error);
    }
  }

  #rewards(report) {
    const given = this.params.rewards;
    const members = this.battle.side('me').members.length;
    const context = Object.assign(
      { partySize: members + (report.captured && this.params.joinsParty ? 1 : 0), coins: 0 },
      typeof given === 'function' ? given(report) : given
    );
    try {
      return battleRewards(report, context);
    } catch (error) {
      console.error('HontoriBattleScene: rewards failed', error);
      return { exp: [], wandExp: 0, money: null };
    }
  }

  #card(actor, mine, edge) {
    const { art } = this.game;
    const bars = [{ kind: '', label: label('hp'), value: actor.hp, max: actor.max, low: actor.hp / actor.max < 0.3 }];
    if (mine) bars.push({ kind: 'sta', thin: true, label: label('stamina'), value: actor.sta, max: actor.staMax });
    const badges = [elementBadge(art, actor.el)];
    if (actor.el2) badges.push(elementBadge(art, actor.el2));
    const tags = [];
    for (const k of Object.keys(STATUS_TAGS)) if (actor.status[k]) tags.push({ text: STATUS_TAGS[k][0], color: STATUS_TAGS[k][1] });
    if (mine && actor.hp <= 0) tags.push({ text: label('fainted'), color: '#ff8a7a' });
    return { name: actor.name, level: label('level', { n: actor.level }), bars, badges, edge, tags };
  }

  /* rule blind: this spell's slot is sealed for the duel */
  sealSpell(kind) {
    this.#sealed = kind;
    this.refreshSpell(kind);
  }

  #chip(kind) {
    return {
      picture: sigilSvg(kind, SPELL_COLORS[kind]), name: SPELLS[kind].name, note: kind === this.#sealed ? label('sealed') : SPELL_NOTES[kind] || '',
      cost: this.battle.spellCost(kind), level: this.battle.mastery(kind), levels: 5
    };
  }

  #buildSpells() {
    const tray = this.#ui.spells;
    for (const kind of this.#castable) {
      this.#chips[kind] = tray.addChip(Object.assign(this.#chip(kind), { onPress: () => this.#showGuide(kind) }));
    }
    const saved = this.#saved;
    const guide = () => ({ dot: saved.guideOff ? '○' : '●', name: label('guide'), note: label(saved.guideOff ? 'off' : 'on') });
    const toggle = tray.addChip(Object.assign(guide(), {
      onPress: () => {
        saved.guideOff = !saved.guideOff;
        if (saved.guideOff) this.#guide.kind = null;
        toggle.set(guide());
        this.#commit();
      }
    }));
  }

  #showGuide(kind) {
    if (this.#saved.guideOff) return;
    this.#guide.kind = kind;
    this.#guide.t = 0;
    this.#ui.spells.close();
    this.game.sound.play('blip');
  }

  #buildOwner(root) {
    const tr = this.#trainer;
    if (!tr) return;
    const team = this.battle.team;
    const school = tr.school;
    let portrait = null;
    try {
      portrait = this.game.art.portrait('person', tr.key || 'kid');
    } catch (error) {
      portrait = null;
    }
    const name = tr.name || label('rival');
    this.#ui.owner = new BattleOwner(root, { portrait, label: school ? label('ownerRing', { name }) : name, team: team ? team.total : 0 });
    if (!school) return;
    const color = school.col || '#ffd98a';
    root.classList.add('framed');
    root.style.setProperty('--sc', color);
    if (school.rule) showRule(root, label('rule', { rule: school.rule }));
    const card = showTitleCard(root, {
      crest: ringCrest(school.col), kicker: label('ringDuel'), title: school.name, name: tr.name || '', rule: school.rule,
      hint: label('tapToBegin')
    });
    this.stage.after(TITLE_MS, card.hide);
    this.game.sound.play('spell');
  }

  #pressSpells() {
    const ui = this.#ui;
    if (ui.party.isOpen) {
      if (this.forced) return;
      ui.party.close();
    }
    ui.spells.toggle();
  }

  #pressSwitch() {
    const ui = this.#ui;
    if (this.battle.over) return;
    if (ui.party.isOpen) {
      if (!this.forced) ui.party.close();
      return;
    }
    if (this.busy || !this.battle.switchTargets().length) return;
    this.openParty(false);
  }

  #switchTo(index) {
    const b = this.battle;
    if (this.busy || b.over || !b.switchTargets().includes(index)) return;
    const m = b.side('me').members[index];
    const max = m.maxHp || 20;
    this.incoming = { hp: m.hp == null ? max : m.hp, sta: m.sta == null ? Infinity : m.sta };
    this.forced = false;
    this.#ui.party.close();
    this.act((battle) => battle.switchTo(index));
  }

  #pressEscape() {
    const b = this.battle;
    if (b.over) return;
    if (this.#trainer) {
      this.message.say(line('refuseDuelEscape'));
      return;
    }
    if (this.busy) return;
    if (!this.#saved.told.escape && !this.#escapeArmed) {
      this.#escapeArmed = true;
      this.message.say(label('tipEscape'));
      return;
    }
    this.firstTime('escape');
    this.#escapeArmed = false;
    this.act((battle) => battle.tryEscape());
  }
}
