/*
 * room.js  (Hontori: capsules)
 * Job: the keepsakes in the kid's room: every keepsake prize that is set out stands at its own spot (content
 * `place: { map, x, y, lift }`, on furniture or on the wall, never where anyone walks) while that map is on
 * screen. A keepsake that gives light (the lantern, the mushroom lamp) glows softly after dark.
 *
 * Public API:
 *   installRoom(game, rules, prizes)   rules: the capsule rules; prizes: id -> prize data
 *        registers system "capsules:room" and world.layer "capsules:room"
 */

import { Entity } from '../../world/Entity.js';
import { TILE } from '../../core/units.js';
import { keepsake } from './art.js';

const LIGHT = { r: 22, flicker: false, soft: true };

class Keepsake extends Entity {
  #look;
  #depth;

  constructor(prize) {
    const place = prize.place;
    super(`keepsake:${prize.id}`, place.x * TILE + TILE / 2, (place.y + 1) * TILE - (place.lift || 0));
    this.#look = prize.look;
    this.#depth = (place.y + 1) * TILE + 0.5;
    this.bounds = { left: this.x - 12, top: this.y - 20, right: this.x + 12, bottom: this.y + 2 };
    const art = keepsake(this.#look);
    this.glow = art && art.light ? { ...LIGHT, x: this.x, y: this.y - 6, color: art.light } : null;
  }

  get depth() {
    return this.#depth;
  }

  draw(ctx) {
    const art = keepsake(this.#look);
    if (!art) return;
    ctx.drawImage(art.canvas, Math.round(this.x - art.ax), Math.round(this.y - art.ay));
  }
}

function worldOf(game) {
  const top = game.scenes && game.scenes.top;
  return top && top.map && top.player && typeof top.addActor === 'function' ? top : null;
}

export function installRoom(game, rules, prizes) {
  let placed = [];
  let world = null;

  const kept = () => {
    try {
      return rules.worn('keepsake').map((id) => prizes[id]).filter((p) => p && p.place && keepsake(p.look));
    } catch (error) {
      return [];
    }
  };

  function clear() {
    if (world) for (const k of placed) world.removeActor(k);
    placed = [];
  }

  function place(scene) {
    clear();
    world = scene;
    if (!scene || !scene.map) return;
    const here = scene.map.id;
    for (const prize of kept()) {
      if (prize.place.map !== here) continue;
      placed.push(scene.addActor(new Keepsake(prize)));
    }
  }

  game.registry.add('system', 'capsules:room', {
    start() {
      game.bus.on('map:enter', ({ scene }) => place(scene));
      game.bus.on('capsules:change', () => {
        const scene = world && world.map ? world : worldOf(game);
        if (scene) place(scene);
      });
    },
  });

  game.registry.add('world.layer', 'capsules:room', {
    update(dt, scene) {
      if (scene !== world) return;
      for (const k of placed) if (k.glow) scene.addLight(k.glow);
    },
  });
}
