/*
 * Travel.js  (engine: features)
 * Job: a ride from one place to another (a ferry, a cart, a raft): the view fades, the player stands on the
 * crossing map (a boat on open water) for a short crossing while the world goes by, then fades again and
 * arrives. Nothing to learn: the player only watches, may talk to whoever rides along, and the ride always
 * ends where it was going. A ride is saved, so closing the game mid-way continues it on the next start;
 * a crossing map can never become a place to be stuck.
 *
 * Public API:
 *   installTravel(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       paintCrossing(ctx, world, look)   optional: drawn in view pixels over the crossing map while the ride
 *                                         goes (the water rushing past); look: { seconds, heading (0..3,
 *                                         core/units.js directions), k (0..1 of the crossing) }
 *       sounds    { depart, arrive }       sound names for game.sound.play
 *     }
 *     returns the Travel object below
 *   class Travel
 *     go(spec)          start a ride (after the running script ends); false if the spec cannot be ridden
 *        spec: { to: { map, x, y, dir }, via: { map, x, y, dir, heading }, seconds, during: [commands],
 *                after: [commands] }
 *          via       the crossing map and where the player stands on it (left out: a plain fade to `to`)
 *          seconds   how long the crossing lasts in world time (default 6; a dialog pauses it)
 *          during    commands run once on the crossing (someone speaks); the ride waits for them
 *          after     commands run once on arrival
 *     riding            true from the start of a ride until its arrival
 *   Also: registry "service" "travel" { go(spec), riding() }
 *
 * What it registers:
 *   gate          "features:travel"   no step while riding (the player stays on the boat)
 *   world.layer   "features:travel"   counts the crossing and draws it
 *   system        "features:travel"   follows map:enter through the ride
 *   save section  "travel"            { ride: spec with { phase: 'via' | 'to', told } | null }
 * Events: "travel:start" { to, via }, "travel:end" { to }.
 */

const CROSSING_SECONDS = 6;

function placeOf(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.map !== 'string') return null;
  const place = { map: raw.map };
  if (Number.isInteger(raw.x) && Number.isInteger(raw.y)) {
    place.x = raw.x;
    place.y = raw.y;
  }
  if (Number.isInteger(raw.dir)) place.dir = raw.dir;
  if (Number.isInteger(raw.heading)) place.heading = raw.heading;
  return place;
}

export class Travel {
  #game;
  #o;
  #world = null;
  #seconds = 0;
  #leaving = false;
  #aside = false;
  #look = { seconds: 0, heading: 0, k: 0 };

  constructor(game, options) {
    this.#game = game;
    this.#o = { sounds: {}, ...options };
  }

  #section() {
    return this.#game.save.state.travel || null;
  }

  #ride() {
    const section = this.#section();
    return section && section.ride && typeof section.ride === 'object' ? section.ride : null;
  }

  #setRide(ride) {
    const section = this.#section();
    if (section) section.ride = ride;
  }

  #story() {
    return this.#game.story || this.#game.registry.get('service', 'story') || null;
  }

  get riding() {
    return !!this.#ride();
  }

  go(spec = {}) {
    const has = (place) => !!place && this.#game.registry.has('map', place.map);
    const to = placeOf(spec.to);
    if (!has(to)) {
      console.warn('Travel: a ride needs a known map to go to', spec.to);
      return false;
    }
    let via = placeOf(spec.via);
    if (spec.via && !has(via)) {
      console.warn('Travel: the crossing map is not known; going straight there', spec.via);
      via = null;
    }
    if (this.#ride()) return false;
    const seconds = Number(spec.seconds);
    this.#setRide({
      to, via, phase: via ? 'via' : 'to', told: false,
      seconds: Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds, 30) : CROSSING_SECONDS,
      during: Array.isArray(spec.during) ? spec.during : [],
      after: Array.isArray(spec.after) ? spec.after : [],
    });
    this.#game.bus.emit('travel:start', { to, via });
    this.#sound(this.#o.sounds.depart);
    this.#whenCalm(() => this.#leave());
    return true;
  }

  /* map changes wait for the script that asked for them to end (the world is paused under it) */
  #whenCalm(fn) {
    const story = this.#story();
    if (!story || !story.busy) {
      fn();
      return;
    }
    const off = this.#game.bus.on('story:end', () => {
      off();
      fn();
    });
  }

  #leave() {
    const ride = this.#ride();
    const world = this.#world || this.#game.scenes.base;
    if (!ride || !world || typeof world.goTo !== 'function') return;
    const place = ride.phase === 'via' && ride.via ? ride.via : ride.to;
    this.#leaving = true;
    world.goTo(place.map, place.x, place.y, place.dir);
  }

  #arrived(world) {
    this.#world = world;
    this.#leaving = false;
    const ride = this.#ride();
    if (!ride) return;
    if (!ride.to || !this.#game.registry.has('map', ride.to.map)) {
      /* a ride saved by another version to a place that is gone: the player simply stays here */
      this.#setRide(null);
      return;
    }
    if (ride.via && !this.#game.registry.has('map', ride.via.map)) ride.via = null;
    if (!ride.via) ride.phase = 'to';
    const id = world.map.id;
    if (ride.phase === 'via' && ride.via && id === ride.via.map) {
      /* on the boat: the crossing starts again from the beginning after a reload */
      this.#seconds = 0;
      this.#aside = true;
      const during = Array.isArray(ride.during) ? ride.during : [];
      if (!ride.told && during.length) {
        ride.told = true;
        const story = this.#story();
        if (story) story.run(during);
      }
      return;
    }
    if (id === ride.to.map) {
      this.#setRide(null);
      this.#sound(this.#o.sounds.arrive);
      try {
        this.#game.save.commit();
      } catch (error) {
        console.warn('Travel: saving failed', error);
      }
      this.#game.bus.emit('travel:end', { to: ride.to });
      const story = this.#story();
      if (Array.isArray(ride.after) && ride.after.length && story) story.run(ride.after);
      return;
    }
    /* anywhere else (a save made just before the fade): the ride goes on from here */
    this.#whenCalm(() => this.#leave());
  }

  gate() {
    return this.riding;
  }

  update(dt, world) {
    if (world !== this.#world || this.#leaving) return;
    const ride = this.#ride();
    if (!ride || ride.phase !== 'via' || !ride.via || world.map.id !== ride.via.map) return;
    /* the companion steps beside the kid, who stands still the whole ride and must stay in view */
    if (this.#aside) {
      this.#aside = false;
      const companion = world.companion;
      if (companion && world.player && typeof companion.joinAt === 'function') companion.joinAt(world.player.x + 14, world.player.y);
    }
    const story = this.#story();
    if (story && story.busy) return;
    this.#seconds += dt;
    if (this.#seconds < (Number.isFinite(ride.seconds) ? ride.seconds : CROSSING_SECONDS)) return;
    ride.phase = 'to';
    this.#leave();
  }

  draw(ctx, world) {
    const ride = this.#ride();
    if (!this.#o.paintCrossing || !ride || !ride.via || world !== this.#world || world.map.id !== ride.via.map) return;
    const look = this.#look;
    look.seconds = this.#seconds;
    look.heading = ride.via.heading ?? 0;
    look.k = ride.seconds > 0 ? Math.min(1, this.#seconds / ride.seconds) : 1;
    this.#o.paintCrossing(ctx, world, look);
  }

  #sound(name) {
    if (!name) return;
    try {
      this.#game.sound.play(name);
    } catch (error) {
      /* a missing sound never stops the game */
    }
  }

  start() {
    this.#game.bus.on('map:enter', ({ scene }) => {
      try {
        this.#arrived(scene);
      } catch (error) {
        console.warn('Travel: the ride could not go on', error);
      }
    });
  }
}

export function installTravel(game, options = {}) {
  const travel = new Travel(game, options);
  const { registry } = game;
  game.save.define('travel', { ride: null });
  registry.add('gate', 'features:travel', () => travel.gate());
  registry.add('world.layer', 'features:travel', { update: (dt, world) => travel.update(dt, world), draw: (ctx, world) => travel.draw(ctx, world) });
  registry.add('system', 'features:travel', travel);
  registry.add('service', 'travel', { go: (spec) => travel.go(spec), riding: () => travel.riding });
  return travel;
}
