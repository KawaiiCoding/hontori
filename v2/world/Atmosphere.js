/*
 * Atmosphere.js
 * Job: everything in the air of the world: the day and night light with its lamps, the weather,
 * particles (dust, sparks), and the small life of an outdoor map (birds, ducks, butterflies,
 * petals, fireflies).
 *
 * Public API:
 *   new Atmosphere(art)
 *   resize(width, height)              the view size changed
 *   enterMap(description)              a new map: its small life starts over
 *   emit(kind, x, y, count)            particles, by a kind the art provider knows ('dust' ...)
 *   update(dt, env, x, y)              x, y: the point the small life gathers around (the player)
 *   lifeLights()                       lights of the small life right now (fireflies) plus the map's own
 *   drawLife(ctx, env)                 in map pixels, over the world
 *   drawSky(ctx, camera, env, lights)  in view pixels: weather, then darkness and glows
 *   drawParticles(ctx, camera)         in view pixels, over the light
 */

export class Atmosphere {
  #art;
  #lighting = null;
  #weather = null;
  #particles;
  #life = null;

  constructor(art) {
    this.#art = art;
    this.#particles = art.createParticles();
  }

  resize(width, height) {
    this.#lighting = this.#art.createLighting(width, height);
    this.#weather = this.#art.createWeather(width, height);
  }

  enterMap(description) {
    this.#life = this.#art.createAmbient(description);
  }

  emit(kind, x, y, count) {
    this.#particles.emit(kind, x, y, count);
  }

  update(dt, env, x, y) {
    this.#life.update(dt, env, x, y);
    this.#particles.update(dt, env);
    if (!env.indoor) this.#weather.update(dt, env);
  }

  lifeLights() {
    return this.#life.lights();
  }

  drawLife(ctx, env) {
    this.#life.draw(ctx, env);
  }

  drawSky(ctx, camera, env, lights) {
    if (!env.indoor) this.#weather.draw(ctx, camera.x, camera.y, env);
    this.#lighting.render(ctx, camera.x, camera.y, env, lights);
  }

  drawParticles(ctx, camera) {
    this.#particles.draw(ctx, camera.x, camera.y);
  }
}
