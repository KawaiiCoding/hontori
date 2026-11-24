/*
 * HontoriBattle.js  (Hontori game layer)
 * Job: a Hontori battle: the engine Battle with Hontori's rules, the player's choices as methods and the
 * read-only questions a battle scene asks to draw its buttons.
 *
 * Public API:
 *   new HontoriBattle(setup, { random })    setup: see setup.js
 *   begin()                                 opening events, up to the first turn
 *   useMove(index), catchBreath(), castSpell(kind, accuracy), switchTo(index), tryEscape(), useItem(id)
 *                                           -> events (see fight.js, turn.js, cast.js, rules.js)
 *   me, foe, round, over, result, report, mana, maxMana, moves, loadout, known, trainer
 *   intent                  'stunned' | 'asleep' | the foe's intent
 *   quick                   the foe moves first this round
 *   hint()                  { id, text } for the player's turn
 *   cooldown(index)         rounds of rest left for that move
 *   moveCost(index)         stamina cost
 *   canCatchBreath()        every move costs more stamina than is left (and yours stands)
 *   spellCost(kind), mastery(kind), tolerance(kind)   tolerance: extra slack for the sigil recogniser
 *   canCast(kind)           true or { reason, text } (mana and "one each turn" included)
 *   escapeChance(), escapeBars()
 *   canSwitch()             the Switch button is shown (2+ members, no noSwitch rule)
 *   switchTargets()         indices that may come in now
 *   bindTriesLeft, team     team: { defeated, total } for the trainer's dots, or null
 *   herbs, breadReady       whether the Herb and Bread buttons are shown
 *   double                  { ally, partner } in a double battle (ally.js allyView), each null otherwise
 *   pure                    the ring rule pure is on (no items, no binding)
 *   sealedSpell             the spell whose slot the rule blind sealed, or null
 *   foreseen                { now, next } while the Lantern Sigil shows the foe's plan, or null
 *   treat                   { id, n } of a carried thing with the effect earthTreat (rules.js), or null
 */

import { Battle } from '../../systems/battle/Battle.js';
import { hontoriRules, tiredAll, TREAT_EFFECT } from './rules.js';
import { shownIntent, hint, aliveOthers } from './turn.js';
import { quickFoe } from './intent.js';
import { escapeChance, escapeBars, BIND_TRIES } from './chances.js';
import { staCost } from './moves.js';
import { tolerance } from './spells.js';
import { checkSpell } from './cast.js';
import { spellMastery, costOf, itemCount, hasRule } from './common.js';
import { line } from './text.js';
import { allyView } from './ally.js';

export class HontoriBattle extends Battle {
  constructor(setup, options) {
    super(hontoriRules, setup, options);
  }

  useMove(index) { return this.perform('move', { index }); }
  catchBreath() { return this.perform('breath'); }
  castSpell(kind, accuracy) { return this.perform('spell', { kind, accuracy }); }
  switchTo(index) { return this.perform('switch', { index }); }
  tryEscape() { return this.perform('escape'); }
  useItem(id) { return this.perform('item', { id }); }

  get me() { return this.fighter('me'); }
  get foe() { return this.fighter('foe'); }
  get mana() { return this.state.mana; }
  get maxMana() { return this.state.maxMana; }
  get moves() { return this.state.moves.slice(); }
  get loadout() { return this.state.loadout.slice(); }
  get known() { return this.state.known.slice(); }
  get trainer() { return this.state.trainer; }
  get intent() { return shownIntent(this); }
  get quick() { return quickFoe(this.foe, this.me); }
  get bindTriesLeft() { return BIND_TRIES - this.state.binds; }
  get team() { return this.state.team ? { defeated: this.state.teamIndex, total: this.state.team.length } : null; }
  get herbs() { return this.pure ? 0 : itemCount(this, 'herb'); }
  get pure() { return hasRule(this, 'pure'); }
  get sealedSpell() { return this.state.sealedSpell; }
  get foreseen() { return this.state.foresee > 0 ? { now: this.state.intent, next: this.state.nextIntent } : null; }
  get double() { return allyView(this); }
  get treat() {
    if (this.pure) return null;
    const it = this.state.items.find((i) => i.effect === TREAT_EFFECT && (i.n == null || i.n > 0));
    return it ? { id: it.id, n: it.n == null ? 1 : it.n } : null;
  }
  get breadReady() { return !this.pure && itemCount(this, 'bread') > 0 && !this.state.breadUsed && !this.state.trainer; }

  hint() {
    const id = hint(this);
    return { id, text: line(id) };
  }

  cooldown(index) {
    const mv = this.state.moves[index];
    return mv ? this.me.cooldown(mv.id) : 0;
  }

  moveCost(index) {
    return staCost(this.state.moves[index]);
  }

  canCatchBreath() {
    return !this.over && !this.me.fainted && tiredAll(this);
  }

  spellCost(kind) { return costOf(this, kind); }
  mastery(kind) { return spellMastery(this, kind); }
  tolerance(kind) { return tolerance(spellMastery(this, kind), this.state.perks); }

  canCast(kind) {
    const why = checkSpell(this, kind);
    return why ? why : true;
  }

  escapeChance() {
    return escapeChance({ me: this.me, foe: this.foe, tries: this.state.escTries, quick: this.quick, step: this.state.stepped });
  }

  escapeBars() {
    return this.state.trainer ? 0 : escapeBars(this.escapeChance());
  }

  canSwitch() {
    return this.side('me').members.length >= 2 && !(this.state.trainer && this.state.trainer.noSwitch);
  }

  switchTargets() {
    return aliveOthers(this);
  }
}
