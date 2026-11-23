/*
 * game/world/wild.js
 * Job: the wild hontori that live on Hontori's outdoor maps (content `wild` per map, the shared
 * `wildHabitats`; src/encounters.js). Each map keeps a few in places that suit them (world/Habitat.js);
 * they wander, notice the kid, drift closer, and a touch starts a wild battle through the story's
 * battle command. They stay where they were when the player comes back during a session. Now and
 * then one out of season (a dark one at noon) fades away and a fitting one takes its place. A
 * hidden one is a faint shimmer until the kid carries the mirror; a carried lantern at night draws
 * dark ones closer. They leave the kid alone while a script runs, right after a map change or a
 * battle, while the party is empty, and while the kid rides.
 *
 * Public API:
 *   class Wild
 *     constructor(game)
 *     enter(world, stage, unstage)   map:enter: this map's wild ones into the picture
 *     update(dt, world)              registry kind "world.layer" update: move them, start a meeting
 *     list                           the wild ones on the current map (debug and tests)
 *     respawn()                      a fresh set for the hour and weather (after a rest)
 *     lights(world)                  each world step: at night outdoors a faint glow on every wild one
 *                                    in sight, and the soft warm circle of the carried lantern around
 *                                    the kid (src/encounters.js, src/items.js), through world.addLight
 *
 * Words it uses (content text ids, optional): TIRED, said by the companion when the whole party
 * is too tired to fight; without the text the wild one simply turns home.
 */

import { Habitat } from '../../world/Habitat.js';
import { Roamer } from '../../world/Roamer.js';
import { folders, merged, itemsOf, storyOf } from './common.js';

/* Hontori's look and feel for the wild ones (src/encounters.js) */
const SEE_HIDDEN = 'mirror';
const WARM_BUILDINGS = ['house_player', 'tavern'];
const TIRED = 'shared.wild.tired';
const ENTER_GRACE = 1.5;
const AFTER_MEETING_GRACE = 3;
const RESPAWN_SECONDS = [18, 38];
const SEASON_SECONDS = 8;
const OUT_OF_SEASON = 0.12;
const SEASON_RESPAWN = [4, 10];
const TIRED_AGAIN_SECONDS = 20;
const AWAY_FROM_PLAYER = 8;
const APART = 5;
const MIN_SCORE = 0.35;
const MAX_OF_A_KIND = 2;
const BIOME_NEAR = 4;
const NIGHT = [19.5, 5.5];
const WILD_LIGHT = { r: 18, color: '#9ec8ff', flicker: true };
const LANTERN_LIGHT = { r: 64, color: '#ffd890', flicker: true, soft: true };
/* the lantern is held at the kid's chest, above the feet */
const LANTERN_ABOVE_FEET = 12;

export class Wild {
  list = [];

  #game;
  #table = null;
  #kinds = null;
  #byMap = new Map();
  #habitat = null;
  #place = null;
  #world = null;
  #stage = null;
  #unstage = null;
  #handles = new Map();
  #timers = [];
  #grace = 0;
  #season = SEASON_SECONDS;
  #uid = 1;
  #meeting = false;
  #tiredAt = -Infinity;
  #glows = new WeakMap();
  #lantern = { x: 0, y: 0, ...LANTERN_LIGHT };

  constructor(game) {
    this.#game = game;
  }

  #isNight(hour) {
    const [from, to] = this.#habitats().night || NIGHT;
    return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
  }

  lights(world) {
    if (!world || typeof world.addLight !== 'function' || !world.map || world.map.indoor) return;
    if (!this.#isNight(world.env.time)) return;
    if (world === this.#world) {
      for (const roamer of this.list) {
        if (roamer.alpha <= 0 || (roamer.hidden && !roamer.canSee)) continue;
        let glow = this.#glows.get(roamer);
        if (!glow) this.#glows.set(roamer, (glow = { x: 0, y: 0, ...WILD_LIGHT }));
        glow.x = roamer.x;
        glow.y = roamer.y;
        world.addLight(glow);
      }
    }
    const lantern = this.#habitats().lantern;
    const items = itemsOf(this.#game);
    if (!lantern || !items || !items.inventory || !items.inventory.has(lantern.item)) return;
    this.#lantern.x = world.player.x;
    this.#lantern.y = world.player.y - LANTERN_ABOVE_FEET;
    world.addLight(this.#lantern);
  }

  #habitats() {
    if (this.#table) return this.#table;
    let table = null;
    for (const folder of folders(this.#game)) if (folder && folder.wildHabitats) table = folder.wildHabitats;
    const known = new Set();
    for (const folder of folders(this.#game)) for (const kind of (folder && folder.kinds) || []) if (kind && kind.kind) known.add(kind.kind);
    const habitats = {};
    for (const [kind, habit] of Object.entries((table && table.habitats) || {})) if (!known.size || known.has(kind)) habitats[kind] = habit;
    this.#table = { ...(table || {}), habitats, warmBuildings: WARM_BUILDINGS };
    return this.#table;
  }

  enter(world, stage, unstage) {
    this.#world = world;
    this.#stage = stage;
    this.#unstage = unstage;
    this.#handles.clear();
    this.#timers = [];
    this.#grace = ENTER_GRACE;
    this.#meeting = false;
    this.list = [];
    this.#habitat = null;
    const place = merged(this.#game, 'wild')[world.map.id];
    if (world.map.indoor || !place) return;
    const table = this.#habitats();
    this.#place = place;
    this.#habitat = new Habitat(world.map, this.#game.art, table, place);
    if (!this.#byMap.has(world.map.id)) this.#byMap.set(world.map.id, []);
    this.list = this.#byMap.get(world.map.id);
    for (const roamer of this.list) roamer.settle();
    while (this.list.length < this.#wanted()) if (!this.#spawn()) break;
    for (const roamer of this.list) {
      roamer.show();
      this.#handles.set(roamer, stage(roamer));
    }
  }

  respawn() {
    if (!this.#habitat || !this.#world) return;
    for (const roamer of this.list) this.#unstage(this.#handles.get(roamer));
    this.#handles.clear();
    this.list.length = 0;
    this.#timers = [];
    while (this.list.length < this.#wanted()) if (!this.#spawn(true)) break;
  }

  #wanted() {
    const defaults = this.#habitats().defaults || {};
    const town = (this.#world.map.buildings || []).length > 0;
    return this.#place.count ?? (town ? defaults.countTown ?? 4 : defaults.count ?? 5);
  }

  /* a lantern carried at night draws some kinds closer */
  #factor(env) {
    const lantern = this.#habitats().lantern;
    const items = itemsOf(this.#game);
    if (!lantern || !items || !items.inventory || !this.#habitat.isNight(env.time) || !items.inventory.has(lantern.item)) return null;
    return (kind) => (lantern.mul && lantern.mul[kind]) || 1;
  }

  #spawn(staged = false) {
    const world = this.#world;
    const habitat = this.#habitat;
    const tiles = habitat.candidates();
    if (!tiles.length) return null;
    const player = world.player;
    const factor = this.#factor(world.env);
    const hidden = this.#place.hidden ?? (this.#habitats().defaults || {}).hidden ?? 0;
    for (let tries = 0; tries < 40; tries++) {
      const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
      if (Math.abs(x - player.tx) + Math.abs(y - player.ty) < AWAY_FROM_PLAYER) continue;
      if (this.list.some((r) => Math.abs(r.home[0] - x) + Math.abs(r.home[1] - y) < APART)) continue;
      const found = habitat.pick(x, y, world.env, factor);
      if (found.score < MIN_SCORE) continue;
      /* keep the mix varied */
      if (tries < 30 && this.list.filter((r) => r.kind === found.kind).length >= MAX_OF_A_KIND) continue;
      const roamer = new Roamer(`wild:${this.#uid++}`, { kind: found.kind, level: found.level, home: [x, y], hidden: Math.random() < hidden });
      this.list.push(roamer);
      if (staged && this.#stage) this.#handles.set(roamer, this.#stage(roamer));
      return roamer;
    }
    return null;
  }

  update(dt, world) {
    if (!this.#habitat || world !== this.#world) return;
    this.#grace = Math.max(0, this.#grace - dt);
    for (let i = this.#timers.length - 1; i >= 0; i--) {
      this.#timers[i] -= dt;
      if (this.#timers[i] > 0) continue;
      this.#timers.splice(i, 1);
      this.#spawn(true);
    }
    this.#outOfSeason(dt, world);
    const ctx = this.#context(world);
    let met = null;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const roamer = this.list[i];
      const touching = roamer.update(dt, ctx);
      if (roamer.gone) {
        this.list.splice(i, 1);
        this.#unstage(this.#handles.get(roamer));
        this.#handles.delete(roamer);
        continue;
      }
      if (touching && !met) met = roamer;
    }
    if (met) this.#meet(met, world);
  }

  #outOfSeason(dt, world) {
    this.#season -= dt;
    if (this.#season > 0 || !this.list.length) return;
    this.#season = SEASON_SECONDS;
    const roamer = this.list[Math.floor(Math.random() * this.list.length)];
    if (roamer.state === 'chase' || roamer.alpha < 1) return;
    const weights = this.#habitat.weights(roamer.home[0], roamer.home[1], world.env, this.#factor(world.env));
    const best = Math.max(0, ...Object.values(weights));
    if ((weights[roamer.kind] || 0) >= best * OUT_OF_SEASON) return;
    roamer.leave();
    this.#timers.push(between(SEASON_RESPAWN));
  }

  #context(world) {
    const game = this.#game;
    const story = storyOf(game);
    const items = itemsOf(game);
    const ride = game.registry.get('service', 'ride');
    let riding = false;
    try {
      riding = !!(ride && typeof ride.riding === 'function' && ride.riding());
    } catch (error) {
      riding = false;
    }
    const party = items && items.party ? items.party.size() : 0;
    return {
      player: world.player,
      calm: this.#meeting || this.#grace > 0 || !story || story.busy || !party || riding || game.scenes.top !== world,
      canSee: !!(items && items.inventory && items.inventory.has(SEE_HIDDEN)),
      isFree: (tx, ty) => world.map.inside(tx, ty) && !world.isBlocked(tx, ty),
      sound: (name) => {
        try {
          game.sound.play(name);
        } catch (error) {
          /* a missing sound never stops the game */
        }
      },
      emit: (kind, x, y, n) => world.effect(kind, x, y, n),
    };
  }

  async #meet(roamer, world) {
    const game = this.#game;
    const story = storyOf(game);
    const items = itemsOf(game);
    if (!story || story.busy) return;
    const members = items && items.party ? items.party.members() : [];
    if (members.length && members.every((m) => m.hp != null && m.hp <= 0)) {
      this.#tooTired(roamer, story, world);
      return;
    }
    this.#meeting = true;
    try {
      await story.play([{ battle: { wild: { kind: roamer.kind, level: roamer.level }, biome: this.#biome(world) } }]);
    } catch (error) {
      console.warn('Wild: the meeting failed', error);
    }
    this.#meeting = false;
    this.#met(roamer);
  }

  #tooTired(roamer, story, world) {
    for (const other of this.list) other.settle();
    this.#grace = AFTER_MEETING_GRACE;
    const now = world.env.t || 0;
    if (now - this.#tiredAt < TIRED_AGAIN_SECONDS || !story.strings || !story.strings.has(TIRED)) return;
    this.#tiredAt = now;
    story.play([{ say: TIRED, who: 'companion' }]);
  }

  /* the wild one met is gone; another comes later, and the rest calm down for a moment */
  #met(roamer) {
    const at = this.list.indexOf(roamer);
    if (at >= 0) {
      this.list.splice(at, 1);
      this.#unstage(this.#handles.get(roamer));
      this.#handles.delete(roamer);
    }
    this.#timers.push(between(RESPAWN_SECONDS));
    this.#grace = AFTER_MEETING_GRACE;
    for (const other of this.list) other.settle();
  }

  /* what kind of place the battle is in, from the tiles and trees around the player */
  #biome(world) {
    const { map, player } = world;
    let water = 0;
    let trees = 0;
    for (let dy = -BIOME_NEAR; dy <= BIOME_NEAR; dy++) {
      for (let dx = -BIOME_NEAR; dx <= BIOME_NEAR; dx++) if (map.tileAt(player.tx + dx, player.ty + dy) === 'water') water++;
    }
    for (const prop of map.props || []) {
      if (/tree|pine/.test(prop.type) && Math.abs(prop.x - player.tx) < 6 && Math.abs(prop.y - player.ty) < 6) trees++;
    }
    return water > 6 ? 'river' : trees > 4 ? 'forest' : 'meadow';
  }
}

function between([low, high]) {
  return low + Math.random() * (high - low);
}
