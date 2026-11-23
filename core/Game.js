/*
 * Game.js
 * Job: build the core services once, wire them together, and start. Every scene and system
 * receives this object and reaches the rest of the game through it and nothing else.
 *
 * Public API:
 *   new Game({ canvas, root, storage, config, art, sound, theme })
 *        config, art, sound and theme are what a game supplies; INTERFACES.md specifies them
 *   config     the game's own choices: { id, firstMap, playerLook, companion }
 *   art        the game's art provider
 *   sound      the game's sound provider
 *   theme      the game's interface theme (colours, fonts, icons, words, title)
 *   settings   Settings     the device's choices (controls, sound, last save slot)
 *   bus        EventBus     app-wide events
 *   registry   Registry     maps, scenes, systems, gates and everything later phases register
 *   save       SaveStore    the saved game
 *   screen     Screen       the canvas and the view size
 *   assets     Assets       baked pictures
 *   input      Input        the player's intent
 *   scenes     SceneStack   what is on screen
 *   clock      Clock        the frame loop (requestRate lives here)
 *   ui         (set by the UI layer in main.js: the Ui object, see ui/Ui.js)
 *   chooseControls(mode)    'stick' or 'tap': switch the input and remember the choice
 *   setMuted(on)            switch the sound and remember the choice
 *   start(sceneId, params)  start every registered system, open the first scene, run the clock
 *
 * Events it emits on bus:
 *   "app:hidden", "app:visible"    the page went to the background or came back (the game is
 *                                  saved before "app:hidden"; the clock is stopped in between)
 */

import { EventBus } from './EventBus.js';
import { Registry } from './Registry.js';
import { SaveStore } from './SaveStore.js';
import { Screen } from './Screen.js';
import { Assets } from './Assets.js';
import { Input } from './Input.js';
import { TouchPad } from './TouchPad.js';
import { SceneStack } from './SceneStack.js';
import { Clock } from './Clock.js';
import { Settings } from './Settings.js';

export class Game {
  constructor({ canvas, root, storage, config, art, sound, theme }) {
    this.config = config;
    this.storage = storage;
    this.art = art;
    this.sound = sound;
    this.theme = theme;
    this.bus = new EventBus();
    this.settings = new Settings(storage, `${config.id}.settings`);
    sound.setMuted(this.settings.get('muted'));
    if (sound.setRainMuted) sound.setRainMuted(this.settings.get('rainMuted'));
    this.registry = new Registry();
    this.save = new SaveStore({ storage, bus: this.bus, key: `${config.id}.save.s` });
    this.scenes = new SceneStack(this);
    this.screen = new Screen(canvas, root, (width, height) => this.scenes.resize(width, height));
    this.assets = new Assets((width, height, opaque) => this.screen.newSheet(width, height, opaque));
    this.input = new Input(canvas, this.settings.get('controls'));
    const pad = new TouchPad(root, this.input);
    this.bus.on('scene:change', ({ top }) => pad.setEnabled(!!top && top.hud));
    this.clock = new Clock({
      update: (dt) => this.scenes.update(dt),
      render: () => this.#render(),
      baseRate: () => this.scenes.frameRate,
      onHidden: () => this.#hidden(),
      onVisible: () => this.bus.emit('app:visible'),
    });
  }

  chooseControls(mode) {
    this.settings.set('controls', mode);
    this.input.setMode(mode);
  }

  setMuted(on) {
    this.settings.set('muted', !!on);
    this.sound.setMuted(!!on);
  }

  start(sceneId, params) {
    for (const system of this.registry.all('system')) {
      try {
        system.start(this);
      } catch (error) {
        console.warn('Game: a system failed to start', error);
      }
    }
    this.scenes.open(sceneId, params);
    this.clock.start();
  }

  #render() {
    this.screen.fit();
    this.scenes.draw(this.screen.ctx);
  }

  #hidden() {
    this.input.clear();
    this.save.commit();
    this.bus.emit('app:hidden');
  }
}
