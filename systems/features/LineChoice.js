/*
 * LineChoice.js  (engine: features)
 * Job: a clear "choose one line" card for a choice that matters (a law, a vow, a name for a place): a title, one
 * line under it, a few lines to choose from, and a confirm step that shows the chosen line large and asks once
 * more, with Back to choose again. There is no way out without a choice, so a story that needs one never stalls.
 * It knows no game: the lines and the words come from the caller.
 *
 * Public API:
 *   class LineChoiceScene   enter({ title, sub, lines: [{ id, text }], words: { ask, yes, back, pick } })
 *        ask    the question over the chosen line in the confirm step; yes / back: its two buttons
 *        pick   a short line under the list ("Tap a line")
 *        result the id of the chosen line (null only when the scene was removed from outside)
 *   chooseLine(game, options)   open it; a Promise of the id
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

const STYLE_ID = 'ft-line-style';
const CSS = `
.ft-lines{width:min(94%,440px)}
.ft-lines .opts{display:flex;flex-direction:column;gap:8px;margin:12px 0 4px}
.ft-lines .opt{min-height:48px;padding:10px 14px;border-radius:14px;border:2px solid rgba(255,255,255,.14);background:rgba(0,0,0,.22);
  color:var(--text);font:800 15px/1.35 var(--font);text-align:left;cursor:pointer}
.ft-lines .opt:active,.ft-lines .opt:focus-visible{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent);outline:none}
.ft-lines .hint{margin-top:6px;font-size:12px;font-weight:800;opacity:.7}
.ft-lines .chosen{margin:14px 0 6px;padding:14px 12px;border-radius:14px;border:2px solid var(--accent);
  background:color-mix(in srgb,var(--accent) 12%,transparent);font-size:18px;font-weight:900;line-height:1.35;color:var(--accent)}
`;

function installStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export class LineChoiceScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  #card = null;
  #o = null;

  constructor(game) {
    super(game, 'ft-dim');
  }

  build(root, { title = '', sub = '', lines = [], words = {} } = {}) {
    installStyle();
    const list = (Array.isArray(lines) ? lines : []).filter((l) => l && l.id != null);
    if (!list.length) throw new Error('a line choice without lines');
    this.#o = { title, sub, lines: list, words: words || {} };
    this.#card = element('div', 'ft-card ft-lines', root);
    this.#list();
  }

  #sound(name) {
    try {
      this.game.sound.play(name);
    } catch (error) {
      /* silent */
    }
  }

  #list() {
    const { title, sub, lines, words } = this.#o;
    const card = this.#card;
    card.textContent = '';
    element('h2', '', card, title);
    if (sub) element('p', '', card, sub);
    const opts = element('div', 'opts', card);
    for (const line of lines) {
      const button = element('button', 'opt', opts, line.text || '');
      button.type = 'button';
      button.addEventListener('click', () => {
        this.#sound('blip');
        this.#confirm(line);
      });
    }
    if (words.pick) element('div', 'hint', card, words.pick);
  }

  #confirm(line) {
    const { words } = this.#o;
    const card = this.#card;
    card.textContent = '';
    if (words.ask) element('h3', '', card, words.ask);
    element('div', 'chosen', card, line.text || '');
    const row = element('div', 'row', card);
    row.appendChild(new Button(this.game.art, { label: words.back || 'Back', kind: 'alt', onPress: () => this.#list() }).element);
    row.appendChild(new Button(this.game.art, {
      label: words.yes || 'OK', kind: 'gold',
      onPress: () => {
        this.#sound('spell');
        this.done(line.id);
      },
    }).element);
  }
}

export function chooseLine(game, options) {
  return openScreen(game, new LineChoiceScene(game), options);
}
