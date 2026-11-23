/*
 * Scene.js
 * Job: the base class of everything that owns the screen for a while (world, battle, title, menus, dialogs).
 * A scene is run by the SceneStack; it never touches the frame loop itself.
 *
 * Public API (override what the scene needs):
 *   frameRate        frames per second this scene wants while it is on top (default 30)
 *   overlay          true if the scene below stays visible under this one (dialogs, small menus)
 *   hud              true if this scene is played with the HUD and the touch controls (the world)
 *   game             the Game this scene belongs to
 *   enter(params)    the scene was pushed
 *   exit()           the scene was popped; remove every listener and timer here
 *   pause()          another scene was pushed on top
 *   resume()         this scene is on top again
 *   update(dt)       one fixed logic step, only while this scene is on top
 *   ambient(dt)      one fixed step while paused but still visible under an overlay:
 *                    keep the picture alive (wind, water), never advance game rules
 *   draw(ctx)        paint; must not throw and must not change game state
 *   resize(w, h)     the logical view size changed
 */

export class Scene {
  frameRate = 30;
  overlay = false;
  hud = false;

  constructor(game) {
    this.game = game;
  }

  enter() {}

  exit() {}

  pause() {}

  resume() {}

  update() {}

  ambient() {}

  draw() {}

  resize() {}
}
