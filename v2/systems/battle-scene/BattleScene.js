/*
 * BattleScene.js  (engine: battle scene)
 * Job: show a battle. It owns the screen for the length of one battle: a pixel stage, the interface layer over
 * it and the surface sigils are drawn on. Every choice of the player goes to the battle's rules, which answer
 * with a list of events; the scene plays that list in order, one handler per event type, and takes no input
 * while it plays. It decides nothing itself. A game extends it with its look and its handlers.
 *
 * Public API:
 *   new BattleScene(game)
 *   finished             a Promise of the outcome given to close() (null when the scene was removed from outside)
 *   enter(params)        params are the subclass's; it pushes like any scene (game.scenes.open or push)
 *   battle, stage, surface, root, params;  cssWidth, cssHeight: the size of root in screen pixels
 *   busy                 events are playing; input is ignored
 *   closed               the scene is leaving or gone
 *   play(events)         play a list of events (an action's answer); resolves when the last one has played
 *   act(choose)          when idle: play(choose(battle)); choose returns the events of one choice
 *   peek(offset)         the event that comes next (offset 0), without playing it
 *   take(type)           the next event if it has that type, removed from the list; else null
 *   close(outcome)       resolve `finished` and leave
 *
 * For the subclass to fill in:
 *   createBattle(params) -> the battle (an object with begin() -> events and `over`)
 *   build(root)          build the interface inside root (a full-screen element in the interface layer)
 *   handlers             { eventType: async (event) => {} }, called with the scene as `this`
 *   opening()            what plays first (default: battle.begin())
 *   idle()               the list has played: the player may choose again
 *   playing()            a list starts to play
 *   layout()             the stage size changed (also once before build)
 *   step(dt), tick()     every logic step; every 1/30 s
 *   paintBack(g), paintActors(g), paintFront(g), paintOver(g)   the picture, back to front, in art pixels
 *   stageTouched()       the picture was touched (close what is open)
 *   mayDraw()            may a sigil be started now (default: idle and not over)
 *   strokeGrew(trail, count), strokeEnded(trail)   the sigil surface reports
 *   inkMarks()           small line drawings that peel off the ink
 *   leaving()            remove what the subclass added (listeners, sound)
 * Frame rate: 30, and 60 only while a sigil is being drawn.
 */

import { Scene } from '../../core/Scene.js';
import { element } from '../../ui/dom.js';
import { installBattleStyles } from '../../ui/BattleStyles.js';
import { BattleStage } from './BattleStage.js';
import { SigilSurface } from './SigilSurface.js';

const DRAW_RATE = 60;
const FADE_MS = 350;
const HUM_GAP = 0.38;

export class BattleScene extends Scene {
  frameRate = 30;
  battle = null;
  stage = null;
  surface = null;
  root = null;
  params = null;
  busy = true;
  closed = false;
  cssWidth = 0;
  cssHeight = 0;
  handlers = {};

  #resolve;
  #outcome = null;
  #queue = [];
  #at = 0;
  #shown = false;
  #refit = false;
  #observer = null;
  #release = null;
  #lastHum = 0;
  #painters;

  constructor(game) {
    super(game);
    this.finished = new Promise((resolve) => {
      this.#resolve = resolve;
    });
    this.#painters = {
      back: (g) => this.paintBack(g),
      actors: (g) => this.paintActors(g),
      front: (g) => this.paintFront(g),
      over: (g) => this.paintOver(g)
    };
  }

  enter(params) {
    const { game } = this;
    this.params = params || {};
    installBattleStyles();
    this.root = element('div', 'bt', game.ui.layer);
    const canvas = element('canvas', 'bt-stage', this.root);
    this.stage = new BattleStage(canvas);
    this.stage.font = game.theme.font.family;
    this.surface = new SigilSurface(canvas, {
      unit: () => this.stage.unit,
      marks: this.inkMarks(),
      mayStart: () => {
        if (this.closed) return false;
        this.#safely(() => this.stageTouched());
        return this.mayDraw();
      },
      onStart: () => this.#strokeBegan(),
      onGrow: (trail, count) => this.strokeGrew(trail, count),
      onEnd: (trail) => this.#strokeEnded(trail),
      onHum: () => this.#hum()
    });
    this.battle = this.createBattle(this.params);
    this.#fit();
    this.build(this.root);
    this.#observer = new ResizeObserver(() => {
      this.#refit = true;
    });
    this.#observer.observe(this.root);
    this.play(this.opening());
  }

  exit() {
    this.closed = true;
    this.#stopFastFrames();
    if (this.#observer) this.#observer.disconnect();
    try {
      this.leaving();
    } catch (error) {
      console.error('BattleScene: leaving failed', error);
    }
    this.surface.dispose();
    this.stage.clear();
    this.game.input.clear();
    const root = this.root;
    root.classList.remove('on');
    root.style.pointerEvents = 'none';
    setTimeout(() => root.remove(), FADE_MS);
    this.#resolve(this.#outcome);
  }

  close(outcome) {
    if (this.closed) return;
    this.closed = true;
    this.#outcome = outcome === undefined ? null : outcome;
    if (this.game.scenes.top === this) this.game.scenes.pop();
    else this.#resolve(this.#outcome);
  }

  resize() {
    this.#refit = true;
  }

  update(dt) {
    if (!this.root) return;
    if (!this.#shown) {
      this.#shown = true;
      this.root.classList.add('on');
    }
    if (this.#refit) this.#fit();
    const ticks = this.stage.update(dt);
    for (let i = 0; i < ticks; i++) {
      this.stage.tick();
      this.surface.tick();
      this.tick();
    }
    this.step(dt);
  }

  draw(ctx) {
    ctx.fillStyle = '#0b0c1c';
    ctx.fillRect(0, 0, this.game.screen.width, this.game.screen.height);
    if (this.stage) this.stage.draw(this.#painters);
  }

  async play(events) {
    this.busy = true;
    this.#queue = Array.isArray(events) ? events : [];
    this.#at = 0;
    this.#safely(() => this.playing());
    while (this.#at < this.#queue.length && !this.closed) {
      const event = this.#queue[this.#at++];
      const handler = this.handlers[event.type];
      if (!handler) continue;
      try {
        await handler.call(this, event);
      } catch (error) {
        console.error(`BattleScene: showing "${event.type}" failed`, error);
      }
    }
    if (this.closed) return;
    this.busy = false;
    this.#safely(() => this.idle());
  }

  act(choose) {
    if (this.busy || this.closed || !this.battle || this.battle.over) return null;
    return this.play(choose(this.battle));
  }

  peek(offset) {
    return this.#queue[this.#at + (offset || 0)] || null;
  }

  take(type) {
    const next = this.#queue[this.#at];
    if (!next || next.type !== type) return null;
    this.#at++;
    return next;
  }

  /* ---------- for the subclass ---------- */

  createBattle() {
    throw new Error('BattleScene: createBattle(params) is not implemented');
  }

  opening() {
    return this.battle.begin();
  }

  build() {}

  idle() {}

  playing() {}

  layout() {}

  step() {}

  tick() {}

  paintBack() {}

  paintActors() {}

  paintFront() {}

  paintOver() {}

  stageTouched() {}

  mayDraw() {
    return !this.busy && !this.battle.over;
  }

  strokeGrew() {}

  strokeEnded() {}

  inkMarks() {
    return [];
  }

  leaving() {}

  /* ---------- private ---------- */

  #fit() {
    this.#refit = false;
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    if (!w || !h) return;
    const same = w === this.cssWidth && h === this.cssHeight;
    this.cssWidth = w;
    this.cssHeight = h;
    if (same) return;
    this.stage.fit(w, h, window.devicePixelRatio);
    this.#safely(() => this.layout());
  }

  #strokeBegan() {
    this.#stopFastFrames();
    this.#release = this.game.clock.requestRate(DRAW_RATE);
  }

  #strokeEnded(trail) {
    this.#stopFastFrames();
    this.#safely(() => this.strokeEnded(trail));
  }

  #stopFastFrames() {
    if (this.#release) this.#release();
    this.#release = null;
  }

  #hum() {
    if (this.stage.time - this.#lastHum < HUM_GAP) return;
    this.#lastHum = this.stage.time;
    this.game.sound.play('sparkle');
  }

  #safely(fn) {
    try {
      fn();
    } catch (error) {
      console.error('BattleScene:', error);
    }
  }
}
