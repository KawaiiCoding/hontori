/*
 * game/world/pickups.js
 * Job: the home things lying in the world (content `pickups`, src/items.js): each shows where it lies
 * while its `active` condition holds and it is not carried, with a soft glow, a small bob and a
 * twinkle. It stands in the way like any thing; using it (the action button, or a tap that walks up
 * to it) offers "Take the X" or "Leave it". Taking it puts it in the bag through the items system
 * (pocket rules apply: with full pockets the take option is greyed). A thing with
 * `respawn: 'daily'` (the bread) lies there again the day after it was taken.
 *
 * Public API:
 *   class Pickups
 *     constructor(game)
 *     onInteract(event)      a "world:interact" handler, subscribed before the story's own: it takes
 *                            the event when a thing lies on the used tile
 *     gate(step)             registry kind "gate": nobody walks onto a thing; in tap mode a walk that
 *                            ends at one uses it
 *     enter(world, stage)    map:enter: put this map's things into the picture
 *     refresh()              show or hide each thing (after the bag, a flag or the day changed)
 *     lights(world)          each world step: the warm glow of every thing lying there, through
 *                            world.addLight (seen where it is dark)
 *     command(node, ctx)     story command "pickup" { pickup: itemId }: the take-or-leave choice
 *
 * Flags it keeps: "pickup:<item>" = the day a daily thing was last taken.
 * Moments it reports: helper:moment { name: "pickup:<item>" } after a thing is taken.
 */

import { Painted } from '../../world/Painted.js';
import { TILE } from '../../core/units.js';
import { itemsOf, storyOf, warnOnce } from './common.js';

const GLOW_SIZE = 24;
const ICON_SIZE = 14;
const GLOW_KEY = 'world:pickup-glow';
const GLOW_LIGHT = { r: 20, color: '#ffe6a0', flicker: true };

export class Pickups {
  #game;
  #things = [];
  #images = new Map();

  constructor(game) {
    this.#game = game;
  }

  get #items() {
    return itemsOf(this.#game);
  }

  /* every spot of the content with the item it holds */
  #spots() {
    const items = this.#items;
    return items && items.book ? items.book.pickups : [];
  }

  lies(spot) {
    const items = this.#items;
    const story = storyOf(this.#game);
    if (!items || !story || !items.inventory) return false;
    try {
      if (spot.active != null && !story.test(spot.active, {})) return false;
      if (items.inventory.has(spot.item)) return false;
      if (spot.respawn === 'daily' && story.flagValue(`pickup:${spot.item}`) === story.today()) return false;
      return true;
    } catch (error) {
      warnOnce('pickup:test', 'Pickups: a condition failed', error);
      return false;
    }
  }

  #thingAt(tx, ty) {
    return this.#things.find((thing) => thing.visible && thing.data.spot.x === tx && thing.data.spot.y === ty) || null;
  }

  onInteract({ map, tx, ty }) {
    const story = storyOf(this.#game);
    if (!story || story.busy || !map) return;
    const thing = this.#thingAt(tx, ty);
    if (!thing) return;
    this.#use(thing, map);
  }

  #use(thing, map) {
    const story = storyOf(this.#game);
    const { spot } = thing.data;
    story.play([{ pickup: spot.item }], { target: { kind: 'pickup', type: `pickup:${spot.item}`, map: map.id, x: spot.x, y: spot.y, id: spot.item } });
  }

  gate(step) {
    if (step.door) return false;
    const thing = this.#thingAt(step.tx, step.ty);
    if (!thing) return false;
    const game = this.#game;
    const input = game.input;
    /* a tap route that ends at a thing uses it, as a tap on anything solid does */
    if (input && input.mode === 'tap' && !input.dx && !input.dy) {
      const world = game.scenes.top;
      if (world && world.map) this.#use(thing, world.map);
    }
    return true;
  }

  enter(world, stage) {
    this.#things = [];
    for (const spot of this.#spots()) {
      if (spot.map !== world.map.id) continue;
      const thing = new Painted(`pickup:${spot.item}`, {
        x: spot.x * TILE,
        y: spot.y * TILE,
        depth: (spot.row ?? spot.y) * TILE + TILE + 1,
        bounds: { left: -6, top: -4, right: TILE + 6, bottom: TILE + 6 },
        paint: (ctx, self, art, env) => this.#paint(ctx, self, env),
      });
      thing.data = { spot, phase: spot.x * 0.7 + spot.y, light: { x: spot.x * TILE + 8, y: spot.y * TILE + 8, ...GLOW_LIGHT } };
      thing.visible = this.lies(spot);
      this.#things.push(thing);
      stage(thing);
    }
  }

  lights(world) {
    for (const thing of this.#things) if (thing.visible) world.addLight(thing.data.light);
  }

  refresh() {
    for (const thing of this.#things) thing.visible = this.lies(thing.data.spot);
  }

  #image(id) {
    let image = this.#images.get(id);
    if (image !== undefined) return image;
    image = null;
    const url = this.#items ? this.#items.iconUrl(id) : null;
    if (url && typeof Image === 'function') {
      image = new Image();
      image.src = url;
    }
    this.#images.set(id, image);
    return image;
  }

  #glow() {
    const sheet = this.#game.assets.sheet(GLOW_KEY, GLOW_SIZE, GLOW_SIZE);
    if (sheet.blank) {
      const g = sheet.ctx;
      const half = GLOW_SIZE / 2;
      const gradient = g.createRadialGradient(half, half, 1, half, half, half);
      gradient.addColorStop(0, 'rgba(255,230,150,0.7)');
      gradient.addColorStop(1, 'rgba(255,230,150,0)');
      g.fillStyle = gradient;
      g.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
      sheet.blank = false;
    }
    return sheet.canvas;
  }

  #paint(ctx, thing, env) {
    const { spot } = thing.data;
    const px = thing.x;
    const py = thing.y;
    const phase = (env.t || 0) * 2 + thing.data.phase;
    const bob = Math.round(Math.sin(phase) * 1.5);
    ctx.globalAlpha = 0.85 + Math.sin(phase * 1.3) * 0.15;
    ctx.drawImage(this.#glow(), px + 8 - GLOW_SIZE / 2, py + 10 - GLOW_SIZE / 2, GLOW_SIZE, GLOW_SIZE);
    ctx.globalAlpha = 1;
    const image = this.#image(spot.item);
    if (image && image.complete && image.naturalWidth) ctx.drawImage(image, px + 1, py + 1 + bob, ICON_SIZE, ICON_SIZE);
    const twinkle = (Math.sin(phase * 1.7) + 1) / 2;
    if (twinkle > 0.8) {
      ctx.fillStyle = `rgba(255,255,230,${((twinkle - 0.8) * 5).toFixed(3)})`;
      ctx.fillRect(px + 12, py + 2 + bob, 1, 1);
      ctx.fillRect(px + 11, py + 3 + bob, 3, 0.6);
    }
  }

  /* ---------- the take-or-leave choice ---------- */

  async command(node, ctx) {
    const game = this.#game;
    const items = this.#items;
    const story = ctx.story;
    const id = ctx.value(node.pickup);
    if (!items || !id || items.inventory.has(id)) return undefined;
    const book = items.book;
    const words = book.pickup || {};
    const item = book.get(id) || {};
    const full = !items.inventory.canPocket(id);
    const name = item.name || id;
    const use = full ? words.fullDesc : item.use || item.desc;
    const options = [
      { label: story.text(words.take || '{item}', { item: name }, ctx), desc: use ? story.text(use, null, ctx) : '', icon: null, iconUrl: items.iconUrl(id), disabled: full },
      { label: story.text(words.leave || '', null, ctx), desc: '', icon: null, disabled: false },
    ];
    const picked = await story.choose(options, { selected: full ? 1 : 0, highlight: -1, cancel: 1 });
    if (picked !== 0 || story.ended(ctx) || items.inventory.has(id)) return undefined;
    if (!items.inventory.canPocket(id)) {
      if (words.fullToast && game.ui) game.ui.toast(story.text(words.fullToast, null, ctx));
      return undefined;
    }
    if (!items.give(id, 1)) return undefined;
    const spot = this.#spots().find((s) => s.item === id);
    if (spot && spot.respawn === 'daily') story.setFlag(`pickup:${id}`, story.today());
    const world = story.world;
    if (world && spot) world.effect('sparkle', spot.x * TILE + 8, spot.y * TILE + 8, 8);
    this.refresh();
    game.bus.emit('helper:moment', { name: `pickup:${id}` });
    return undefined;
  }
}
