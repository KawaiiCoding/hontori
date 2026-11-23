/*
 * WorldScene.js
 * Job: the scene where the player's character walks a map. It turns input into steps, runs the people, the
 * companion and the air, follows with the camera, and changes map through doors. It holds no
 * story, dialog, item or battle rules: those systems listen to its events.
 *
 * Public API:
 *   enter({ map, tx, ty, dir, time, weather })   all optional; missing values come from the map
 *   env, map, player, people, companion, camera  the live world (read by systems and debug tools);
 *                                                companion is null in a game without one
 *   isBlocked(tx, ty)                            solid ground, a thing or a person stands there
 *   goTo(mapId, tx, ty, dir)                     change map behind a short fade
 *   effect(kind, x, y, count)                    particles at a point in map pixels; kind: one the art
 *                                                provider's particles know ('dust', 'sparkle', 'smoke' ...)
 *   addPerson(def)                               someone new stands on this map until it is left (a
 *                                                person description, INTERFACES.md section 6); the Person
 *   removePerson(person)                         take out a person added that way; true if removed
 *   addActor(entity)                             an entity (world/Entity.js: depth, bounds, visible,
 *                                                draw) is drawn in depth order with everyone on this
 *                                                map until it is removed or the map is left; it
 *                                                blocks nobody and is never talked to. Returns it
 *   removeActor(entity)                          take it out again; true if it was there
 *   addLight(light)                              { x, y, r, color, flicker, soft } in map pixels: one more
 *                                                glow for the lighting pass. The list is emptied at the
 *                                                start of each world step and on a map change, so a
 *                                                system adds its lights every step (a layer's update);
 *                                                while the world is paused the last ones stay lit
 *   pointOf(typeOrTile)                          the middle of the first prop or building of that type on
 *                                                the map, in map pixels ({ x, y }), or null
 *   WORLD_SAVE                                   the defaults of the "world" save section
 *   savedPlace(game)                             enter() parameters that continue the loaded journey
 *
 * Events it emits on game.bus:
 *   "map:enter"       { map, scene }                      after a map is set up
 *   "world:tick"      { scene, env, map }                 once a second while the world is visible
 *   "player:step"     { map, tx, ty, player }             the player arrived on a tile
 *   "player:bump"     { map, tx, ty, player }             the player walked into something
 *   "door:enter"      { map, door, player }               the player stepped onto a door
 *   "world:interact"  { map, tx, ty, target, player }     the action button or a tap on something;
 *                     target: { kind: 'person', person } | { kind: 'prop' | 'building', type, object }
 *                             | { kind: 'tile', tile }
 *
 * Registry kinds it reads:
 *   "map"    id -> map description
 *   "gate"   id -> function({ map, tx, ty, door, player }) returning true to refuse the player's step
 *            onto that tile (a guarded door, a blocked road). Asked once per attempted step.
 *   "world.layer"   id -> { update(dt, world), draw(ctx, world) }   both optional. update runs each
 *            fixed step while the world is on top; draw paints in view pixels after the particles
 *            (a compass arrow, a marker). Every call is guarded: a layer that throws is skipped.
 */

import { Scene } from '../core/Scene.js';
import { Camera } from '../core/Camera.js';
import { Fade } from '../core/Fade.js';
import { TILE, UP, DIR_STEP, dirOfStep } from '../core/units.js';
import { Environment } from './Environment.js';
import { TileMap } from './TileMap.js';
import { MapView } from './MapView.js';
import { Atmosphere } from './Atmosphere.js';
import { Player } from './Player.js';
import { Person } from './Person.js';
import { Companion } from './Companion.js';
import { findPath } from './PathFinder.js';

export const WORLD_SAVE = { map: null, tx: 0, ty: 0, dir: 0, time: 12, weather: 'clear' };

/* a journey that has not been anywhere yet starts where enter() starts without parameters */
export function savedPlace(game) {
  const { map, tx, ty, dir, time, weather } = game.save.state.world;
  return game.registry.has('map', map) ? { map, tx, ty, dir, time, weather } : {};
}

const DOOR_FADE_MS = 600;
/* the camera looks at the player's body, not the feet */
const LOOK_ABOVE_FEET = 8;
const DUST_PER_SECOND = 5;
const MARK_SECONDS = 0.5;
const MARK_COLOR = '#ffe6a0';

export class WorldScene extends Scene {
  hud = true;
  env = new Environment();
  camera = new Camera();
  player;
  companion;
  map = null;
  people = [];

  #view = null;
  #atmosphere;
  #fade = new Fade();
  #actors = [];
  #lights = [];
  #extraLights = [];
  #extraActors = new Set();
  #route = null;
  #mark = { tx: 0, ty: 0, left: 0 };
  #step = { map: '', tx: 0, ty: 0, door: null, player: null };
  #stopSaving = null;
  #sinceTick = 0;
  #added = new Set();
  #failedLayers = new Set();
  #isBlocked = (tx, ty) => this.isBlocked(tx, ty);
  #canStepOn = (tx, ty) => this.#allowsStep(tx, ty);
  #canPathOver = (tx, ty) => !this.isBlocked(tx, ty) || !!this.map.doorAt(tx, ty);

  constructor(game) {
    super(game);
    this.#atmosphere = new Atmosphere(game.art);
    this.player = new Player(game.config.playerLook);
    this.companion = game.config.companion ? new Companion(game.config.companion) : null;
    this.#step.player = this.player;
  }

  enter({ map, tx, ty, dir, time, weather } = {}) {
    this.#stopSaving = this.game.bus.on('save:before', (state) => this.#save(state.world));
    this.#enterMap(map || this.game.config.firstMap, tx, ty, dir);
    const start = this.map.start || {};
    this.env.setTime(time ?? start.time ?? this.env.time);
    this.env.setWeather(weather ?? start.weather ?? this.env.weather);
    this.#followSchedules(true);
    /* the companion first appears a step to the side of the player */
    if (this.companion) this.companion.joinAt(this.player.x + 14, this.player.y);
  }

  exit() {
    this.#stopSaving();
  }

  pause() {
    this.#route = null;
    this.game.input.clear();
  }

  resize(width, height) {
    this.camera.resize(width, height);
    this.#atmosphere.resize(width, height);
    if (this.map) this.camera.snap(this.player.x, this.player.y - LOOK_ABOVE_FEET);
  }

  update(dt) {
    this.#extraLights.length = 0;
    const changingMap = this.#fade.active;
    this.env.advance(dt, !changingMap);
    if (!changingMap) this.#control(dt);
    for (const person of this.people) person.update(dt);
    this.#followSchedules(false);
    this.#runCompanion(dt);
    this.#breathe(dt);
    this.camera.follow(this.player.x, this.player.y - LOOK_ABOVE_FEET, dt);
    this.#fade.update(dt);
    for (const layer of this.game.registry.all('world.layer')) {
      if (!layer.update || this.#failedLayers.has(layer)) continue;
      try {
        layer.update(dt, this);
      } catch (error) {
        this.#layerFailed(layer, error);
      }
    }
  }

  /* a layer that throws is reported once, never again, and never stops the frame */
  #layerFailed(layer, error) {
    if (this.#failedLayers.has(layer)) return;
    this.#failedLayers.add(layer);
    console.warn('WorldScene: a world layer failed', error);
  }

  #runCompanion(dt) {
    const companion = this.companion;
    if (!companion || !companion.visible) return;
    companion.update(dt, this.player, this.#isBlocked);
    if (companion.shedding && companion.sheds) {
      this.#atmosphere.emit(companion.sheds, companion.light.x + (Math.random() - 0.5) * 8, companion.light.y, 1);
    }
  }

  ambient(dt) {
    this.env.advance(dt, false);
    this.#breathe(dt);
  }

  draw(ctx) {
    const { camera, env } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, camera.width, camera.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    this.#view.draw(ctx, camera, env, this.#actors, this.player);
    this.#atmosphere.drawLife(ctx, env);
    ctx.restore();

    this.#atmosphere.drawSky(ctx, camera, env, this.#collectLights());
    this.#drawMark(ctx);
    this.#atmosphere.drawParticles(ctx, camera);
    for (const layer of this.game.registry.all('world.layer')) {
      if (!layer.draw || this.#failedLayers.has(layer)) continue;
      try {
        layer.draw(ctx, this);
      } catch (error) {
        this.#layerFailed(layer, error);
      }
    }
    this.#fade.draw(ctx, camera.width, camera.height);
  }

  effect(kind, x, y, count = 1) {
    try {
      this.#atmosphere.emit(kind, x, y, count);
    } catch (error) {
      console.warn(`WorldScene: no effect "${kind}"`, error);
    }
  }

  addPerson(def) {
    const person = new Person(def, this.people.length);
    this.#added.add(person);
    this.people.push(person);
    /* people are drawn before the player where depths are equal */
    this.#actors.splice(Math.max(0, this.#actors.indexOf(this.player)), 0, person);
    return person;
  }

  removePerson(person) {
    const at = this.people.indexOf(person);
    if (at < 0 || !this.#added.has(person)) return false;
    this.people.splice(at, 1);
    const drawn = this.#actors.indexOf(person);
    if (drawn >= 0) this.#actors.splice(drawn, 1);
    this.#added.delete(person);
    return true;
  }

  addActor(entity) {
    if (!entity || this.#extraActors.has(entity)) return entity;
    this.#extraActors.add(entity);
    /* drawn before the player where depths are equal, like added people */
    this.#actors.splice(Math.max(0, this.#actors.indexOf(this.player)), 0, entity);
    return entity;
  }

  removeActor(entity) {
    if (!this.#extraActors.delete(entity)) return false;
    const drawn = this.#actors.indexOf(entity);
    if (drawn >= 0) this.#actors.splice(drawn, 1);
    return true;
  }

  addLight(light) {
    if (light && Number.isFinite(light.x) && Number.isFinite(light.y)) this.#extraLights.push(light);
  }

  pointOf(type) {
    const map = this.map;
    const description = map && map.description;
    if (!description) return null;
    for (const [list, info] of [[description.props, 'propInfo'], [description.buildings, 'buildingInfo']]) {
      const found = (list || []).find((thing) => thing.type === type);
      if (!found) continue;
      const size = this.game.art[info](type) || {};
      return { x: (found.x + (size.fw || 1) / 2) * TILE, y: (found.y + (size.fh || 1) / 2) * TILE };
    }
    return null;
  }

  isBlocked(tx, ty) {
    if (this.map.solidAt(tx, ty)) return true;
    for (const person of this.people) if (!person.away && person.tx === tx && person.ty === ty) return true;
    return false;
  }

  goTo(mapId, tx, ty, dir) {
    if (!this.game.registry.has('map', mapId)) {
      console.warn(`WorldScene: there is no map "${mapId}"`);
      return;
    }
    this.#route = null;
    this.#fade.start(DOOR_FADE_MS, () => {
      this.#enterMap(mapId, tx, ty, dir);
      if (this.companion) this.companion.joinAt(this.player.x, this.player.y);
      this.game.save.commit();
    });
  }

  /* ---------- map ---------- */

  #enterMap(id, tx, ty, dir) {
    const { game, player } = this;
    const description = game.registry.get('map', id);
    if (!description) throw new Error(`WorldScene: there is no map "${id}"`);
    const map = new TileMap(description, game.art);
    this.map = map;
    this.#view = new MapView(map, game.art, game.assets);
    this.env.indoor = map.indoor;
    this.people = map.people.map((def, index) => new Person(def, index));
    this.#added.clear();
    this.#extraActors.clear();
    this.#extraLights.length = 0;
    this.#actors = [...this.people, player];
    if (this.companion) this.#actors.push(this.companion);
    /* a target on water or inside a thing (a stale save, a wrong door) becomes the nearest open tile */
    const wantX = tx ?? map.spawn.x;
    const wantY = ty ?? map.spawn.y;
    const [startX, startY] = map.openNear(wantX, wantY) || [wantX, wantY];
    if (startX !== wantX || startY !== wantY) console.warn(`WorldScene: ${id} ${wantX},${wantY} cannot be stood on; using ${startX},${startY}`);
    player.placeAt(startX, startY, dir ?? map.spawn.dir);
    player.forgetTrail();
    this.camera.setBounds(map.pixelWidth, map.pixelHeight);
    this.camera.snap(player.x, player.y - LOOK_ABOVE_FEET);
    this.#atmosphere.enterMap(description);
    this.#route = null;
    this.#followSchedules(true);
    game.bus.emit('map:enter', { map, scene: this });
  }

  #followSchedules(force) {
    const { player, env } = this;
    for (const person of this.people) person.followSchedule(env.time, player.tx, player.ty, env.indoor, force);
  }

  #breathe(dt) {
    this.#atmosphere.update(dt, this.env, this.player.x, this.player.y);
    if (this.#mark.left > 0) this.#mark.left -= dt;
    this.#sinceTick += dt;
    if (this.#sinceTick < 1) return;
    this.#sinceTick = 0;
    this.game.bus.emit('world:tick', { scene: this, env: this.env, map: this.map });
  }

  #save(world) {
    world.map = this.map.id;
    world.tx = this.player.tx;
    world.ty = this.player.ty;
    world.dir = this.player.dir;
    world.time = this.env.time;
    world.weather = this.env.weather;
  }

  /* ---------- the player ---------- */

  #control(dt) {
    const { player } = this;
    const input = this.game.input;
    const tap = input.takeTap();
    if (tap) this.#planRoute(tap);
    const act = input.takeAction();

    let dx = input.dx;
    let dy = input.dy;
    let run = input.run;
    if (dx || dy) {
      this.#route = null;
    } else if (this.#route) {
      run = this.#route.run;
      [dx, dy] = this.#routeStep();
    }

    if (!player.moving) {
      if (act) this.#interactAt(player.tx + DIR_STEP[player.dir][0], player.ty + DIR_STEP[player.dir][1]);
      else if (dx || dy) this.#tryStep(dx, dy, 0);
    }
    if (!player.moving) return;

    const left = player.advance(dt, run);
    if (left >= 0) this.#arrived(dx, dy, left);
    else if (!this.env.indoor && Math.random() < dt * DUST_PER_SECOND) this.#atmosphere.emit('dust', player.x, player.y, 1);
  }

  #tryStep(dx, dy, carry) {
    const { player, map } = this;
    if (player.tryStep(dx, dy, carry, this.#canStepOn)) return;
    this.#route = null;
    this.game.bus.emit('player:bump', { map, tx: player.tx, ty: player.ty, player });
  }

  #arrived(dx, dy, left) {
    const { player, map } = this;
    this.game.bus.emit('player:step', { map, tx: player.tx, ty: player.ty, player });
    const door = map.doorAt(player.tx, player.ty);
    if (door) {
      this.game.bus.emit('door:enter', { map, door, player });
      this.goTo(door.to, door.tx, door.ty, door.dir);
    } else if (dx || dy) this.#tryStep(dx, dy, left);
  }

  /* a door tile may be stepped on even where the wall around it is solid; gates may refuse any step */
  #allowsStep(tx, ty) {
    const door = this.map.doorAt(tx, ty);
    if (!door && this.isBlocked(tx, ty)) return false;
    const step = this.#step;
    step.map = this.map.id;
    step.tx = tx;
    step.ty = ty;
    step.door = door;
    for (const gate of this.game.registry.all('gate')) {
      try {
        if (gate(step)) return false;
      } catch (error) {
        console.warn('WorldScene: a gate failed', error);
      }
    }
    return true;
  }

  /* ---------- tap to move ---------- */

  #planRoute(tap) {
    const { player, map, camera } = this;
    const point = this.game.screen.toView(tap.x, tap.y);
    const tx = Math.floor((point.x + camera.x) / TILE);
    const ty = Math.floor((point.y + camera.y) / TILE);
    if (!map.inside(tx, ty)) return;

    const open = this.#canPathOver(tx, ty);
    const goals = open ? [[tx, ty]] : this.#tilesBeside(tx, ty);
    const path = findPath(map.width, map.height, player.tx, player.ty, goals, this.#canPathOver);
    if (!path) return;
    /* a tap on something solid walks up to it and then uses it */
    this.#route = { path, use: open ? null : [tx, ty], run: tap.double };
    this.#mark.tx = tx;
    this.#mark.ty = ty;
    this.#mark.left = MARK_SECONDS;
  }

  #tilesBeside(tx, ty) {
    const { player } = this;
    const beside = [];
    for (const [dx, dy] of DIR_STEP) {
      const x = tx + dx;
      const y = ty + dy;
      const here = x === player.tx && y === player.ty;
      if (this.map.inside(x, y) && (here || !this.isBlocked(x, y))) beside.push([x, y]);
    }
    return beside;
  }

  /* the next step along the route as [dx, dy]; at its end, use what was tapped */
  #routeStep() {
    const { player } = this;
    const route = this.#route;
    const path = route.path;
    while (path.length && path[0][0] === player.tx && path[0][1] === player.ty) path.shift();
    if (path.length) {
      const dx = path[0][0] - player.tx;
      const dy = path[0][1] - player.ty;
      if (Math.abs(dx) + Math.abs(dy) === 1) return [dx, dy];
      this.#route = null;
      return [0, 0];
    }
    if (player.moving) return [0, 0];
    this.#route = null;
    if (route.use) {
      const [tx, ty] = route.use;
      player.dir = dirOfStep(tx - player.tx, ty - player.ty);
      this.#interactAt(tx, ty);
    }
    return [0, 0];
  }

  #drawMark(ctx) {
    const mark = this.#mark;
    if (mark.left <= 0) return;
    const grow = (MARK_SECONDS - mark.left) * 4;
    ctx.globalAlpha = Math.min(1, mark.left * 2);
    ctx.strokeStyle = MARK_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mark.tx * TILE + 2 + grow - this.camera.x, mark.ty * TILE + 2 + grow - this.camera.y,
      12 - grow * 2, 12 - grow * 2,
    );
    ctx.globalAlpha = 1;
  }

  /* ---------- using things ---------- */

  #interactAt(tx, ty) {
    const { player, map } = this;
    this.game.bus.emit('world:interact', { map, tx, ty, target: this.#targetAt(tx, ty), player });
  }

  #targetAt(tx, ty) {
    for (const person of this.people) {
      if (!person.away && person.tx === tx && person.ty === ty) return { kind: 'person', person };
    }
    /* things on a wall hang one tile above the floor edge the player can reach */
    const thing = this.map.thingAt(tx, ty) || (this.player.dir === UP ? this.map.thingAt(tx, ty - 1) : null);
    return thing || { kind: 'tile', tile: this.map.tileAt(tx, ty) };
  }

  /* ---------- light ---------- */

  /* fixed lights first and always in the same order, so each lamp keeps its own flicker */
  #collectLights() {
    const lights = this.#lights;
    lights.length = 0;
    for (const light of this.#view.lights) lights.push(light);
    if (this.companion && this.companion.visible) lights.push(this.companion.light);
    for (const light of this.#atmosphere.lifeLights()) lights.push(light);
    for (const light of this.#extraLights) lights.push(light);
    return lights;
  }
}
