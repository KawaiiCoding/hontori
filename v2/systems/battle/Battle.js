/*
 * Battle.js  (engine: battle framework)
 * Job: run a turn-based battle whose rules are supplied by the game. It holds the sides, the round, the phase
 * and the random source; every player choice goes through perform() and comes back as a list of plain events
 * that a scene plays in order. It knows no game: no types, no spells, no names.
 *
 * Public API:
 *   new Battle(rules, setup, { random })   random: () => [0, 1); Math.random when not given
 *   begin()                    the opening events (rules.begin); call once
 *   perform(action, payload)   one player choice -> events. Refused choices give one { type: 'refused', action,
 *                              reason, text } event and change nothing
 *   can(action, payload)       null when allowed, else { reason, text } (rules.check)
 *   actions                    the action names the rules offer
 *   over, result, report       true once finish() ran; what the rules reported
 *   errors                     anything a rule threw (also emitted as { type: 'error', message })
 *   sides, side(id), fighter(id)   the Side objects and the fighter on the field of one side
 * For the rules (inside an action or begin):
 *   emit(type, data)           add { type, ...data } to the current event list
 *   addSide(id, members)       create a Side (a subclass may set static Side to its own Side class)
 *   send(sideId, index, fighter)   put a fighter on the field; its status changes are emitted from now on as
 *                              { type: 'status', target: sideId, name, value, before }
 *   startRound()               round + 1, every fighter on the field ticks its cooldowns, emits { type: 'round', round }
 *   runSteps(steps, stop)      call each step in order; after each, stop() may return a value to end early
 *   finish(result, report)     the battle is over; emits { type: 'end', result, report }
 *   state                      a bag for the rules' own values
 *
 * The rules interface:
 *   {
 *     setup(battle, setup)                  build the sides and state (no events yet)
 *     begin(battle)                         opening events, up to the first choice
 *     actions: { name(battle, payload) }    each player choice; emits what happened, up to the next choice
 *     check(battle, action, payload)        optional: null, or { reason, text } to refuse
 *   }
 */

import { Side } from './Side.js';

export class Battle {
  static Side = Side;
  #events = null;

  constructor(rules, setup, options) {
    if (!rules || typeof rules.setup !== 'function' || !rules.actions) throw new Error('Battle needs rules with setup and actions');
    this.rules = rules;
    const random = (options && options.random) || Math.random;
    this.random = () => {
      const r = random();
      return r >= 0 && r < 1 ? r : 0;
    };
    this.sides = {};
    this.round = 0;
    this.over = false;
    this.result = null;
    this.report = null;
    this.errors = [];
    this.state = {};
    this.began = false;
    this.#collect(() => rules.setup(this, setup || {}));
  }

  get actions() {
    return Object.keys(this.rules.actions);
  }

  side(id) {
    return this.sides[id] || null;
  }

  fighter(id) {
    const s = this.sides[id];
    return s ? s.fighter : null;
  }

  emit(type, data) {
    const e = Object.assign({ type }, data);
    if (this.#events) this.#events.push(e);
    return e;
  }

  addSide(id, members, SideClass) {
    const Make = SideClass || this.constructor.Side;
    const side = new Make(id, members);
    this.sides[id] = side;
    return side;
  }

  send(sideId, index, fighter) {
    const side = this.sides[sideId];
    fighter.onStatus = (f, name, value, before) => {
      if (side.fighter === f) this.emit('status', { target: sideId, name, value, before });
    };
    side.send(index, fighter);
    return fighter;
  }

  startRound() {
    this.round++;
    for (const id of Object.keys(this.sides)) {
      const f = this.sides[id].fighter;
      if (f) f.tickCooldowns();
    }
    this.emit('round', { round: this.round });
  }

  runSteps(steps, stop) {
    for (const step of steps) {
      step();
      const s = stop ? stop() : null;
      if (s) return s;
    }
    return null;
  }

  finish(result, report) {
    if (this.over) return;
    this.over = true;
    this.result = result;
    this.report = report || null;
    this.emit('end', { result, report: this.report });
  }

  begin() {
    if (this.began) return [this.#refusal('begin', 'begun', '')];
    this.began = true;
    return this.#collect(() => {
      if (typeof this.rules.begin === 'function') this.rules.begin(this);
    });
  }

  can(action, payload) {
    if (this.over) return { reason: 'over', text: '' };
    if (!this.began) return { reason: 'notBegun', text: '' };
    if (typeof this.rules.actions[action] !== 'function') return { reason: 'unknown', text: '' };
    if (typeof this.rules.check !== 'function') return null;
    try {
      return this.rules.check(this, action, payload || {}) || null;
    } catch (e) {
      this.errors.push(e);
      return { reason: 'error', text: '' };
    }
  }

  perform(action, payload) {
    const why = this.can(action, payload);
    if (why) return [this.#refusal(action, why.reason, why.text)];
    return this.#collect(() => this.rules.actions[action](this, payload || {}));
  }

  #refusal(action, reason, text) {
    return { type: 'refused', action, reason, text: text || '' };
  }

  #collect(fn) {
    const outer = this.#events;
    const list = [];
    this.#events = list;
    try {
      fn();
    } catch (e) {
      this.errors.push(e);
      list.push({ type: 'error', message: String((e && e.message) || e) });
    } finally {
      this.#events = outer;
    }
    return list;
  }
}
