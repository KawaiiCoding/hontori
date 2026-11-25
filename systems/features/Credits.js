/*
 * Credits.js  (engine: features)
 * Job: the credits roll at the end of a journey: a title, sections of names (each with a small face when there is
 * one) and a last line, scrolling slowly up the screen. The browser moves the roll (one CSS transition), so the
 * game draws almost nothing while it runs and the frame rate stays low. A Skip button and the Escape key end it;
 * it also ends by itself a moment after the last line has arrived. It knows no game: the names come from the caller.
 *
 * Public API:
 *   class CreditsScene   enter({ title, sections: [{ head, names: [{ name, sub, portrait }] }], end, skip, speed })
 *        speed   pixels per second of the scroll (default 34); the last line stays for its reading time
 *        result  true once it has ended (skipped or not)
 *   rollCredits(game, options)   open it; a Promise that resolves when it is over
 */

import { element } from '../../ui/dom.js';
import { readMs } from '../../ui/readTime.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

const SPEED = 34;
const START_MS = 300;
const END_FADE_MS = 800;
const FACE = 36;
const STYLE_ID = 'ft-credits-style';
const CSS = `
.ft-credits{background:var(--title-edge);overflow:hidden;transition:opacity .8s}
.ft-credits .roll{position:absolute;left:0;right:0;top:100%;display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:0 24px;text-align:center;will-change:transform}
.ft-credits h2{margin:0 0 26px;font-size:clamp(24px,7cqmin,34px);font-weight:900;color:var(--accent);letter-spacing:1px}
.ft-credits h3{margin:30px 0 8px;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;opacity:.7}
.ft-credits .name{display:flex;align-items:center;gap:10px;min-height:${FACE}px;font-size:clamp(16px,4.4cqmin,20px);font-weight:800}
.ft-credits .name canvas{width:${FACE}px;height:${FACE}px;image-rendering:pixelated}
.ft-credits .name small{font-size:12px;font-weight:700;opacity:.7}
.ft-credits .end{margin-top:60px;font-size:clamp(18px,5cqmin,24px);font-weight:900;line-height:1.35;color:var(--accent);text-wrap:balance}
.ft-credits .skip{position:absolute;right:calc(var(--sa-r,0px) + 14px);top:calc(var(--sa-t,0px) + 14px);min-width:64px;min-height:44px;padding:7px 14px;
  border-radius:12px;border:2px solid rgba(255,255,255,.22);background:var(--slot-bg);color:#fff;font:800 14px var(--font);cursor:pointer;z-index:2}
`;

function installStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export class CreditsScene extends ScreenScene {
  /* the roll is moved by the browser; the game only needs a few frames */
  frameRate = 4;

  #timers = [];
  #closing = false;

  constructor(game) {
    super(game, 'ft-credits');
  }

  build(root, { title = '', sections = [], end = '', skip = 'Skip', speed } = {}) {
    installStyle();
    const roll = element('div', 'roll', root);
    if (title) element('h2', '', roll, title);
    for (const section of Array.isArray(sections) ? sections : []) {
      if (!section) continue;
      if (section.head) element('h3', '', roll, section.head);
      for (const entry of Array.isArray(section.names) ? section.names : []) {
        if (!entry || !entry.name) continue;
        const row = element('div', 'name', roll);
        if (entry.portrait) {
          const face = element('canvas', '', row);
          face.width = FACE;
          face.height = FACE;
          try {
            const g = face.getContext('2d');
            g.imageSmoothingEnabled = false;
            g.drawImage(entry.portrait, 0, 0, FACE, FACE);
          } catch (error) {
            face.remove();
          }
        }
        const words = element('span', '', row, entry.name);
        if (entry.sub) element('small', '', words, ` ${entry.sub}`);
      }
    }
    const last = end ? element('div', 'end', roll, end) : null;
    const button = element('button', 'skip', root, skip);
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#end();
    });
    const pps = Number(speed) > 0 ? Number(speed) : SPEED;
    /* one measure, then one transition: the roll rises until the last line sits in the middle of the screen */
    this.#later(START_MS, () => {
      if (!this.root) return;
      const screen = root.clientHeight || 600;
      const lastTop = last ? last.offsetTop + last.offsetHeight / 2 : roll.offsetHeight;
      const distance = lastTop + screen / 2;
      const ms = Math.round((distance / pps) * 1000);
      roll.style.transition = `transform ${ms}ms linear`;
      roll.style.transform = `translateY(${-distance}px)`;
      this.#later(ms + readMs(end || ''), () => this.#end());
    });
  }

  exit() {
    for (const t of this.#timers) clearTimeout(t);
    this.#timers = [];
    super.exit();
  }

  onKey(event) {
    if (event.key === 'Escape') this.#end();
  }

  #later(ms, fn) {
    this.#timers.push(setTimeout(fn, ms));
  }

  #end() {
    if (this.#closing) return;
    this.#closing = true;
    if (this.root) this.root.classList.remove('on');
    this.#later(END_FADE_MS, () => this.done(true));
  }
}

export function rollCredits(game, options) {
  return openScreen(game, new CreditsScene(game), options);
}
