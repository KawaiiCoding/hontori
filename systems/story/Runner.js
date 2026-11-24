/*
 * Runner.js
 * Job: the story system. It runs scripts one at a time (the world is paused under a dialog scene
 * while one runs), answers conditions and values, keeps the story flags, and turns what happens in
 * the world into events: talking to someone, using a prop, a building or a tile, entering a map,
 * stepping into an area, trying a door, a flag becoming true, a battle ending, a new journey, and
 * conditions that come true while the world is calm (content/schema.md sections 4 to 8).
 *
 * Public API (registry kind "system"; also on game.story):
 *   start(game)
 *   library, strings               the merged content (Library.js) and its text table (Text.js)
 *   busy                           true while a script runs
 *   play(commands, extra)          run a list of commands as a script of its own; a Promise.
 *                                  extra: fields for the context ({ self, person, target, obj, battle }).
 *                                  Does nothing while another script runs: use run for work that must happen.
 *   run(commands, extra)           the same, but it waits its turn: the commands run as soon as the world
 *                                  is calm (no script, no menu on top). A Promise that resolves when they ran.
 *   helper(card)                   show a once-only first-touch card { id | helper, title, text, icon } as
 *                                  soon as the world is calm (nothing if it was shown before)
 *   playScript(id, extra)          the same for a script by its id
 *   fire(trigger, payload)         try the events of a trigger another system reports, for example
 *                                  fire('battleEnd', result); the first matching event runs
 *   test(cond, ctx)                does the condition hold
 *   value(v, ctx)                  work out a value
 *   text(id, params, ctx)          a text with its placeholders filled
 *   flag(name), flagValue(name), setFlag(name, value)   story flags (undefined removes one)
 *   today()                        the day number (from the value "day" another system registers)
 *   world                          the world scene while the world is on screen, else null
 *   people                         the PeopleDirector (Directing.js)
 *   saved                          the "story" save section
 *
 *   The context (ctx) every handler receives as its second argument:
 *     vars                         the script's local variables
 *     self, person, target, obj, battle, visit    what is being used ({ kind, type, map, x, y, id, person })
 *     value(v), test(cond), text(id, params)      the three questions, asked with this context
 *     run(commands)                run more commands inside the running script (a Promise of the signal)
 *     story                        this object
 *
 *   Inside commands (also the third argument of a handler, for the story's own commands):
 *   block(commands, ctx), runScript(id, ctx), command(cmd, ctx, verb)   run more commands
 *   readVar(ctx, path), writeVar(ctx, path, value)                       local variables ('cast.kind')
 *   markValue(ctx, name), setMark(ctx, name, value)                      marks on the thing being used
 *   speaker(who, ctx), line(speaker, text), choose(options, opts)        words and choices on screen
 *   darken(to, ms), flash(), shake(seconds), refreshPeople(force)        effects over the world
 *   ended(ctx)                     the running script was cut off (the scene was closed)
 *   warnOnce(key, message)
 *
 * Registry kinds it reads (a later entry never replaces an earlier one: one id means one thing).
 * Every handler has the same signature, (node, ctx): the command, condition or value object, and the context.
 *   "story.command"    verb -> (node, ctx) => undefined | 'stop' | 'pass' | Promise of one
 *                      an extension command { ext: name } is looked up as "ext:<name>";
 *                      { ask: name } other than 'controls' as "ask:<name>"
 *   "story.condition"  key -> (node, ctx) => boolean     ({ ext: name } as "ext:<name>")
 *   "story.value"      key -> (node, ctx) => any         ({ ext: name } as "ext:<name>");
 *                      "day" gives today's number, "companion" and "player" fill {companion} and {player}
 *   "story.speaker"    id -> (speaker, ctx, story) => speaker    adjust who is speaking (a portrait, a name)
 *   "content"          folder id -> content folder, in load order
 *
 * Events it emits on game.bus:
 *   "story:flag"   { name, value }   a flag changed
 *   "story:end"    {}                a script ended (quests and the HUD may look again)
 * Events it listens to: world:interact, map:enter, world:tick, player:step, door:enter, battle:end
 *   ("battle:end" payload: the battle's result, { wild, won, lost, fled, captured, ... }),
 *   helper:moment { name } (a first-touch card whose `when` is that name), time:set and time:rest
 *   (the people go where the new hour has them).
 * Entering a map sets the flag "visited:<map>". game.text(id, params) is this system's text().
 */

import { Library } from './Library.js';
import { Text } from './Text.js';
import { CONDITIONS, FALLBACK_CONDITIONS } from './Conditions.js';
import { VALUES, FALLBACK_VALUES, typeName } from './Values.js';
import { COMMANDS, FALLBACK_COMMANDS, STOP, PASS } from './Commands.js';
import { PeopleDirector } from './Directing.js';

export const STORY_SAVE = { started: false, flags: {}, marks: {}, visits: {}, spawned: {}, talks: {} };

/* after a map is entered the door fade must clear before a script may pause the world */
const SETTLE_MS = 450;
/* a talk shows at most this many small-talk lines */
const LINES_PER_TALK = 2;
const OPPOSITE = [1, 0, 3, 2];

export class StoryRunner {
  busy = false;
  game = null;
  library = null;
  strings = null;
  people = new PeopleDirector(this);

  #world = null;
  #scene = null;
  #root = null;
  #pending = [];
  #inside = new Set();
  #calmAt = 0;
  #warned = new Set();
  #shake = null;
  #drainTimer = 0;
  #idle = null;
  #helping = new Set();

  start(game) {
    this.game = game;
    this.library = new Library([...game.registry.all('content')]);
    this.strings = new Text(this.library.text);
    if (!game.story) game.story = this;
    if (!game.text) game.text = (id, params) => this.text(id, params);
    this.#idle = this.#context();
    const bus = game.bus;
    bus.on('world:interact', (event) => this.#onInteract(event));
    bus.on('map:enter', (event) => this.#onEnter(event));
    bus.on('world:tick', () => this.#onTick());
    bus.on('player:step', (event) => this.#onStep(event));
    bus.on('door:enter', (event) => this.#onDoor(event));
    bus.on('battle:end', (result) => this.fire('battleEnd', result || {}));
    bus.on('helper:moment', (event) => this.#onMoment(event));
    bus.on('time:set', () => this.people.refresh(true));
    bus.on('time:rest', () => this.people.refresh(true));
  }

  get saved() {
    return this.game.save.state.story;
  }

  get world() {
    const world = this.#world;
    return world && world.map ? world : null;
  }

  /* ---------- running scripts ---------- */

  play(commands, extra) {
    return this.#play((ctx) => this.block(commands, ctx), this.#context(extra));
  }

  playScript(id, extra) {
    return this.#play((ctx) => this.runScript(id, ctx), this.#context({ visitKey: `script:${id}`, ...extra }));
  }

  run(commands, extra) {
    if (!Array.isArray(commands) || !commands.length) return Promise.resolve();
    return new Promise((resolve) => {
      this.#pending.push({ commands, ctx: this.#context(extra), resolve });
      this.#drainSoon(0);
    });
  }

  helper(card) {
    const id = card && (card.id || card.helper);
    if (!id || this.flag(`help:${id}`) || this.#helping.has(id)) return Promise.resolve();
    this.#helping.add(id);
    return this.run([{ helper: id, title: card.title, text: card.text, icon: card.icon }]).then(() => this.#helping.delete(id));
  }

  async block(commands, ctx) {
    if (!commands) return undefined;
    for (const cmd of commands) {
      if (this.ended(ctx)) return STOP;
      const signal = await this.command(cmd, ctx);
      if (signal) return signal;
    }
    return undefined;
  }

  async runScript(id, ctx) {
    const script = this.library.scripts[id];
    if (!script) {
      this.warnOnce(`script:${id}`, `Story: there is no script "${id}"`);
      return undefined;
    }
    const signal = await this.block(script, ctx);
    return signal === PASS ? PASS : undefined;
  }

  async command(cmd, ctx, verb = verbOf(cmd)) {
    if (!cmd || typeof cmd !== 'object') return undefined;
    const handler = this.game.registry.get('story.command', verb) || FALLBACK_COMMANDS[verb];
    if (!handler) {
      this.warnOnce(`command:${verb}`, `Story: no system carries out "${verb}" yet`);
      return undefined;
    }
    try {
      const signal = await handler(cmd, this.#contextOf(ctx), this);
      return signal === STOP || signal === PASS ? signal : undefined;
    } catch (error) {
      console.warn(`Story: the command "${verb}" failed`, error);
      return undefined;
    }
  }

  ended(ctx) {
    return !!(ctx && ctx.root && ctx.root.ended);
  }

  /* ---------- conditions, values, text ---------- */

  test(cond, given) {
    const ctx = this.#contextOf(given);
    if (cond === undefined || cond === null) return true;
    if (typeof cond === 'string') return this.flag(cond);
    if (typeof cond === 'boolean') return cond;
    if (typeof cond !== 'object') return !!cond;
    const key = verbOf(cond);
    const handler = this.game.registry.get('story.condition', key) || FALLBACK_CONDITIONS[key];
    if (!handler) {
      this.warnOnce(`condition:${key}`, `Story: no system answers the condition "${key}" yet`);
      return false;
    }
    try {
      return !!handler(cond, ctx, this);
    } catch (error) {
      console.warn(`Story: the condition "${key}" failed`, error);
      return false;
    }
  }

  value(v, given) {
    const ctx = this.#contextOf(given);
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return v;
    const key = verbOf(v);
    const handler = this.game.registry.get('story.value', key) || FALLBACK_VALUES[key];
    if (!handler) {
      this.warnOnce(`value:${key}`, `Story: no system works out the value "${key}" yet`);
      return null;
    }
    try {
      return handler(v, ctx, this);
    } catch (error) {
      console.warn(`Story: the value "${key}" failed`, error);
      return null;
    }
  }

  text(id, params, given) {
    const ctx = this.#contextOf(given);
    return this.strings.get(id, params, (value, named) => (named ? this.#named(value, ctx) : this.value(value, ctx)));
  }

  /* {companion}, {player} and other names every text may use */
  #named(name, ctx) {
    const handler = this.game.registry.get('story.value', name);
    /* without a system that knows it, a name falls back to the voice of that id ({companion}) */
    if (!handler) {
      const voice = this.library.voices[name];
      return voice && voice.name ? this.strings.get(voice.name) : undefined;
    }
    try {
      return handler({ [name]: true }, ctx, this);
    } catch (error) {
      return undefined;
    }
  }

  /* ---------- flags, marks, variables ---------- */

  flag(name) {
    const value = this.saved.flags[name];
    return value !== undefined && value !== null && value !== false;
  }

  flagValue(name) {
    return this.saved.flags[name];
  }

  setFlag(name, ...given) {
    /* setFlag(name) sets it; setFlag(name, undefined) removes it */
    const value = given.length ? given[0] : true;
    const flags = this.saved.flags;
    const was = this.flag(name);
    const stored = value === 'today' ? this.today() : value;
    if (stored === undefined) delete flags[name];
    else flags[name] = stored;
    this.game.bus.emit('story:flag', { name, value: stored });
    if (!was && this.flag(name)) this.fire('flag', { name });
  }

  today() {
    const handler = this.game.registry.get('story.value', 'day');
    if (!handler) return 0;
    try {
      return handler({ day: true }, {}, this) || 0;
    } catch (error) {
      return 0;
    }
  }

  readVar(ctx, path) {
    let at = ctx.vars;
    for (const part of String(path).split('.')) {
      if (at === null || typeof at !== 'object') return undefined;
      at = at[part];
    }
    return at;
  }

  writeVar(ctx, path, value) {
    const parts = String(path).split('.');
    let at = ctx.vars;
    for (const part of parts.slice(0, -1)) {
      if (at[part] === null || typeof at[part] !== 'object') at[part] = {};
      at = at[part];
    }
    at[parts[parts.length - 1]] = value;
  }

  markValue(ctx, name) {
    const key = this.#markKey(ctx, name);
    return key ? this.saved.marks[key] : undefined;
  }

  setMark(ctx, name, value) {
    const key = this.#markKey(ctx, name);
    if (!key) return;
    const stored = value === 'today' ? this.today() : value;
    if (stored === undefined) delete this.saved.marks[key];
    else this.saved.marks[key] = stored;
  }

  #markKey(ctx, name) {
    const target = ctx.target;
    return target ? `${target.map}:${target.x}:${target.y}:${name}` : null;
  }

  /* ---------- the screen ---------- */

  speaker(who, ctx = {}) {
    const library = this.library;
    let speaker;
    if (!who || who === 'self') speaker = this.#personSpeaker(ctx.self, ctx.person);
    else if (library.people.has(who)) speaker = this.#personSpeaker(library.people.get(who), null);
    else if (library.voices[who]) {
      const voice = library.voices[who];
      speaker = { id: who, name: this.text(voice.name, null, ctx), look: voice.look || null, color: voice.color || null, voice };
    } else {
      this.warnOnce(`who:${who}`, `Story: nobody called "${who}" can speak`);
      speaker = { id: who, name: '', look: null, color: null };
    }
    for (const adjust of this.game.registry.all('story.speaker')) {
      try {
        speaker = adjust(speaker, ctx, this) || speaker;
      } catch (error) {
        console.warn('Story: a speaker hook failed', error);
      }
    }
    if (speaker.portrait === undefined) speaker.portrait = this.#portrait(speaker.look);
    if (!speaker.color) speaker.color = library.lookColors[speaker.look] || library.defaultColor;
    return speaker;
  }

  #personSpeaker(def, person) {
    if (!def) return { id: '', name: '', look: person ? person.look : null, color: null };
    /* a phase may give the person another shown name (the grey cloak, once their name is known) */
    let nameId = def.name;
    for (const phase of def.phases || []) {
      if (!phase || !phase.name) continue;
      try {
        if (this.test(phase.if, {})) nameId = phase.name;
      } catch (error) {
        /* a phase that cannot be tested keeps the name before it */
      }
    }
    const name = nameId ? this.text(nameId) : '';
    return { id: def.id, name, look: def.look || (person && person.look) || null, color: def.color || null };
  }

  #portrait(look) {
    const art = this.game.art;
    if (!look || !art.knowsLook(look)) return null;
    try {
      return art.portrait('person', look) || null;
    } catch (error) {
      return null;
    }
  }

  line(speaker, text) {
    const scene = this.#scene;
    if (!scene) return Promise.resolve();
    return scene.dialog.say({ name: speaker.name, text, portrait: speaker.portrait, color: speaker.color });
  }

  /* put the dialog box away while the script shows something else (the next line brings it back) */
  hideLine() {
    const scene = this.#scene;
    try {
      if (scene && scene.dialog) scene.dialog.hide();
    } catch (error) {
      /* the box stays */
    }
  }

  choose(options, opts) {
    const scene = this.#scene;
    if (!scene) return Promise.resolve(0);
    return scene.choices.open(options, opts);
  }

  darken(to, ms) {
    return this.#scene ? this.#scene.darken(to, ms) : Promise.resolve();
  }

  flash() {
    if (this.#scene) this.#scene.flash();
  }

  shake(seconds) {
    const world = this.world;
    if (!world || this.#shake) return;
    this.#shake = { left: seconds, x: world.camera.x, y: world.camera.y };
  }

  refreshPeople(force) {
    this.people.refresh(force);
  }

  warnOnce(key, message) {
    if (this.#warned.has(key)) return;
    this.#warned.add(key);
    console.warn(message);
  }

  /* ---------- one script at a time ---------- */

  #context(extra = {}) {
    const ctx = { vars: {}, visit: { type: 0, object: 0 }, ...extra };
    ctx.root = ctx;
    ctx.story = this;
    ctx.value = (v) => this.value(v, ctx);
    ctx.test = (cond) => this.test(cond, ctx);
    ctx.text = (id, params) => this.text(id, params, ctx);
    ctx.run = (commands) => this.block(commands, ctx);
    return ctx;
  }

  /* a question asked from outside a script (a quest step, a shop row) still gets a full context */
  #contextOf(given) {
    if (given && given.story === this) return given;
    if (given) for (const key in given) return this.#context(given);
    return this.#idle;
  }

  async #play(body, ctx, onEnd) {
    if (this.busy) return;
    this.busy = true;
    this.#root = ctx;
    let scene = null;
    try {
      scene = this.game.scenes.open('story', { onUpdate: (dt) => this.#update(dt), onExit: () => this.#cutOff(scene) });
      this.#scene = scene;
      await body(ctx);
    } catch (error) {
      console.warn('Story: a script failed', error);
    }
    this.#finish(scene, ctx, onEnd);
  }

  #finish(scene, ctx, onEnd) {
    this.#endShake();
    this.people.release();
    if (onEnd) {
      try {
        onEnd();
      } catch (error) {
        console.warn('Story: ending a script failed', error);
      }
    }
    const open = this.#scene === scene && !ctx.ended;
    this.#scene = null;
    this.#root = null;
    this.busy = false;
    if (open && scene) {
      if (this.game.scenes.top === scene) this.game.scenes.pop();
      else console.warn('Story: a scene opened by the script is still on top of it');
    }
    this.game.save.commit();
    this.game.bus.emit('story:end', {});
    this.#drainSoon(0);
  }

  /* the dialog scene was closed under the script (the title was opened): stop where it is */
  #cutOff(scene) {
    if (this.#scene !== scene || !this.#root) return;
    this.#root.ended = true;
    this.#scene = null;
  }

  #update(dt) {
    this.people.step(dt);
    const scene = this.#scene;
    if (scene) scene.lively = this.people.walking || !!this.#shake;
    const shake = this.#shake;
    const world = this.world;
    if (!shake || !world) return;
    shake.left -= dt;
    if (shake.left <= 0) {
      this.#endShake();
      return;
    }
    world.camera.x = shake.x + Math.round((Math.random() - 0.5) * 6);
    world.camera.y = shake.y + Math.round((Math.random() - 0.5) * 6);
  }

  #endShake() {
    const shake = this.#shake;
    this.#shake = null;
    const world = this.world;
    if (!shake || !world) return;
    world.camera.x = shake.x;
    world.camera.y = shake.y;
  }

  /* ---------- events ---------- */

  fire(trigger, payload = {}) {
    if (!this.library) return;
    const ctx = this.#context(trigger === 'battleEnd' ? { battle: payload } : {});
    const event = this.#findEvent(trigger, (on) => matchTrigger(trigger, on[trigger], payload), ctx);
    if (event) this.#queue(event, ctx);
  }

  #findEvent(trigger, matches, ctx) {
    for (const event of this.library.events) {
      const on = event.on || {};
      if (!(trigger in on)) continue;
      if (event.once !== false && this.flag(`ev:${event.id}`)) continue;
      let hit = false;
      try {
        hit = matches(on);
      } catch (error) {
        hit = false;
      }
      if (hit && this.test(event.if, ctx)) return event;
    }
    return null;
  }

  async #runEvent(event, ctx) {
    if (event.once !== false) this.setFlag(`ev:${event.id}`, true);
    if (!ctx.visitKey) this.#visit(ctx, `event:${event.id}`, null);
    return this.block(event.then, ctx);
  }

  #queue(event, ctx) {
    this.#pending.push({ event, ctx });
    this.#drainSoon(0);
  }

  #drainSoon(ms) {
    clearTimeout(this.#drainTimer);
    this.#drainTimer = setTimeout(() => this.#drain(), Math.max(ms, this.#calmAt - performance.now(), 0));
  }

  /* the world is calm: it is on top, no script runs and no door fade is still clearing */
  #calm() {
    const world = this.world;
    return !this.busy && !!world && this.game.scenes.top === world && performance.now() >= this.#calmAt;
  }

  #drain() {
    if (!this.#calm()) {
      if (this.#pending.length && !this.busy) this.#drainSoon(SETTLE_MS);
      return;
    }
    const next = this.#pending.shift();
    if (next && next.commands) {
      this.#play((ctx) => this.block(next.commands, ctx), next.ctx).then(next.resolve);
      return;
    }
    if (next) {
      if (next.event.once !== false && this.flag(`ev:${next.event.id}`)) {
        this.#drainSoon(0);
        return;
      }
      this.#play(async (ctx) => {
        if (next.event.delay) await new Promise((resolve) => setTimeout(resolve, next.event.delay));
        await this.#runEvent(next.event, ctx);
      }, next.ctx);
      return;
    }
    const auto = this.#findEvent('auto', () => true, this.#idle);
    if (auto) {
      const ctx = this.#context();
      this.#play((c) => this.#runEvent(auto, c), ctx);
      return;
    }
    this.#dueHelper();
  }

  /* ---------- first-touch cards ---------- */

  /* a moment another system names ('ui:questPill'): the card whose `when` is that name, once */
  #onMoment({ name } = {}) {
    if (!name || !this.library) return;
    for (const card of this.library.helpers) if (card.when === name) this.helper(card);
  }

  /* a card whose `when` is a condition shows the first time it holds while the world is calm */
  #dueHelper() {
    for (const card of this.library.helpers) {
      if (!card.when || typeof card.when !== 'object' || this.flag(`help:${card.id}`)) continue;
      if (!this.test(card.when)) continue;
      this.helper(card);
      return;
    }
  }

  /* ---------- the world ---------- */

  #onEnter({ map, scene }) {
    this.#world = scene;
    this.#inside.clear();
    this.#calmAt = performance.now() + SETTLE_MS;
    try {
      this.people.attach(scene);
    } catch (error) {
      console.warn('Story: placing the people failed', error);
    }
    const saved = this.saved;
    if (!saved.started) {
      saved.started = true;
      /* a journey saved before the story existed is not new */
      const world = this.game.save.state.world;
      if (!world || world.map == null) this.fire('newGame', {});
    }
    if (!this.flag(`visited:${map.id}`)) this.setFlag(`visited:${map.id}`, true);
    this.fire('enter', { map: map.id });
    this.#drainSoon(0);
  }

  #onTick() {
    if (this.busy) return;
    this.people.refresh(false);
    if (this.#calm()) this.#drain();
  }

  #onStep({ map, tx, ty }) {
    if (this.busy || !this.library) return;
    for (const event of this.library.events) {
      const area = event.on && event.on.area;
      if (!area) continue;
      const inside = (!area.map || area.map === map.id) && inBox(tx, area.x) && inBox(ty, area.y);
      const was = this.#inside.has(event.id);
      if (inside) this.#inside.add(event.id);
      else this.#inside.delete(event.id);
      /* an area fires when the player steps into it; without rearm only the first time */
      if (!inside || was) continue;
      if (!event.on.rearm && this.flag(`area:${event.id}`)) continue;
      if (event.once !== false && this.flag(`ev:${event.id}`)) continue;
      const ctx = this.#context();
      if (!this.test(event.if, ctx)) continue;
      if (!event.on.rearm) this.setFlag(`area:${event.id}`, true);
      this.#play((c) => this.#runEvent(event, c), ctx);
      return;
    }
  }

  #onDoor({ map, door }) {
    const ctx = this.#context();
    const event = this.#findEvent('door', (on) => !on.block && sameDoor(on.door, map.id, door.to), ctx);
    if (event) this.#queue(event, ctx);
  }

  /* a gate (registered by install): doors that are closed, and door events that keep the player out */
  gate(step) {
    if (!step.door || !this.library || this.busy) return false;
    const to = step.door.to;
    for (const rule of this.library.doors) {
      if (rule.map === step.map && rule.to === to && !this.test(rule.if)) return true;
    }
    const ctx = this.#context();
    const event = this.#findEvent('door', (on) => !!on.block && sameDoor(on.door, step.map, to), ctx);
    if (!event) return false;
    this.#play((c) => this.#runEvent(event, c), ctx);
    return true;
  }

  #onInteract({ map, tx, ty, target, player }) {
    if (this.busy || !this.library || !target) return;
    if (target.kind === 'person') this.#talk(target.person, player, map);
    else if (target.kind === 'prop' || target.kind === 'building') this.#use(target, map);
    else if (target.kind === 'tile') this.#useTile(target, map, tx, ty);
  }

  #talk(person, player, map) {
    const def = this.people.contentOf(person);
    const place = def ? this.people.placement(def) : null;
    const self = place ? { ...place.def, lines: place.lines, service: place.service } : person.def;
    const ctx = this.#context({
      self, person, obj: self,
      target: { kind: 'person', person, map: map.id, x: person.tx, y: person.ty, id: self.id || person.id },
    });
    this.#visit(ctx, `talk:${self.id || person.id}`, null);
    const event = this.#findEvent('talk', (on) => listHas(on.talk, self.id), ctx);
    const hasWords = event || (self.lines && self.lines.length) || self.service;
    if (!hasWords) return;

    person.dir = OPPOSITE[player.dir];
    person.talking = true;
    this.#play(async (c) => {
      if (event) {
        const signal = await this.#runEvent(event, c);
        if (signal !== STOP && event.thenService !== false && self.service) await this.runScript(self.service, c);
        return;
      }
      await this.#smallTalk(self, c);
      if (self.service && !this.ended(c)) await this.runScript(self.service, c);
    }, ctx, () => {
      person.talking = false;
    });
  }

  async #smallTalk(self, ctx) {
    const lines = self.lines || [];
    if (!lines.length) return;
    /* lines from the map description of the current game: [name, text] pairs */
    if (Array.isArray(lines[0])) {
      for (const [name, text] of lines) {
        await this.line({ name, portrait: this.#portrait(self.look), color: this.library.lookColors[self.look] || this.library.defaultColor }, text);
        if (this.ended(ctx)) return;
      }
      return;
    }
    const speaker = this.speaker('self', ctx);
    const talks = this.saved.talks;
    const start = lines.length > LINES_PER_TALK ? ((talks[self.id] || 0) * LINES_PER_TALK) % lines.length : 0;
    if (lines.length > LINES_PER_TALK) talks[self.id] = (talks[self.id] || 0) + 1;
    for (let i = 0; i < Math.min(LINES_PER_TALK, lines.length); i++) {
      await this.line(speaker, this.text(lines[(start + i) % lines.length], null, ctx));
      if (this.ended(ctx)) return;
    }
  }

  #use(target, map) {
    const { type, object } = target;
    const facts = this.library.objectAt(map.id, object.x, object.y);
    const name = typeName(type);
    const own = facts && (!facts.type || facts.type === type) ? facts : null;
    const obj = { ...object, ...own, typeName: name, vowel: /^[aeiou]/i.test(name) };
    const ctx = this.#context({ target: { kind: target.kind, type, map: map.id, x: object.x, y: object.y, object }, obj });
    const key = this.library.handlerKey(type);
    const event = this.#findEvent('interact', (on) => listHas(on.interact, type) && (!on.map || on.map === map.id), ctx);
    const handlers = this.library.handlers(type) || this.library.handlers('*');
    this.#offer(event, handlers, ctx, map.id, key, `${map.id}:${object.x}:${object.y}`);
  }

  #useTile(target, map, tx, ty) {
    const tile = target.tile;
    const ctx = this.#context({ target: { kind: 'tile', type: tile, map: map.id, x: tx, y: ty }, obj: { type: tile, tile } });
    const event = this.#findEvent('tile', (on) => on.tile === tile && (!on.map || on.map === map.id), ctx);
    const handlers = this.library.handlers(`tile_${tile}`);
    this.#offer(event, handlers, ctx, map.id, `tile_${tile}`, `${map.id}:${tx}:${ty}`);
  }

  /* an event for the thing first; if there is none (or it passes), the first handler that fits */
  #offer(event, handlers, ctx, mapId, typeKey, objectKey) {
    const fits = (handler) => (!handler.map || handler.map === mapId) && this.test(handler.if, ctx);
    if (!event && !(handlers && handlers.some(fits))) return;
    this.#visit(ctx, `type:${typeKey}`, `object:${objectKey}`);
    this.#play(async (c) => {
      if (event && (await this.#runEvent(event, c)) !== PASS) return;
      for (const handler of handlers || []) {
        if (!fits(handler)) continue;
        if ((await this.block(handler.then, c)) !== PASS) return;
      }
    }, ctx);
  }

  /* how often this thing was used before: cycles pick their arm from it */
  #visit(ctx, typeKey, objectKey) {
    const visits = this.saved.visits;
    ctx.visitKey = typeKey;
    ctx.visit = { type: visits[typeKey] || 0, object: objectKey ? visits[objectKey] || 0 : visits[typeKey] || 0 };
    visits[typeKey] = ctx.visit.type + 1;
    if (objectKey) visits[objectKey] = ctx.visit.object + 1;
  }
}

/* the first key of a command, a condition or a value says what it is; { ext: name } is "ext:<name>" */
export function verbOf(object) {
  if ('ext' in object) return `ext:${object.ext}`;
  for (const key in object) return key;
  return '';
}

function listHas(list, id) {
  return Array.isArray(list) ? list.includes(id) : list === id;
}

function inBox(n, range) {
  return Array.isArray(range) ? n >= range[0] && n <= range[1] : n === range;
}

function sameDoor(door, map, to) {
  return !!door && (!door.map || door.map === map) && (!door.to || door.to === to);
}

function matchTrigger(trigger, spec, payload) {
  if (trigger === 'newGame') return true;
  if (trigger === 'enter') return spec === payload.map;
  if (trigger === 'flag') return spec === payload.name;
  if (spec && typeof spec === 'object') return Object.entries(spec).every(([field, wanted]) => payload[field] === wanted);
  return spec === true || spec === payload;
}

export { CONDITIONS, VALUES, COMMANDS };
