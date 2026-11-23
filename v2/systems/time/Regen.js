/*
 * Regen.js  (engine: time)
 * Job: a value that refills slowly while the player walks the world (not in dialogs, menus or
 * battles), and fully when the player rests. The game layer says what the value is.
 *
 * Public API (registry kind "system"):
 *   new Regen({ every, get, set, max, active, onStep, restBonus, refillOn })
 *        every: seconds of free play per +1; get() / set(n) / max(): the value and its ceiling;
 *        active(): optional, false while the value should not refill (not owned yet);
 *        onStep(value, full): optional, after each +1 (a toast);
 *        restBonus(): optional, extra over max after a rest (0 by default);
 *        refillOn: the one event that fills the value (default "time:rest")
 *   start(game)
 *   fill(bonus)    set the value to max + bonus
 *   add(n)         add n, never above max (an amount over max from a rest is kept until spent)
 */

export class Regen {
  #game = null;
  #options;
  #seconds = 0;

  constructor(options) {
    this.#options = options;
  }

  start(game) {
    this.#game = game;
    game.bus.on('world:tick', ({ scene }) => this.#tick(scene));
    game.bus.on(this.#options.refillOn || 'time:rest', () => {
      let bonus = 0;
      try {
        bonus = this.#options.restBonus ? this.#options.restBonus() || 0 : 0;
      } catch (error) {
        console.warn('Regen: restBonus failed', error);
      }
      this.fill(bonus);
    });
  }

  fill(bonus = 0) {
    const { set, max } = this.#options;
    set(max() + bonus);
    this.#seconds = 0;
  }

  add(n) {
    const { get, set, max } = this.#options;
    const value = get();
    if (n > 0 && value >= max()) return;
    set(Math.max(0, n > 0 ? Math.min(max(), value + n) : value + n));
  }

  /* one call a second while the world is visible; it only counts while the world is on top */
  #tick(scene) {
    const { every, get, max, active, onStep } = this.#options;
    if (this.#game.scenes.top !== scene) return;
    try {
      if (active && !active()) return;
      if (get() >= max()) {
        this.#seconds = 0;
        return;
      }
      this.#seconds += 1;
      if (this.#seconds < every) return;
      this.#seconds = 0;
      this.add(1);
      if (onStep) onStep(get(), get() >= max());
    } catch (error) {
      console.warn('Regen: a tick failed', error);
    }
  }
}
