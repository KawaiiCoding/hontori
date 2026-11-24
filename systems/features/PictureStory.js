/*
 * PictureStory.js  (engine: features)
 * Job: the picture story (content/schema.md section 12): a few cinematic panels, one line of text each, every
 * panel a small moving scene the game's painter draws from named parts. The picture fills the screen (the
 * upper part of a tall screen, all of a wide one), panels cross-fade, a slow push-in is done by the
 * compositor, each panel waits for a tap and also goes on by itself once its line has been read, Skip ends
 * the story and the last panel begins the game. It knows no game: the painter is registered by the game layer.
 *
 * Public API:
 *   installPictureStory(game)   registers the command { story: storyId } (registry "story.command" "story")
 *   class PictureStoryScene     the scene; enter({ story, text }) with the story data and a text function
 *
 * Registry kind it reads:
 *   "picture.painter" "main"   { paint(g, scene, env, k, size), forget() }: paint one panel's scene in the
 *                              story's pixels. size: [w, h, scale]: the picture in story pixels (it always
 *                              holds the story's safe size in its middle and grows to cover the screen) and
 *                              the real pixels per story pixel. k: the share of the panel's action time that
 *                              has passed (0 .. over 1). env: { t, time, weather, wind, indoor, hold }; hold
 *                              is how many action times the panel stays when left alone (for slow camera
 *                              moves that last the whole panel). forget() (optional) drops the painter's caches.
 *
 * The story data: { size: [w, h], scale, panelMs, minMs, auto, skip, tap, tapLast, sound: { panel, last },
 *                   panels: [{ text, gold, time, ms, push: [from, to], scene }] }
 *   size     the safe middle of every panel, in story pixels (default 192 x 120)
 *   scale    real pixels per story pixel (default 3)
 *   ms       the panel's action time (default panelMs); it stays ms + the reading time of its line
 *   push     a slow zoom of the whole picture while the panel stays, as two factors
 *   auto     false: panels only go on with a tap
 *   text ids for skip, tap, tapLast and every panel; sound names for game.sound.play
 */

import { element } from '../../ui/dom.js';
import { readMs } from '../../ui/readTime.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

const TEXT_DELAY_MS = 400;
const CROSSFADE_MS = 800;
const DEFAULT_PANEL_MS = 2600;
const DEFAULT_MIN_MS = 600;
const DEFAULT_SCALE = 3;
const END_FADE_MS = 600;
/* the last panel stays a moment longer before the game begins by itself */
const LAST_EXTRA_MS = 600;
const ACTIVE_FPS = 60;
const RESTING_FPS = 8;
/* the largest picture, in story pixels, however wide or tall the screen is */
const MAX_SIDE = 420;
const STYLE_ID = 'ft-story-cine';

const CSS = `
.ft-story.cine{display:block;background:#06060e}
.ft-story.cine .stage{position:absolute;left:0;right:0;top:0;height:70%;overflow:hidden;background:#06060e}
.ft-story.cine.wide .stage{height:100%}
.ft-story.cine .stage canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;transform-origin:50% 58%;
  image-rendering:pixelated;image-rendering:crisp-edges}
.ft-story.cine .shade{position:absolute;left:0;right:0;bottom:0;height:30%;pointer-events:none;z-index:3;
  background:linear-gradient(to bottom,rgba(6,6,14,0),#06060e)}
.ft-story.cine.wide .shade{height:46%;background:linear-gradient(to bottom,rgba(6,6,14,0),rgba(6,6,14,.9))}
.ft-story.cine .words{position:absolute;left:0;right:0;top:70%;bottom:0;z-index:4;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;padding:0 22px calc(var(--sa-b,0px) + 10px)}
.ft-story.cine.wide .words{top:auto;bottom:0;gap:8px;padding:0 calc(var(--sa-r,0px) + 90px) calc(var(--sa-b,0px) + 12px) calc(var(--sa-l,0px) + 90px)}
.ft-story.cine .line{width:min(100%,560px);min-height:3.9em;display:flex;align-items:center;justify-content:center;text-align:center;
  font-size:clamp(19px,5.2vmin,25px);font-weight:800;line-height:1.3;text-wrap:balance;text-shadow:0 2px 0 rgba(0,0,0,.55);
  opacity:0;transform:translateY(6px);transition:opacity .5s ease,transform .5s ease}
.ft-story.cine.wide .line{min-height:1.4em;font-size:clamp(17px,4.6vmin,22px)}
.ft-story.cine .line.show{opacity:1;transform:none}
.ft-story.cine .dots{display:flex;gap:6px}
.ft-story.cine .dots i{width:16px;height:4px;border-radius:2px;background:rgba(255,255,255,.2);transition:background .4s}
.ft-story.cine .dots i.on{background:var(--accent)}
.ft-story.cine .tap{font-size:13px;font-weight:700}
.ft-story.cine.wide .tap{position:absolute;right:calc(var(--sa-r,0px) + 16px);bottom:calc(var(--sa-b,0px) + 12px)}
.ft-story.cine .skip{z-index:5;background:rgba(6,6,14,.62)}
`;

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export class PictureStoryScene extends ScreenScene {
  frameRate = ACTIVE_FPS;

  #story = null;
  #text = (id) => id;
  #panels = [];
  #at = -1;
  #shownAt = 0;
  #actionMs = DEFAULT_PANEL_MS;
  #stayMs = DEFAULT_PANEL_MS;
  #stage = null;
  #canvases = [];
  #contexts = [];
  #front = 0;
  #size = [192, 120, DEFAULT_SCALE];
  #stale = false;
  #line = null;
  #dots = null;
  #tap = null;
  #textTimer = 0;
  #autoTimer = 0;
  #endTimer = 0;
  #env = { t: 0, time: 12, weather: 'clear', wind: 0.2, indoor: false, hold: 1 };
  #closing = false;
  #onResize = () => {
    this.#stale = true;
  };

  constructor(game) {
    super(game, 'ft-story cine');
  }

  build(root, { story, text }) {
    installStyle();
    this.#story = story;
    if (typeof text === 'function') this.#text = text;
    this.#panels = Array.isArray(story.panels) ? story.panels : [];
    if (!this.#panels.length) throw new Error('a picture story without panels');
    this.#stage = element('div', 'stage', root);
    for (let i = 0; i < 2; i++) {
      const canvas = element('canvas', '', this.#stage);
      this.#canvases.push(canvas);
      this.#contexts.push(canvas.getContext('2d'));
    }
    element('div', 'shade', this.#stage);
    const words = element('div', 'words', root);
    this.#line = element('div', 'line', words);
    this.#dots = element('div', 'dots', words);
    for (let i = 0; i < this.#panels.length; i++) element('i', '', this.#dots);
    this.#tap = element('div', 'tap', words);
    const skip = element('button', 'skip', root, this.#text(story.skip || ''));
    skip.type = 'button';
    skip.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#end();
    });
    root.addEventListener('click', () => this.#next());
    window.addEventListener('resize', this.#onResize);
    this.#measure();
    this.#show(0);
  }

  exit() {
    clearTimeout(this.#textTimer);
    clearTimeout(this.#autoTimer);
    clearTimeout(this.#endTimer);
    window.removeEventListener('resize', this.#onResize);
    try {
      const painter = this.game.registry.get('picture.painter', 'main');
      if (painter && typeof painter.forget === 'function') painter.forget();
    } catch (error) {
      /* a painter that cannot forget keeps its caches */
    }
    this.#canvases = [];
    this.#contexts = [];
    super.exit();
  }

  onKey(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.#next();
    } else if (event.key === 'Escape') this.#end();
  }

  draw() {
    if (this.#stale) this.#measure();
    const elapsed = performance.now() - this.#shownAt;
    this.#paint(elapsed);
    /* once a panel has played out and only waits for a tap, it needs few frames */
    this.frameRate = elapsed > this.#stayMs + CROSSFADE_MS ? RESTING_FPS : ACTIVE_FPS;
  }

  /* the picture always holds the story's safe size in its middle and grows to cover the stage */
  #measure() {
    this.#stale = false;
    const root = this.root;
    const stage = this.#stage;
    if (!root || !stage) return;
    root.classList.toggle('wide', root.clientWidth > root.clientHeight);
    const story = this.#story;
    const safe = Array.isArray(story.size) ? story.size : [192, 120];
    const safeW = Math.max(16, safe[0] | 0);
    const safeH = Math.max(16, safe[1] | 0);
    const cssW = Math.max(1, stage.clientWidth);
    const cssH = Math.max(1, stage.clientHeight);
    const unit = Math.min(cssW / safeW, cssH / safeH);
    const width = Math.min(MAX_SIDE, Math.ceil(cssW / unit));
    const height = Math.min(MAX_SIDE, Math.ceil(cssH / unit));
    const scale = Math.max(1, Math.min(4, story.scale | 0 || DEFAULT_SCALE));
    this.#size = [width, height, scale];
    for (const canvas of this.#canvases) {
      if (canvas.width !== width * scale) canvas.width = width * scale;
      if (canvas.height !== height * scale) canvas.height = height * scale;
    }
  }

  #paint(elapsed) {
    const g = this.#contexts[this.#front];
    const panel = this.#panels[this.#at];
    if (!g || !panel) return;
    const [width, height, scale] = this.#size;
    const env = this.#env;
    env.t = performance.now() / 1000;
    env.time = Number.isFinite(panel.time) ? panel.time : 12;
    env.hold = this.#stayMs / this.#actionMs;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#06060e';
    g.fillRect(0, 0, width, height);
    try {
      const painter = this.game.registry.get('picture.painter', 'main');
      if (painter) painter.paint(g, panel.scene || {}, env, elapsed / this.#actionMs, this.#size);
    } catch (error) {
      /* a painter that fails leaves the panel dark; the story goes on */
    }
  }

  #show(index) {
    const panel = this.#panels[index];
    const story = this.#story;
    const last = index === this.#panels.length - 1;
    const line = this.#text(panel.text || '');
    this.#at = index;
    this.#shownAt = performance.now();
    this.#actionMs = Math.max(200, Number(panel.ms) || Number(story.panelMs) || DEFAULT_PANEL_MS);
    this.#stayMs = this.#actionMs + readMs(line) + (last ? LAST_EXTRA_MS : 0);
    this.frameRate = ACTIVE_FPS;

    /* the other canvas takes the new panel and fades in over the old one */
    const old = this.#canvases[this.#front];
    this.#front = index === 0 ? 0 : 1 - this.#front;
    const canvas = this.#canvases[this.#front];
    const push = Array.isArray(panel.push) ? panel.push : [1, 1];
    canvas.style.transition = 'none';
    canvas.style.opacity = '0';
    canvas.style.zIndex = '2';
    canvas.style.transform = `scale(${Number(push[0]) || 1})`;
    if (old && old !== canvas) old.style.zIndex = '1';
    this.#paint(0);
    /* one layout per panel, so the fade and the push-in start from here */
    void canvas.offsetWidth;
    canvas.style.transition = `opacity ${CROSSFADE_MS}ms ease, transform ${Math.round(this.#stayMs + CROSSFADE_MS)}ms cubic-bezier(.3,.1,.5,1)`;
    canvas.style.opacity = '1';
    canvas.style.transform = `scale(${Number(push[1]) || 1})`;

    this.#line.classList.remove('show');
    clearTimeout(this.#textTimer);
    this.#textTimer = setTimeout(() => {
      if (!this.#line) return;
      this.#line.textContent = line;
      this.#line.classList.toggle('gold', !!panel.gold);
      this.#line.classList.add('show');
    }, TEXT_DELAY_MS);
    [...this.#dots.children].forEach((dot, i) => dot.classList.toggle('on', i <= index));
    this.#tap.textContent = this.#text((last ? story.tapLast : story.tap) || '');

    clearTimeout(this.#autoTimer);
    if (story.auto !== false) this.#autoTimer = setTimeout(() => this.#auto(index), this.#stayMs);

    const sound = story.sound || {};
    const name = last ? sound.last : sound.panel;
    if (name) {
      try {
        this.game.sound.play(name);
      } catch (error) {
        /* no sound is no reason to stop */
      }
    }
  }

  /* the panel has been read: go on, unless the page is hidden (then look again in a moment) */
  #auto(index) {
    if (this.#closing || this.#at !== index) return;
    if (document.hidden) {
      this.#autoTimer = setTimeout(() => this.#auto(index), 1000);
      return;
    }
    this.#advance();
  }

  #next() {
    if (this.#closing) return;
    if (performance.now() - this.#shownAt < (this.#story.minMs || DEFAULT_MIN_MS)) return;
    this.#advance();
  }

  #advance() {
    if (this.#at >= this.#panels.length - 1) this.#end();
    else this.#show(this.#at + 1);
  }

  #end() {
    if (this.#closing) return;
    this.#closing = true;
    clearTimeout(this.#textTimer);
    clearTimeout(this.#autoTimer);
    if (this.root) this.root.classList.remove('on');
    this.#endTimer = setTimeout(() => this.done(true), END_FADE_MS);
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
