/*
 * PictureStory.js  (engine: features)
 * Job: the picture story (content/schema.md section 12): a few panels, one line of text each, every panel a
 * small scene the game's painter draws from named parts. A tap shows the next panel, Skip ends it, and the
 * last tap begins the game. It knows no game: the painter is registered by the game layer.
 *
 * Public API:
 *   installPictureStory(game)   registers the command { story: storyId } (registry "story.command" "story")
 *   class PictureStoryScene     the scene; enter({ story, text }) with the story data and a text function
 *
 * Registry kind it reads:
 *   "picture.painter" "main"   { paint(g, scene, env, k, size) }: paint one panel's scene (named ground,
 *                              actors and extras) in the story's pixel size; k is the share of the panel's
 *                              time that has passed (0 .. over 1). env: { t, time, weather, wind, indoor }
 *
 * The story data: { size: [w, h], panelMs, minMs, skip, tap, tapLast, sound: { panel, last },
 *                   panels: [{ text, gold, time, scene }] }   (text ids; sound names for game.sound.play)
 */

import { element } from '../../ui/dom.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

const SCALE = 3;
const TEXT_DELAY_MS = 250;
const PANEL_FADE_MS = 280;
const DEFAULT_PANEL_MS = 2600;
const DEFAULT_MIN_MS = 500;

export class PictureStoryScene extends ScreenScene {
  frameRate = 30;

  #story = null;
  #text = (id) => id;
  #panels = [];
  #at = -1;
  #shownAt = 0;
  #canvas = null;
  #g = null;
  #line = null;
  #dots = null;
  #tap = null;
  #timer = 0;
  #env = { t: 0, time: 12, weather: 'clear', wind: 0.2, indoor: false };
  #closing = false;

  constructor(game) {
    super(game, 'ft-story');
  }

  build(root, { story, text }) {
    this.#story = story;
    if (typeof text === 'function') this.#text = text;
    this.#panels = Array.isArray(story.panels) ? story.panels : [];
    if (!this.#panels.length) throw new Error('a picture story without panels');
    const [width, height] = this.#sizeOf();
    const frame = element('div', 'frame', root);
    this.#canvas = element('canvas', '', frame);
    this.#canvas.width = width * SCALE;
    this.#canvas.height = height * SCALE;
    this.#g = this.#canvas.getContext('2d');
    this.#line = element('div', 'line', root);
    this.#dots = element('div', 'dots', root);
    for (let i = 0; i < this.#panels.length; i++) element('i', '', this.#dots);
    this.#tap = element('div', 'tap', root);
    const skip = element('button', 'skip', root, this.#text(story.skip || ''));
    skip.type = 'button';
    skip.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#end();
    });
    root.addEventListener('click', () => this.#next());
    this.#show(0);
  }

  exit() {
    clearTimeout(this.#timer);
    super.exit();
  }

  onKey(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.#next();
    } else if (event.key === 'Escape') this.#end();
  }

  draw() {
    const g = this.#g;
    const panel = this.#panels[this.#at];
    if (!g || !panel) return;
    const now = performance.now();
    const [width, height] = this.#sizeOf();
    const env = this.#env;
    env.t = now / 1000;
    env.time = Number.isFinite(panel.time) ? panel.time : 12;
    const k = (now - this.#shownAt) / (this.#story.panelMs || DEFAULT_PANEL_MS);
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, width, height);
    const painter = this.game.registry.get('picture.painter', 'main');
    try {
      if (painter) painter.paint(g, panel.scene || {}, env, k, [width, height]);
    } catch (error) {
      /* a painter that fails leaves the panel empty; the story goes on */
    }
    const fade = Math.min(1, (now - this.#shownAt) / PANEL_FADE_MS);
    if (fade < 1) {
      g.globalAlpha = 1 - fade;
      g.fillStyle = '#000';
      g.fillRect(0, 0, width, height);
      g.globalAlpha = 1;
    }
  }

  #sizeOf() {
    const size = this.#story && Array.isArray(this.#story.size) ? this.#story.size : [192, 120];
    return [Math.max(16, size[0] | 0), Math.max(16, size[1] | 0)];
  }

  #show(index) {
    this.#at = index;
    this.#shownAt = performance.now();
    const panel = this.#panels[index];
    const last = index === this.#panels.length - 1;
    this.#line.style.opacity = '0';
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      if (!this.#line) return;
      this.#line.textContent = this.#text(panel.text || '');
      this.#line.classList.toggle('gold', !!panel.gold);
      this.#line.style.opacity = '1';
    }, TEXT_DELAY_MS);
    [...this.#dots.children].forEach((dot, i) => dot.classList.toggle('on', i <= index));
    this.#tap.textContent = this.#text((last ? this.#story.tapLast : this.#story.tap) || '');
    const sound = this.#story.sound || {};
    const name = last ? sound.last : sound.panel;
    if (name) {
      try {
        this.game.sound.play(name);
      } catch (error) {
        /* no sound is no reason to stop */
      }
    }
  }

  #next() {
    if (this.#closing) return;
    if (performance.now() - this.#shownAt < (this.#story.minMs || DEFAULT_MIN_MS)) return;
    if (this.#at >= this.#panels.length - 1) this.#end();
    else this.#show(this.#at + 1);
  }

  #end() {
    if (this.#closing) return;
    this.#closing = true;
    if (this.root) this.root.classList.remove('on');
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.done(true), 600);
  }
}

function storyOf(game, id) {
  for (const folder of game.registry.all('content')) {
    const table = folder && folder.story;
    if (table && table[id]) return table[id];
  }
  return null;
}

export function installPictureStory(game) {
  game.registry.add('scene', 'pictureStory', (owner) => new PictureStoryScene(owner));
  game.registry.add('story.command', 'story', async (node, ctx) => {
    const id = ctx.value(node.story);
    const story = storyOf(game, id);
    if (!story) {
      ctx.story.warnOnce(`picture:${id}`, `Features: there is no picture story "${id}"`);
      return undefined;
    }
    await openScreen(game, new PictureStoryScene(game), { story, text: (textId) => ctx.text(textId) });
    return undefined;
  });
}
