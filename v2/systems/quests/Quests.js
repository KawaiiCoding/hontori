/*
 * Quests.js
 * Job: the quest rules. It reads the quests registered under kind "quest" (content/schema.md section 9),
 * keeps each one's state in the save section "quests", finishes steps in order when their conditions
 * hold, runs a quest's `after` commands once when it is done, and answers which quest is followed and
 * where its next step points on any map. It never draws and never touches the DOM.
 *
 * Public API (registry kind "system", id "quests"):
 *   new Quests(ports, options)
 *        ports: { test(cond) -> boolean, run(commands) -> Promise, text(id, params) -> string } (index.js)
 *        options.words: { newQuest, questDone }   toast lines with a {quest} placeholder
 *   start(game)
 *   all()                    the quest definitions in the order they were registered
 *   get(id)                  one definition, or undefined
 *   status(id)               'none' | 'active' | 'done'
 *   isStepDone(id, stepId)
 *   doneCount(id)            how many of its steps are done
 *   nextStep(id)             the first step not yet done, or null
 *   begin(id, { quiet })     start a quest (no-op if it already started); true if it started now
 *   finishStep(id, stepId)   mark a step done (starts the quest quietly first if needed)
 *   advance()                re-check every active quest now; true if anything changed
 *   current()                the followed quest if it is active, else the most recently started active one
 *   follow(id)               make an active quest the followed one
 *   title(id), desc(id)      the player's words for a quest
 *   stepText(id)             the player's words for its next step ('' when there is none)
 *   goal(mapId)              where the current quest's next step points, seen from mapId:
 *                            { map, x, y, door: false } on that map, { map, x, y, door: true, toward } for
 *                            the door that leads toward it, or null
 *
 * Events it emits on game.bus:
 *   "quest:change"   { id, why: 'start' | 'step' | 'done' | 'follow' }
 *
 * Save section "quests" (QUESTS_SAVE):
 *   { states: { [id]: { status, steps: { [stepId]: true }, order, after } }, followed, order }
 */

import { Routes } from './routes.js';

export const QUESTS_SAVE = { states: {}, followed: '', order: 0 };

const DEFAULT_WORDS = { newQuest: 'New quest: {quest}', questDone: 'Quest complete: {quest}' };

export class Quests {
  #game = null;
  #ports;
  #words;
  #defs = [];
  #byId = new Map();
  #routes = null;
  #advancing = false;
  #again = false;
  #afterRunning = new Set();

  constructor(ports, options = {}) {
    this.#ports = ports;
    this.#words = { ...DEFAULT_WORDS, ...(options.words || {}) };
  }

  start(game) {
    this.#game = game;
    this.#routes = new Routes(game.registry);
    for (const def of game.registry.all('quest')) {
      if (!def || !def.id || !Array.isArray(def.steps)) continue;
      this.#defs.push(def);
      this.#byId.set(def.id, def);
    }
    const recheck = () => this.advance();
    game.bus.on('map:enter', recheck);
    game.bus.on('world:tick', recheck);
    game.bus.on('scene:change', recheck);
    game.bus.on('story:flag', recheck);
    game.bus.on('story:end', recheck);
  }

  all() {
    return this.#defs;
  }

  get(id) {
    return this.#byId.get(id);
  }

  status(id) {
    const state = this.#state(id);
    return state ? state.status : 'none';
  }

  isStepDone(id, stepId) {
    const state = this.#state(id);
    return !!(state && state.steps[stepId]);
  }

  doneCount(id) {
    const def = this.get(id);
    const state = this.#state(id);
    if (!def || !state) return 0;
    return def.steps.filter((step) => state.steps[step.id]).length;
  }

  nextStep(id) {
    const def = this.get(id);
    const state = this.#state(id);
    if (!def || !state || state.status === 'done') return null;
    return def.steps.find((step) => !state.steps[step.id]) || null;
  }

  begin(id, { quiet = false } = {}) {
    const def = this.get(id);
    const save = this.#save();
    if (!def || !save || save.states[id]) return false;
    save.order += 1;
    save.states[id] = { status: 'active', steps: {}, order: save.order, after: false };
    if (!quiet) this.#toast(this.#words.newQuest, def);
    this.#sound('page');
    this.#emit(id, 'start');
    this.advance();
    this.#commit();
    return true;
  }

  finishStep(id, stepId) {
    if (!this.get(id)) return;
    if (!this.#state(id)) this.begin(id, { quiet: true });
    const state = this.#state(id);
    if (!state || state.steps[stepId]) return;
    state.steps[stepId] = true;
    this.#emit(id, 'step');
    this.advance();
    this.#commit();
  }

  advance() {
    if (!this.#game || !this.#save()) return false;
    /* conditions read the world; nothing advances on the title */
    if (!this.#worldUnder()) return false;
    if (this.#advancing) {
      this.#again = true;
      return false;
    }
    this.#advancing = true;
    let changed = false;
    try {
      do {
        this.#again = false;
        for (const def of this.#defs) if (this.#advanceOne(def)) changed = true;
      } while (this.#again);
    } finally {
      this.#advancing = false;
    }
    if (changed) this.#commit();
    return changed;
  }

  current() {
    const save = this.#save();
    if (!save) return null;
    if (save.followed && this.status(save.followed) === 'active') return save.followed;
    let best = null;
    for (const def of this.#defs) {
      const state = save.states[def.id];
      if (state && state.status === 'active' && (!best || state.order >= save.states[best].order)) best = def.id;
    }
    return best;
  }

  follow(id) {
    const save = this.#save();
    if (!save || this.status(id) !== 'active' || save.followed === id) return;
    save.followed = id;
    this.#emit(id, 'follow');
    this.#commit();
  }

  title(id) {
    const def = this.get(id);
    return def ? this.#text(def.title) : '';
  }

  desc(id) {
    const def = this.get(id);
    return def && def.desc ? this.#text(def.desc) : '';
  }

  stepText(id) {
    const step = this.nextStep(id);
    return step ? this.#text(this.#pick(step.text)) : '';
  }

  goal(mapId) {
    const id = this.current();
    const step = id && this.nextStep(id);
    if (!step || !Array.isArray(step.target)) return null;
    const spot = step.target.find((place) => place && place.map && (place.if == null || this.#test(place.if)));
    if (!spot) return null;
    if (spot.map === mapId) return { map: mapId, x: spot.x, y: spot.y, door: false };
    const door = this.#routes.firstDoor(mapId, spot.map);
    return door ? { map: mapId, x: door.x, y: door.y, door: true, toward: spot.map } : null;
  }

  /* ---------- inside ---------- */

  /* steps finish in order: a step counts only once every step before it is done */
  #advanceOne(def) {
    const state = this.#state(def.id);
    if (!state) return false;
    if (state.status === 'done') {
      this.#runAfter(def, state);
      return false;
    }
    let changed = false;
    for (const step of def.steps) {
      if (state.steps[step.id]) continue;
      if (step.done == null || !this.#test(step.done)) break;
      state.steps[step.id] = true;
      changed = true;
      this.#emit(def.id, 'step');
    }
    if (def.steps.every((step) => state.steps[step.id])) {
      state.status = 'done';
      changed = true;
      this.#toast(this.#words.questDone, def);
      this.#sound('sparkle');
      this.#emit(def.id, 'done');
      this.#runAfter(def, state);
    }
    return changed;
  }

  /* `after` runs once; it is marked only when it has finished, so a journey closed halfway runs it again */
  #runAfter(def, state) {
    if (state.after || this.#afterRunning.has(def.id)) return;
    if (!Array.isArray(def.after) || !def.after.length) {
      state.after = true;
      return;
    }
    this.#afterRunning.add(def.id);
    let done;
    try {
      done = Promise.resolve(this.#ports.run(def.after));
    } catch (error) {
      done = Promise.reject(error);
    }
    done.then(() => {
      state.after = true;
      this.#commit();
    }, (error) => console.warn(`Quests: the end of "${def.id}" failed`, error))
      .finally(() => {
        this.#afterRunning.delete(def.id);
        this.advance();
      });
  }

  #pick(value) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.pick)) return value;
    for (const arm of value.pick) if (Array.isArray(arm) && this.#test(arm[0])) return this.#pick(arm[1]);
    return this.#pick(value.else);
  }

  #test(cond) {
    try {
      return !!this.#ports.test(cond);
    } catch (error) {
      console.warn('Quests: a condition failed', cond, error);
      return false;
    }
  }

  #text(id, params) {
    if (typeof id !== 'string') return '';
    try {
      const shown = this.#ports.text(id, params);
      return typeof shown === 'string' ? shown : id;
    } catch (error) {
      return id;
    }
  }

  #toast(line, def) {
    try {
      this.#game.ui.toast(line.replace('{quest}', this.#text(def.title)));
    } catch (error) {
      console.warn('Quests: no toast', error);
    }
  }

  #sound(name) {
    try {
      this.#game.sound.play(name);
    } catch (error) {
      /* a game without that sound plays nothing */
    }
  }

  #emit(id, why) {
    this.#game.bus.emit('quest:change', { id, why });
  }

  #commit() {
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Quests: the save failed', error);
    }
  }

  #worldUnder() {
    const scenes = this.#game.scenes;
    return !!(scenes && scenes.base && scenes.base.hud);
  }

  #save() {
    const state = this.#game && this.#game.save.state;
    return state ? state.quests : null;
  }

  #state(id) {
    const save = this.#save();
    return save ? save.states[id] : undefined;
  }
}
