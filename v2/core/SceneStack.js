/*
 * SceneStack.js
 * Job: run exactly one scene at a time. The top scene gets update; scenes under an overlay
 * are paused but still drawn and get ambient; scenes under an opaque scene are neither.
 *
 * Public API:
 *   open(id, params)      push the scene registered as registry kind "scene" under that id; returns it
 *   push(scene, params)   pause the top scene, then enter the new one
 *   pop()                 exit the top scene, then resume the one below
 *   reset(id, params)     exit every scene, then open that one (title to world, world to title)
 *   top                   the scene on top, or null
 *   base                  the lowest scene that is still drawn, or null
 *   frameRate             the frame rate the top scene asks for
 *   update(dt), draw(ctx), resize(w, h)   called by the Game once per step, frame and view change
 *
 * Event it emits on game.bus:
 *   "scene:change"   { top, base }   after every push and pop
 */

export class SceneStack {
  #game;
  #scenes = [];
  #firstVisible = 0;

  constructor(game) {
    this.#game = game;
  }

  get top() {
    return this.#scenes[this.#scenes.length - 1] || null;
  }

  get base() {
    return this.#scenes[this.#firstVisible] || null;
  }

  get frameRate() {
    return this.top ? this.top.frameRate : 30;
  }

  open(id, params) {
    const create = this.#game.registry.get('scene', id);
    if (!create) throw new Error(`SceneStack: no scene is registered as "${id}"`);
    return this.push(create(this.#game), params);
  }

  push(scene, params) {
    if (this.top) this.top.pause();
    this.#scenes.push(scene);
    this.#findFirstVisible();
    scene.resize(this.#game.screen.width, this.#game.screen.height);
    scene.enter(params);
    this.#changed();
    return scene;
  }

  pop() {
    const scene = this.#scenes.pop();
    if (!scene) return;
    scene.exit();
    this.#findFirstVisible();
    if (this.top) this.top.resume();
    this.#changed();
  }

  reset(id, params) {
    while (this.#scenes.length) this.#scenes.pop().exit();
    return this.open(id, params);
  }

  update(dt) {
    const last = this.#scenes.length - 1;
    for (let i = this.#firstVisible; i < last; i++) this.#scenes[i].ambient(dt);
    if (last >= 0) this.#scenes[last].update(dt);
  }

  draw(ctx) {
    for (let i = this.#firstVisible; i < this.#scenes.length; i++) this.#scenes[i].draw(ctx);
  }

  resize(width, height) {
    for (const scene of this.#scenes) scene.resize(width, height);
  }

  #changed() {
    this.#game.bus.emit('scene:change', { top: this.top, base: this.base });
  }

  #findFirstVisible() {
    let i = this.#scenes.length - 1;
    while (i > 0 && this.#scenes[i].overlay) i--;
    this.#firstVisible = Math.max(0, i);
  }
}
