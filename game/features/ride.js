/*
 * ride.js  (Hontori: features)
 * Job: riding the lead hontori with the saddle (src/ride.js and the current engine's drawRide): once the
 * lead has reached its third stage and the saddle is in the bag, a saddle button appears under open sky.
 * Riding is as fast as running; the hontori is drawn larger, saddled, with the kid astride its back
 * (the picture is rideArt.js). The kid hops on and off. Indoors the kid steps down. Tap the saddle again
 * (or press Q) to step down.
 *
 * Public API:
 *   installRide(game)   registers system "ride"
 *   canRide(game)       true when riding is possible here and now
 *
 * Engine use: while riding, the player's `painter` draws the mount and the rider (world/Actor.js) and its
 * `advance` is taken as a run step whether or not the run button is held, so a mount moves exactly at the
 * run speed (world/Player.js) and running adds nothing; both are reset when the kid steps down. The companion is
 * hidden while it is being ridden. Also registers service "ride": { riding() }.
 */

import { element, icon } from '../../ui/dom.js';
import { installFeatureStyles } from '../../systems/features/styles.js';
import { word } from './words.js';
import { createRideArt } from './rideArt.js';

const SADDLE = 'saddle';
const RIDE_STAGE = 3;
const HOP_MS = 300;
const BLANKET = '#b04a3a';

/* the blanket takes the colour of the lead's capsule when one is set */
function blanketColour(game) {
  try {
    const capsules = game.registry.get('service', 'capsules') || (window.H && window.H.capsules);
    const colour = capsules && typeof capsules.blanketColor === 'function' ? capsules.blanketColor() : null;
    return typeof colour === 'string' && colour ? colour : BLANKET;
  } catch (error) {
    return BLANKET;
  }
}

function leadOf(game) {
  const items = game.registry.get('service', 'items');
  try {
    return items && items.party ? items.party.lead() : null;
  } catch (error) {
    return null;
  }
}

function holdsSaddle(game) {
  const items = game.registry.get('service', 'items');
  try {
    return !!(items && items.inventory.has(SADDLE));
  } catch (error) {
    return false;
  }
}

function worldOf(game) {
  const top = game.scenes.top;
  return top && top.hud && top.player && top.env ? top : null;
}

export function canRide(game) {
  const lead = leadOf(game);
  const world = worldOf(game);
  return !!(lead && (lead.stage || 1) >= RIDE_STAGE && holdsSaddle(game) && world && !world.env.indoor && world.companion);
}

class Ride {
  #game = null;
  #button = null;
  #riding = null;
  #leaving = null;
  #art = null;
  #shown = false;
  #onKey = (event) => {
    if ((event.key === 'q' || event.key === 'Q') && worldOf(this.#game)) this.toggle();
  };

  start(game) {
    this.#game = game;
    const refresh = () => this.#refresh();
    game.bus.on('scene:change', refresh);
    game.bus.on('world:tick', refresh);
    game.bus.on('inventory:change', refresh);
    game.bus.on('party:change', () => {
      if (this.#riding) {
        this.#hideCompanion();
        this.#riding.state.blanket = blanketColour(game);
      }
      refresh();
    });
    game.bus.on('map:enter', ({ scene }) => {
      this.#landIfDue(true);
      if (!this.#riding) return;
      if (scene.env.indoor || scene.player !== this.#riding.player) this.#stepDown(false);
      else this.#hideCompanion();
    });
    window.addEventListener('keydown', this.#onKey);
  }

  riding() {
    return !!this.#riding;
  }

  toggle() {
    const game = this.#game;
    if (this.#riding) {
      this.#stepDown(true);
      this.#refresh();
      return;
    }
    this.#landIfDue(true);
    if (!canRide(game)) {
      game.ui.toast(word(game, 'shared.feat.ride.sky'));
      return;
    }
    this.#mount(worldOf(game));
    this.#refresh();
    this.#helper('riding');
  }

  #helper(id) {
    const story = this.#game.registry.get('service', 'story');
    if (!story) return;
    story.helper({ id, title: `shared.use.helper.${id}.title`, text: `shared.use.helper.${id}`, icon: 'paw' });
  }

  #hideCompanion() {
    const world = this.#riding && this.#riding.world;
    if (world && world.companion) world.companion.visible = false;
  }

  #mount(world) {
    const game = this.#game;
    const player = world.player;
    if (!this.#art) this.#art = createRideArt(game);
    const art = this.#art;
    const state = { player, key: 'hontori', blanket: blanketColour(game), seated: 0 };
    const riding = { world, player, state, since: performance.now(), leaving: 0 };
    /* the player's own hook: a painter in place of its look */
    player.painter = (ctx, painters, env, shadow) => {
      const lead = leadOf(game);
      state.key = (lead && lead.key) || (world.companion && world.companion.key) || state.key;
      const now = performance.now();
      if (riding.leaving) {
        state.seated = 1 - Math.min(1, (now - riding.leaving) / HOP_MS);
        if (state.seated <= 0) {
          /* landed: this frame already shows the kid on its own feet */
          this.#land(riding);
          painters.drawShadow(ctx, player.x, player.y, 6, 2, env);
          painters.drawPerson(ctx, player.look, Math.round(player.x), Math.round(player.y), player.dir, 0, env, player.pose);
          return;
        }
      } else {
        state.seated = Math.min(1, (now - riding.since) / HOP_MS);
      }
      art.paint(ctx, env, shadow, state);
    };
    /* a mount moves at the run speed, no more: every step is taken as a run step, whether B is held or not */
    const advance = player.advance;
    player.advance = (dt) => advance.call(player, dt, true);
    this.#riding = riding;
    this.#hideCompanion();
    this.#sound('step');
  }

  #sound(name) {
    try {
      this.#game.sound.play(name);
    } catch (error) {
      /* silent */
    }
  }

  /* loud: the kid hops off and the hontori walks again; quiet: the ride just ends (a door, another map) */
  #stepDown(loud) {
    const riding = this.#riding;
    if (!riding) return;
    this.#riding = null;
    /* back to the player's own steps */
    delete riding.player.advance;
    if (!loud) {
      riding.player.painter = null;
      return;
    }
    riding.leaving = performance.now();
    this.#leaving = riding;
    this.#sound('step');
  }

  /* the hop off is over: the kid stands, the hontori is itself again */
  #land(riding) {
    if (this.#leaving === riding) this.#leaving = null;
    const { world, player } = riding;
    player.painter = null;
    if (this.#riding) return;
    try {
      if (world.companion) {
        world.companion.visible = true;
        world.companion.joinAt(player.x, player.y);
      }
    } catch (error) {
      /* the companion finds its own way */
    }
  }

  #landIfDue(force) {
    const riding = this.#leaving;
    if (riding && (force || performance.now() - riding.leaving >= HOP_MS)) this.#land(riding);
  }

  #makeButton() {
    installFeatureStyles();
    const game = this.#game;
    /* under the HUD's column of round buttons, never over the A and B buttons */
    const column = game.ui.layer.querySelector('.ui-top');
    const button = element('button', 'ui-round ft-side', column || game.ui.layer);
    button.type = 'button';
    const label = word(game, 'shared.feat.ride.label');
    button.title = label;
    button.setAttribute('aria-label', label);
    let image = null;
    try {
      const url = game.art.itemIconUrl ? game.art.itemIconUrl(SADDLE) : null;
      if (url) {
        image = document.createElement('img');
        image.alt = '';
        image.src = url;
      }
    } catch (error) {
      image = null;
    }
    button.appendChild(image || icon(game.art, 'paw'));
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (worldOf(game)) this.toggle();
    });
    button.hidden = true;
    return button;
  }

  /* the button exists only while riding is possible (or while riding) */
  #refresh() {
    const game = this.#game;
    this.#landIfDue(false);
    if (this.#riding && (!worldOf(game) ? false : !canRide(game))) {
      this.#stepDown(true);
    }
    const show = !!worldOf(game) && (!!this.#riding || canRide(game));
    if (show && !this.#button) this.#button = this.#makeButton();
    if (!this.#button) return;
    this.#button.hidden = !show;
    this.#button.classList.toggle('on', !!this.#riding);
    if (show && !this.#shown) {
      this.#shown = true;
      this.#helper(SADDLE);
    }
  }
}

export function installRide(game) {
  const ride = new Ride();
  game.registry.add('system', 'ride', ride);
  game.registry.add('service', 'ride', { riding: () => ride.riding() });
}
