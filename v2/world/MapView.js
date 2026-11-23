/*
 * MapView.js
 * Job: draw one map. The ground comes from the GroundLayer's baked chunks; everything that
 * stands (props, buildings) and everything that moves (the actors it is given) is drawn live,
 * back to front, and only if it is inside the camera rectangle.
 *
 * Why standing things are not baked: someone can walk in front of a tree and behind it, so a
 * tree must be drawn between the people, not under them. Their painters are one image copy each.
 *
 * Public API:
 *   new MapView(map, art, assets)
 *   lights                 every fixed light of the map, in map pixels (lamps, windows, hearths)
 *   draw(ctx, camera, env, actors, focus)
 *        ctx is translated to map pixels. actors: the moving entities; where depths are equal they
 *        are drawn in the order given. focus: the actor that must never be lost from sight: when a
 *        building hides it, a soft see-through outline of it is drawn on top.
 */

import { GroundLayer } from './GroundLayer.js';
import { Prop, Building } from './Fixture.js';

const SEE_THROUGH = 0.45;

export class MapView {
  lights = [];

  #art;
  #ground;
  #fixtures = [];
  #buildings = [];
  #inView = [];

  constructor(map, art, assets) {
    this.#art = art;
    this.#ground = new GroundLayer(map, art, assets);
    map.props.forEach((def, index) => {
      const info = art.propInfo(def.type);
      if (!info) return;
      const prop = new Prop(def, index, info, art, map.indoor);
      for (const light of prop.lights) this.lights.push(light);
      /* flat decoration is part of the ground picture */
      if (!info.decor) this.#fixtures.push(prop);
    });
    map.buildings.forEach((def, index) => {
      const info = art.buildingInfo(def.type);
      if (!info) return;
      const building = new Building(def, index, info, art);
      for (const light of building.lights) this.lights.push(light);
      this.#fixtures.push(building);
      this.#buildings.push(building);
    });
    /* fixtures never move, so they are put in drawing order once */
    this.#fixtures.sort(byDepth);
  }

  draw(ctx, camera, env, actors, focus) {
    this.#ground.draw(ctx, camera, env);

    const moving = this.#inView;
    moving.length = 0;
    for (const actor of actors) if (actor.visible && sees(camera, actor)) moving.push(actor);
    moving.sort(byDepth);

    let next = 0;
    for (const fixture of this.#fixtures) {
      if (!sees(camera, fixture)) continue;
      while (next < moving.length && moving[next].depth < fixture.depth) this.#paint(ctx, env, moving[next++]);
      this.#paint(ctx, env, fixture);
    }
    while (next < moving.length) this.#paint(ctx, env, moving[next++]);

    if (focus && this.#buildings.some((building) => building.hides(focus.x, focus.y))) {
      ctx.globalAlpha = SEE_THROUGH;
      focus.drawBody(ctx, this.#art, env);
      ctx.globalAlpha = 1;
    }
  }

  #paint(ctx, env, entity) {
    try {
      entity.draw(ctx, this.#art, env);
    } catch (error) {
      console.warn(`MapView: could not draw ${entity.id}`, error);
    }
  }
}

function byDepth(a, b) {
  return a.depth - b.depth;
}

function sees(camera, entity) {
  const b = entity.bounds;
  return camera.sees(b.left, b.top, b.right, b.bottom);
}
