/*
 * game/world/index.js
 * Job: Hontori's world lane: what lives in the world beyond the map data. Content-only people on
 * their maps, the home things lying on the floor (take or leave), foraging, the push puzzles (the
 * Root Maze), the wild hontori that roam and start battles, and the fishers' lines and bobbers.
 *
 * Public API:
 *   install(game)   in main.js build, after the maps and the content are registered and before the
 *                   stand-ins (installStandIns, installPending), so the real handlers win.
 *                   Its "world:interact" listener is added here, before the story system starts, so a
 *                   thing lying on a tile is taken before the story uses the tile or the furniture.
 *
 * What it registers:
 *   story.command   "forage"   { forage: tableId }   maybe find something; else acts as `pass`
 *                   "puzzle"   { puzzle: id, do: 'reset' }
 *                   "pickup"   { pickup: itemId }    the take-or-leave choice for a thing in the world
 *   gate            "world:pickups"   nobody walks onto a thing lying there (a tap route uses it)
 *                   "world:puzzles"   leaf piles are pushed; the root gate is shut until solved
 *   world.layer     "world:things"    steps the wild ones, the gliding piles, the fishers; adds the
 *                                     lights of the moss pads, the things on the floor, the wild ones
 *                                     at night and the carried lantern (world.addLight)
 *   system          "world:things"    places everything on map:enter; refreshes the things lying
 *                                     around on inventory:change, story:flag and time:day; a fresh
 *                                     set of wild ones on time:rest
 *   service         "puzzles"  { solved(id), reset(id) }
 *                   "wild"     the Wild system (list of the wild ones on the map, respawn())
 */

import { addToWorld, removeFromWorld } from '../../world/Stage.js';
import { Painted } from '../../world/Painted.js';
import { addContentPeople } from './people.js';
import { fishersOnEnter } from './fishers.js';
import { Pickups } from './pickups.js';
import { forageCommand } from './forage.js';
import { Puzzles } from './puzzles.js';
import { Wild } from './wild.js';
import { installSchools } from './schools.js';
import { MAP_FOLDERS } from '../maps/index.js';

export function install(game) {
  const { registry, bus } = game;
  const report = { added: addContentPeople(game) };
  const pickups = new Pickups(game);
  const puzzles = new Puzzles(game);
  const wild = new Wild(game);
  installSchools(game, MAP_FOLDERS);
  let staged = [];
  let current = null;

  bus.on('world:interact', (event) => pickups.onInteract(event));

  registry.add('story.command', 'forage', forageCommand(game));
  /* a push puzzle is reset here; a puzzle of another type (wind vanes) by the service that owns it */
  registry.add('story.command', 'puzzle', (node, ctx) => {
    const id = ctx.value(node.puzzle);
    if (puzzles.has(id)) return puzzles.command(node, ctx);
    const gusts = registry.has('service', 'gusts') ? registry.get('service', 'gusts') : null;
    if (gusts && (node.do || 'reset') === 'reset') guarded('the gusts', () => gusts.reset(id));
    return undefined;
  });
  registry.add('story.command', 'pickup', (node, ctx) => pickups.command(node, ctx));
  registry.add('gate', 'world:pickups', (step) => pickups.gate(step));
  registry.add('gate', 'world:puzzles', (step) => puzzles.gate(step));
  registry.add('service', 'puzzles', { solved: (id) => puzzles.solved(id), reset: (id) => puzzles.reset(id) });
  registry.add('service', 'wild', wild);

  const stage = (entity) => {
    const handle = addToWorld(current, entity);
    if (handle) staged.push(entity);
    return handle;
  };
  const unstage = (handle) => {
    if (!handle) return;
    removeFromWorld(current, handle);
    staged = staged.filter((entity) => entity !== handle.entity);
  };
  const guarded = (what, work) => {
    try {
      work();
    } catch (error) {
      console.warn(`World: ${what} failed`, error);
    }
  };

  registry.add('world.layer', 'world:things', {
    update(dt, world) {
      if (world !== current) return;
      for (const entity of staged) if (entity instanceof Painted) entity.update(dt);
      puzzles.update(dt);
      wild.update(dt, world);
      if (typeof world.addLight !== 'function') return;
      pickups.lights(world);
      puzzles.lights(world);
      wild.lights(world);
    },
  });

  registry.add('system', 'world:things', {
    report,
    start() {
      bus.on('map:enter', ({ scene }) => {
        current = scene;
        staged = [];
        guarded('the things on the floor', () => pickups.enter(scene, stage));
        guarded('the puzzles', () => puzzles.enter(scene, stage));
        guarded('the fishers', () => fishersOnEnter(game, scene, stage));
        guarded('the wild hontori', () => wild.enter(scene, stage, unstage));
      });
      const refresh = () => guarded('the things on the floor', () => pickups.refresh());
      bus.on('inventory:change', refresh);
      bus.on('story:flag', refresh);
      bus.on('time:day', refresh);
      bus.on('time:rest', () => guarded('the wild hontori', () => wild.respawn()));
    },
  });
}
