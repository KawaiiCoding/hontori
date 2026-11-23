/*
 * HelperCard.js
 * Job: the first-touch guide: a small card with a round face and one short line that floats next
 * to the thing it explains, which gets a soft glowing ring. It never blocks: a tap on the card
 * closes it, any other tap closes it and still goes through, and it leaves by itself after a few
 * seconds. Of all the spots around the thing it picks the one that hides the least of the thing
 * and of every visible button, card, panel or dialog. Cards wait in a queue, one at a time.
 *
 * Public API:
 *   new HelperCard(layer, { avoid, lingerMs })
 *        layer: the .ui element; avoid: a CSS selector of what a card should not cover (the
 *        kit's buttons, panels, dialogs and bars are always avoided); lingerMs: how long it stays
 *   show({ title, text, face, target, still }) -> Promise<boolean>
 *        face: a canvas (copied) or null; target: an element, a selector or null;
 *        still(): optional, false when the moment has passed. Resolves true when the card was
 *        seen, false when it was skipped (its target is gone or hidden, or still() is false)
 *   clear()          drop the queue and close a card on screen (when the scene changes)
 */

import { readMs } from './readTime.js';
import { element } from './dom.js';

const AVOID = 'button, input, .ui-sheet.on, .ui-dlg, .ui-ch, .ui-hud, .ui-qpill, .ui-qpop, .ui-toast, .ui-top > *';
const FIRST_DELAY_MS = 500;
const NEXT_DELAY_MS = 400;
const ARM_MS = 350;
const FADE_MS = 200;
const GAP = 12;
const EDGE = 10;

export class HelperCard {
  #layer;
  #avoid;
  #linger;
  #queue = [];
  #busy = false;
  #current = null;

  constructor(layer, { avoid = '', lingerMs = 7000 } = {}) {
    this.#layer = layer;
    this.#avoid = avoid ? `${AVOID}, ${avoid}` : AVOID;
    this.#linger = lingerMs;
  }

  show(card) {
    return new Promise((resolve) => {
      this.#queue.push({ ...card, resolve });
      if (!this.#busy) {
        this.#busy = true;
        setTimeout(() => this.#next(), FIRST_DELAY_MS);
      }
    });
  }

  clear() {
    for (const card of this.#queue.splice(0)) card.resolve(false);
    if (this.#current) this.#current();
  }

  #next() {
    const card = this.#queue.shift();
    if (!card) {
      this.#busy = false;
      return;
    }
    try {
      if (!this.#open(card)) {
        card.resolve(false);
        setTimeout(() => this.#next(), 0);
      }
    } catch (error) {
      console.warn('HelperCard: a card failed', error);
      card.resolve(false);
      setTimeout(() => this.#next(), 0);
    }
  }

  #rectOf(node, frame) {
    if (!node || !node.isConnected || !node.getClientRects().length) return null;
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    return { x: box.left - frame.left, y: box.top - frame.top, w: box.width, h: box.height };
  }

  #open(card) {
    const layer = this.#layer;
    const frame = layer.getBoundingClientRect();
    const node = typeof card.target === 'string' ? layer.querySelector(card.target) || document.querySelector(card.target) : card.target;
    const target = node ? this.#rectOf(node, frame) : null;
    /* the moment has passed: skip it */
    if ((card.target && !target) || (card.still && !card.still())) return false;

    const overlay = element('div', 'ui-guide', layer);
    if (target) {
      const ring = element('div', 'ring', overlay);
      ring.style.cssText = `left:${target.x - 4}px;top:${target.y - 4}px;width:${target.w + 8}px;height:${target.h + 8}px`;
    }
    const bubble = element('div', 'card', overlay);
    const face = element('div', 'face', bubble);
    if (card.face) {
      const copy = element('canvas', '', face);
      copy.width = card.face.width;
      copy.height = card.face.height;
      copy.getContext('2d').drawImage(card.face, 0, 0);
    }
    const words = element('div', 'words', bubble);
    if (card.title) element('b', '', words, card.title);
    element('span', '', words, card.text || '');
    this.#place(bubble, target, frame, overlay);
    /* a panel may still be sliding into place: measure again once it has settled, so the card never sits on it */
    if (node) setTimeout(() => {
      if (!overlay.isConnected) return;
      const settled = layer.getBoundingClientRect();
      const again = this.#rectOf(node, settled);
      if (!again) return;
      const ring = overlay.querySelector('.ring');
      if (ring) ring.style.cssText = `left:${again.x - 4}px;top:${again.y - 4}px;width:${again.w + 8}px;height:${again.h + 8}px`;
      this.#place(bubble, again, settled, overlay);
    }, 420);

    let gone = false;
    let lingering = 0;
    const anyTap = () => {
      document.removeEventListener('pointerdown', anyTap, true);
      setTimeout(() => close(), 0);
    };
    const close = (event) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (gone) return;
      gone = true;
      this.#current = null;
      clearTimeout(lingering);
      document.removeEventListener('pointerdown', anyTap, true);
      overlay.classList.remove('on');
      setTimeout(() => {
        overlay.remove();
        card.resolve(true);
        setTimeout(() => this.#next(), NEXT_DELAY_MS);
      }, FADE_MS);
    };
    this.#current = close;
    bubble.addEventListener('click', close);
    setTimeout(() => {
      if (!gone) document.addEventListener('pointerdown', anyTap, true);
    }, ARM_MS);
    lingering = setTimeout(() => close(), Math.max(this.#linger, readMs((card.title || '') + ' ' + (card.text || ''), { max: 14000 }) + 2000));
    overlay.getBoundingClientRect();
    overlay.classList.add('on');
    return true;
  }

  /* try spots next to the target, then bands down the screen, in a wide and two narrower sizes */
  #place(bubble, target, frame, overlay) {
    const W = frame.width;
    const H = frame.height;
    const busy = [...this.#layer.querySelectorAll(this.#avoid)]
      .filter((node) => !overlay.contains(node))
      .map((node) => this.#rectOf(node, frame))
      .filter((r) => r && r.w * r.h < W * H * 0.92);
    const overlap = (x, y, w, h, r) => Math.max(0, Math.min(x + w, r.x + r.w) - Math.max(x, r.x)) * Math.max(0, Math.min(y + h, r.y + r.h) - Math.max(y, r.y));
    const cost = (x, y, w, h) => {
      let c = 0;
      for (const r of busy) c += overlap(x, y, w, h, r);
      if (target) c += overlap(x, y, w, h, target) * 20;
      return c;
    };
    const full = Math.min(300, W - 2 * EDGE);
    let best = null;
    [full, Math.min(full, 210), Math.min(full, 170)].forEach((w, wi) => {
      bubble.style.width = `${w}px`;
      const h = bubble.offsetHeight || 70;
      const spots = [];
      if (target) {
        const tx = Math.max(EDGE, Math.min(W - w - EDGE, target.x + target.w / 2 - w / 2));
        const my = target.y + target.h / 2 - h / 2;
        spots.push([tx, target.y + target.h + GAP], [tx, target.y - h - GAP], [target.x + target.w + GAP, my], [target.x - w - GAP, my],
          [EDGE, target.y - h - GAP], [W - w - EDGE, target.y - h - GAP], [EDGE, target.y + target.h + GAP], [W - w - EDGE, target.y + target.h + GAP]);
      }
      for (let f = 0.06; f < 0.9; f += 0.03) spots.push([(W - w) / 2, H * f], [EDGE, H * f], [W - w - EDGE, H * f]);
      for (const [sx, sy] of spots) {
        const x = Math.max(EDGE, Math.min(W - w - EDGE, sx));
        const y = Math.max(EDGE, Math.min(H - h - EDGE, sy));
        let near = 0;
        if (target) {
          const cx = target.x + target.w / 2;
          const cy = target.y + target.h / 2;
          near = Math.hypot(Math.max(x, Math.min(x + w, cx)) - cx, Math.max(y, Math.min(y + h, cy)) - cy);
        }
        /* anything covered costs a lot; after that, nearer to the target is better */
        const score = cost(x, y, w, h) * 40 + near + wi * 25;
        if (!best || score < best.score) best = { x, y, w, score };
      }
    });
    bubble.style.width = `${best.w}px`;
    bubble.style.left = `${best.x}px`;
    bubble.style.top = `${best.y}px`;
  }
}
