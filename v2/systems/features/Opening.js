/*
 * Opening.js  (engine: features)
 * Job: a journey's opening that was cut off (the page was closed in the middle of the new-journey story)
 * starts again cleanly the next time. The story system marks a journey as started when it is first entered,
 * so without this a closed page would leave a journey with no opening, half its flags set and no wand.
 *
 * How: while an event of the trigger `newGame` runs, the save section "opening" says 'open'; when that script
 * ends it says 'done'. Entering the world with 'open' clears the story flags the opening set (every flag but
 * `visited:*`), hides the companion until the story brings it in again, and fires `newGame` once more.
 * Everything the opening gives is guarded in the content (a hontori is added only to an empty party, a name
 * is asked only while it has none), so a second run gives nothing twice.
 *
 * Public API:
 *   installOpening(game)   save section "opening" { state: '' | 'open' | 'done' }, system "opening"
 *   OPENING_SAVE
 */

export const OPENING_SAVE = { state: '' };

class OpeningGuard {
  #game = null;
  #ids = null;
  #again = null;

  start(game) {
    this.#game = game;
    game.bus.on('story:flag', ({ name, value }) => this.#onFlag(name, value));
    game.bus.on('story:end', () => this.#onEnd());
    game.bus.on('map:enter', ({ scene }) => this.#onEnter(scene));
  }

  get #state() {
    return this.#game.save.state.opening || { state: '' };
  }

  #story() {
    return this.#game.registry.get('service', 'story') || null;
  }

  #openingIds() {
    if (this.#ids) return this.#ids;
    const story = this.#story();
    const events = (story && story.library && story.library.events) || [];
    this.#ids = new Set(events.filter((event) => event && event.on && 'newGame' in event.on).map((event) => `ev:${event.id}`));
    return this.#ids;
  }

  #onFlag(name, value) {
    if (!value || !this.#openingIds().has(name)) return;
    this.#state.state = 'open';
  }

  #onEnd() {
    if (this.#state.state !== 'open') return;
    /* the world was entered again while the cut-off script was still winding down: start it now */
    if (this.#again) {
      const world = this.#again;
      this.#again = null;
      setTimeout(() => this.#restart(world), 0);
      return;
    }
    /* a script that was cut off (the title was opened over it) leaves the opening open */
    const top = this.#game.scenes.top;
    if (!top || !top.hud || !top.player) return;
    this.#state.state = 'done';
    this.#game.save.commit();
  }

  #onEnter(world) {
    if (this.#state.state !== 'open') return;
    const story = this.#story();
    if (!story) return;
    if (story.busy) {
      this.#again = world;
      return;
    }
    this.#restart(world);
  }

  #restart(world) {
    const story = this.#story();
    if (!story || story.busy || this.#state.state !== 'open') return;
    const saved = this.#game.save.state.story;
    if (saved && saved.flags) {
      for (const name of Object.keys(saved.flags)) {
        if (!name.startsWith('visited:')) story.setFlag(name, undefined);
      }
    }
    if (world && world.companion) world.companion.visible = false;
    this.#state.state = '';
    console.info('Features: the opening was cut off last time; it starts again');
    story.fire('newGame', {});
  }
}

export function installOpening(game) {
  game.save.define('opening', OPENING_SAVE);
  game.registry.add('system', 'opening', new OpeningGuard());
}
