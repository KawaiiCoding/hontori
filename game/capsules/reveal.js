/*
 * reveal.js  (Hontori: capsules)
 * Job: the short capsule-opening card after a turn: a capsule drops in, wobbles and opens, the prize rises
 * out of it and its name shows (1.6 s in all). A tap during it shows the end at once; a tap after it (or
 * Enter, Space, Escape) closes the card. It is an overlay: the world below waits.
 *
 * Public API:
 *   showReveal(game, { prize, name, desc, kicker, tap, rare })   -> a Promise, resolved when the card closes
 *        name, desc, kicker, tap: the words already looked up
 */

import { element } from '../../ui/dom.js';
import { ScreenScene, openScreen } from '../../systems/features/ScreenScene.js';
import { capsuleCanvas, iconCanvas } from './art.js';
import { scaled } from './pixels.js';
import { installCapsuleStyles } from './styles.js';

/* the card can be closed once the prize has shown */
const READY_MS = 1600;
const POP_MS = 800;

class RevealScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  #card = null;
  #ready = false;
  #timers = [];

  constructor(game) {
    super(game, 'cp-dim');
  }

  build(root, o) {
    installCapsuleStyles();
    const color = (o.prize && o.prize.color) || (o.rare ? '#f0b828' : '#e0482c');
    const card = element('div', `cp-card${o.rare ? ' rare' : ''}`, root);
    card.style.setProperty('--cc', color);
    this.#card = card;
    const stage = element('div', 'cp-stage', card);
    element('div', 'cp-glow', stage);
    const shut = stage.appendChild(scaled(capsuleCanvas(color, false), 5));
    shut.className = 'cp-cap shut';
    const open = stage.appendChild(scaled(capsuleCanvas(color, true), 5));
    open.className = 'cp-cap open';
    const prize = stage.appendChild(scaled(iconCanvas(o.prize), 5));
    prize.className = 'cp-prize';
    element('div', 'cp-kick', card, o.kicker || '');
    element('div', 'cp-name', card, o.name || '');
    if (o.desc) element('div', 'cp-desc', card, o.desc);
    element('div', 'cp-tap', card, o.tap || '');
    root.addEventListener('click', () => this.#tap());
    this.#timers.push(setTimeout(() => this.#sound('sparkle'), POP_MS));
    this.#timers.push(setTimeout(() => {
      this.#ready = true;
    }, READY_MS));
  }

  #sound(name) {
    try {
      this.game.sound.play(name);
    } catch (error) {
      /* silent */
    }
  }

  #tap() {
    if (this.#ready) {
      this.done(true);
      return;
    }
    this.#ready = true;
    if (this.#card) this.#card.classList.add('done');
  }

  onKey(event) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') this.#tap();
  }

  exit() {
    for (const timer of this.#timers) clearTimeout(timer);
    this.#timers.length = 0;
    super.exit();
  }
}

export function showReveal(game, options) {
  return openScreen(game, new RevealScene(game), options);
}
