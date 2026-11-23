/*
 * Calendar.js  (engine: time)
 * Job: the days of a journey. It counts days, starts a new day at dawn or on waking, gives each
 * day its weather, skips hours when the player rests, and sets the hour for scripts. It owns no
 * drawing; the world's Environment holds the live hour and weather, this only steers it.
 *
 * Public API (registry kind "system"):
 *   new Calendar({ dawn, weathers, weatherOf })
 *        dawn: the hour a day starts while awake (default 5)
 *        weathers: { weather: weight } the daily weather is drawn from (default { clear: 1 })
 *        weatherOf(day, random): optional; returns the weather of that day (random() is seeded per day)
 *   start(game)
 *   day                      the day of the journey, from 1
 *   world                    the WorldScene last entered, or null
 *   setTime(hour), addTime(hours)
 *   newDay(reason)           count a day and draw its weather; reason: 'dawn' | 'rest' | any word
 *   weatherOf(day)           the weather that day has (the same every time it is asked)
 *   rest({ hours, wakeAt }, ctx)
 *        skip hours (8 by default) or wake at the first rule whose condition holds; the rules are
 *        wakeAt, then the "rest" lists of the content folders (later folders first):
 *        [{ if, hour, toast }]. Counts a day. Returns { from, to, hours, toast } or null.
 *
 * Saved state (section "time", see TIME_SAVE): { day, seed }
 *
 * Events it emits on game.bus:
 *   "time:day"    { day, weather, reason }           a new day began
 *   "time:rest"   { from, to, hours, day, map }       the player woke from a rest (heal, refill here)
 *   "time:set"    { hour }                           a script or a system set the hour
 */

import { testCondition, lookupText, contentFolders } from './links.js';

export const TIME_SAVE = { day: 1, seed: 0 };

const DEFAULT_REST_HOURS = 8;
/* a forward jump longer than this is not the clock running; it is a rest or a script */
const LONGEST_TICK_HOURS = 12;

/* a small seeded random (mulberry32), so a day's weather is the same after a reload */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Calendar {
  world = null;

  #game = null;
  #dawn;
  #weathers;
  #weatherOf;
  #last = null;

  constructor({ dawn = 5, weathers = { clear: 1 }, weatherOf = null } = {}) {
    this.#dawn = dawn;
    this.#weathers = weathers;
    this.#weatherOf = weatherOf;
  }

  start(game) {
    this.#game = game;
    game.bus.on('map:enter', ({ scene }) => {
      this.world = scene;
      this.#last = scene.env.time;
      this.#seed();
    });
    game.bus.on('world:tick', ({ scene, env }) => this.#tick(scene, env));
  }

  get #state() {
    return this.#game.save.state.time || { ...TIME_SAVE };
  }

  get day() {
    return this.#state.day;
  }

  setTime(hour) {
    const env = this.world && this.world.env;
    if (!env || typeof hour !== 'number' || !Number.isFinite(hour)) return;
    env.setTime(hour);
    this.#game.bus.emit('time:set', { hour: env.time });
  }

  addTime(hours) {
    const env = this.world && this.world.env;
    if (env && Number.isFinite(hours)) this.setTime(env.time + hours);
  }

  newDay(reason) {
    const state = this.#state;
    state.day += 1;
    const weather = this.weatherOf(state.day);
    if (this.world && weather) this.world.env.setWeather(weather);
    this.#game.bus.emit('time:day', { day: state.day, weather, reason });
  }

  weatherOf(day) {
    const random = seeded((this.#state.seed * 31 + day * 7919) | 0);
    if (this.#weatherOf) {
      try {
        return this.#weatherOf(day, random);
      } catch (error) {
        console.warn('Calendar: weatherOf failed', error);
      }
    }
    const entries = Object.entries(this.#weathers).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = random() * total;
    for (const [weather, weight] of entries) {
      roll -= weight;
      if (roll < 0) return weather;
    }
    return entries.length ? entries[0][0] : null;
  }

  rest({ hours = DEFAULT_REST_HOURS, wakeAt = [] } = {}, ctx) {
    const world = this.world;
    if (!world) return null;
    const env = world.env;
    const from = env.time;
    const rule = this.#wakeRule(wakeAt, ctx);
    const to = rule && Number.isFinite(rule.hour) ? rule.hour : from + hours;
    env.setTime(to);
    this.#last = env.time;
    this.newDay('rest');
    /* people wake to where their day has them, even right beside the player */
    for (const person of world.people || []) {
      try {
        person.followSchedule(env.time, world.player.tx, world.player.ty, env.indoor, true);
      } catch (error) {
        console.warn('Calendar: a schedule failed after a rest', error);
      }
    }
    const result = { from, to: env.time, hours: (env.time - from + 24) % 24 || 24, day: this.day, map: world.map && world.map.id };
    this.#game.bus.emit('time:rest', result);
    result.toast = rule && rule.toast ? lookupText(this.#game, rule.toast, rule.params, ctx) : null;
    if (result.toast && this.#game.ui) this.#game.ui.toast(result.toast);
    this.#game.save.commit();
    return result;
  }

  #wakeRule(wakeAt, ctx) {
    const rules = [...(Array.isArray(wakeAt) ? wakeAt : [])];
    for (const folder of contentFolders(this.#game).reverse()) {
      if (folder && Array.isArray(folder.rest)) rules.push(...folder.rest);
    }
    return rules.find((rule) => rule && testCondition(this.#game, rule.if, ctx)) || null;
  }

  #seed() {
    const state = this.#game.save.state.time;
    if (state && !state.seed) state.seed = 1 + Math.floor(Math.random() * 2147483646);
  }

  /* a day also begins when the clock runs past dawn while the player is awake */
  #tick(scene, env) {
    if (scene !== this.world) return;
    const now = env.time;
    const before = this.#last;
    this.#last = now;
    if (before == null) return;
    const passed = (now - before + 24) % 24;
    if (passed <= 0 || passed >= LONGEST_TICK_HOURS) return;
    const untilDawn = (this.#dawn - before + 24) % 24;
    if (untilDawn > 0 && untilDawn <= passed) this.newDay('dawn');
  }
}
