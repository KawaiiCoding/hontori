/*
 * Clock.js
 * Job: the only owner of requestAnimationFrame. It turns display frames into fixed logic
 * steps and capped renders, stops completely while the page is hidden, and can never be
 * frozen by an error: the next frame is scheduled before any work, and the work is guarded.
 *
 * Public API:
 *   new Clock({ update(dt), render(), baseRate(), onHidden(), onVisible() })
 *   start()               begin the loop
 *   requestRate(fps)      ask for at least this frame rate (for example 60 while a sigil is drawn);
 *                         returns a function that withdraws the request
 *   rate                  the frame rate in force now: the highest of baseRate() and the requests
 *   stats                 { frames, workMs, worstMs } since the last resetStats(): time spent in
 *                         update plus render for the frames that were rendered
 *   resetStats()
 *
 * Logic always advances in steps of STEP seconds, whatever the display or the frame rate.
 */

export const STEP = 1 / 60;

/* a frame that arrives this many milliseconds early still counts as on time */
const EARLY_MS = 3;
/* after a stall the world catches up at most this many seconds */
const MAX_CATCH_UP = 0.1;
const MAX_REPORTS = 5;

export class Clock {
  stats = { frames: 0, workMs: 0, worstMs: 0 };

  #update;
  #render;
  #baseRate;
  #onHidden;
  #onVisible;
  #requests = new Set();
  #handle = 0;
  #last = 0;
  #owed = 0;
  #reports = 0;
  #frame = (now) => this.#onFrame(now);

  constructor({ update, render, baseRate, onHidden, onVisible }) {
    this.#update = update;
    this.#render = render;
    this.#baseRate = baseRate;
    this.#onHidden = onHidden;
    this.#onVisible = onVisible;
  }

  get rate() {
    let rate = this.#baseRate();
    for (const request of this.#requests) rate = Math.max(rate, request.fps);
    return rate;
  }

  start() {
    document.addEventListener('visibilitychange', () => this.#onVisibility());
    this.#schedule();
  }

  requestRate(fps) {
    const request = { fps };
    this.#requests.add(request);
    return () => this.#requests.delete(request);
  }

  resetStats() {
    this.stats.frames = 0;
    this.stats.workMs = 0;
    this.stats.worstMs = 0;
  }

  #schedule() {
    this.#last = 0;
    this.#owed = 0;
    this.#handle = requestAnimationFrame(this.#frame);
  }

  #onVisibility() {
    cancelAnimationFrame(this.#handle);
    if (document.hidden) {
      this.#guard(this.#onHidden);
    } else {
      this.#guard(this.#onVisible);
      this.#schedule();
    }
  }

  #onFrame(now) {
    this.#handle = requestAnimationFrame(this.#frame);
    this.#guard(() => this.#work(now));
  }

  #work(now) {
    if (!this.#last) {
      this.#last = now;
      return;
    }
    const elapsed = now - this.#last;
    if (elapsed < 1000 / this.rate - EARLY_MS) return;
    this.#last = now;

    const started = performance.now();
    this.#owed += Math.min(MAX_CATCH_UP, elapsed / 1000);
    /* round to whole steps and carry the rest, so display jitter never adds or drops a step */
    const steps = Math.round(this.#owed / STEP);
    this.#owed -= steps * STEP;
    for (let i = 0; i < steps; i++) this.#update(STEP);
    this.#render();
    this.#record(performance.now() - started);
  }

  #record(ms) {
    this.stats.frames++;
    this.stats.workMs += ms;
    if (ms > this.stats.worstMs) this.stats.worstMs = ms;
  }

  #guard(work) {
    try {
      work();
    } catch (error) {
      if (this.#reports++ < MAX_REPORTS) console.warn('Clock: a frame failed', error);
    }
  }
}
