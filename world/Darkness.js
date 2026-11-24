/*
 * Darkness.js  (engine: world)
 * Job: the darkness pass of a dark map (a cave): after the sky and its lights, the view is covered with dark
 * except a soft circle of sight around the player and a smaller glow around every light of the map (a lamp,
 * a glowing pad, the companion's own glow). How far the player sees is asked of the game each step, so a
 * lantern (or oil for it) widens the circle without the engine knowing what a lantern is; the circle eases to
 * its new size. Drawn on one canvas of the view's size with one cached soft hole picture: nothing is made per
 * frame.
 *
 * Public API:
 *   new Darkness()
 *   resize(width, height)              the view size in pixels
 *   setDark(dark)                      the map's `dark` description, or null for a map with no darkness:
 *                                      { level (0..1, how dark; default 0.92), sight (pixels of the circle around
 *                                      the player without help; default 28), ... (anything the game reads) }
 *   active                             a dark map is set
 *   sightOf(world, registry)           the radius wanted now: the largest of dark.sight and every registered
 *                                      "world.sight" answer (each call guarded)
 *   update(dt, sight)                  ease toward that radius
 *   draw(ctx, camera, player, lights, t)   in view pixels; player { x, y } in map pixels; lights as collected
 *                                      for the lighting pass ({ x, y, r } in map pixels)
 *
 * Registry kind it reads (through sightOf):
 *   "world.sight"  id -> (dark, world) => number | null   a radius in pixels the player may see now
 */

const HOLE = 64;
const EASE = 3;
const PLAYER_RISE = 8;
const FLICKER = 1.2;
const LIGHT_SHARE = 0.85;

let holePicture = null;

/* a white disc that fades to nothing at its rim: cut out of the dark with destination-out */
function hole() {
  if (holePicture) return holePicture;
  const canvas = document.createElement('canvas');
  canvas.width = HOLE * 2;
  canvas.height = HOLE * 2;
  const g = canvas.getContext('2d');
  const gradient = g.createRadialGradient(HOLE, HOLE, 0, HOLE, HOLE, HOLE);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.8, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gradient;
  g.fillRect(0, 0, HOLE * 2, HOLE * 2);
  holePicture = canvas;
  return canvas;
}

export class Darkness {
  #canvas = null;
  #g = null;
  #width = 0;
  #height = 0;
  #dark = null;
  #sight = 0;

  get active() {
    return !!this.#dark;
  }

  resize(width, height) {
    this.#width = Math.max(1, Math.round(width));
    this.#height = Math.max(1, Math.round(height));
    if (this.#canvas) {
      this.#canvas.width = this.#width;
      this.#canvas.height = this.#height;
    }
  }

  setDark(dark) {
    this.#dark = dark && typeof dark === 'object' ? dark : null;
    this.#sight = 0;
  }

  sightOf(world, registry) {
    const dark = this.#dark;
    if (!dark) return 0;
    let sight = Number(dark.sight) > 0 ? Number(dark.sight) : 28;
    for (const answer of registry ? registry.all('world.sight') : []) {
      if (typeof answer !== 'function') continue;
      try {
        const r = Number(answer(dark, world));
        if (Number.isFinite(r) && r > sight) sight = r;
      } catch (error) {
        /* an answer that fails does not widen the light */
      }
    }
    return sight;
  }

  update(dt, sight) {
    if (!this.#dark) return;
    if (!this.#sight) this.#sight = sight;
    else this.#sight += (sight - this.#sight) * Math.min(1, dt * EASE);
  }

  draw(ctx, camera, player, lights, t) {
    const dark = this.#dark;
    if (!dark || !this.#width) return;
    if (!this.#canvas) {
      this.#canvas = document.createElement('canvas');
      this.#canvas.width = this.#width;
      this.#canvas.height = this.#height;
      this.#g = this.#canvas.getContext('2d');
    }
    const g = this.#g;
    const level = Math.max(0, Math.min(1, Number(dark.level) || 0.92));
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.#width, this.#height);
    g.fillStyle = `rgba(4,3,8,${level})`;
    g.fillRect(0, 0, this.#width, this.#height);
    g.globalCompositeOperation = 'destination-out';
    const picture = hole();
    const cut = (x, y, r) => {
      if (!(r > 0)) return;
      const vx = x - camera.x;
      const vy = y - camera.y;
      if (vx + r < 0 || vy + r < 0 || vx - r > this.#width || vy - r > this.#height) return;
      g.drawImage(picture, vx - r, vy - r, r * 2, r * 2);
    };
    if (player) cut(player.x, player.y - PLAYER_RISE, this.#sight + Math.sin((t || 0) * 5) * FLICKER);
    for (const light of lights || []) if (light) cut(light.x, light.y, (light.r || 0) * LIGHT_SHARE);
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.#canvas, 0, 0);
  }
}
