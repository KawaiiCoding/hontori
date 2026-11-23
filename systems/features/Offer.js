/*
 * Offer.js  (engine: features)
 * Job: the one purchase of a game, offered once per journey at a story moment and never in the way of play:
 * an offer card, a grown-up check (a small sum a young child will not answer by tapping around), the code
 * that came with the purchase, and a thank-you card. Whether the full game is open is kept on this device.
 * Codes are compared by their hash, so the plain text is not in the page. It knows no game: the words, the
 * picture and the code hash come from the caller.
 *
 * Public API:
 *   class Entitlement             new Entitlement(keys, storage)  storage: the game's storage (default: the page's); keys: storage keys that hold '1' once unlocked (the
 *                                 first is written); isFull(), unlock()
 *   class OfferScene              enter({ reason, offer, words, codeHash, hash, entitlement, picture, sound })
 *                                 reason 'offer' shows the offer card first, 'code' goes to the grown-up check;
 *                                 result: true once the full game is open
 *   installOffer(game, { entitlement, codeHash, hash, words, offers, picture, sound })
 *        registers "story.command" "offer": { offer: offerId } shows the offer of that id once per journey
 *        (story flag "offer:<id>"), and only while the full game is not open; the script waits for it.
 *        offers: id -> { title, text, list: [textId] }; words: text ids { keep, keepDesc, code, codeDesc,
 *        gateTitle, gateAsk ({a}, {b}), gateWrong, next, back, codeTitle, codeText, codeWrong, codeEmpty,
 *        unlock, doneTitle, doneText, done }; picture(container): paints a row of pictures; sound: the
 *        sound name when the code fits
 *   openOffer(game, reason)       open the screen from anywhere (a menu row, the title); a Promise
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen, guardInput } from './ScreenScene.js';

export class Entitlement {
  #keys;

  #storage;

  constructor(keys, storage) {
    this.#keys = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
    this.#storage = storage || null;
  }

  /* the game's own storage when it was given, else the page's */
  #store() {
    return this.#storage || globalThis.localStorage || null;
  }

  isFull() {
    try {
      const store = this.#store();
      return !!store && this.#keys.some((key) => store.getItem(key) === '1');
    } catch (error) {
      return false;
    }
  }

  unlock() {
    try {
      const store = this.#store();
      if (store && this.#keys[0]) store.setItem(this.#keys[0], '1');
    } catch (error) {
      /* storage that refuses: the game stays open for this visit only */
    }
    this.#open = true;
  }

  #open = false;

  get openNow() {
    return this.#open || this.isFull();
  }
}

function normalize(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export class OfferScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  #o = null;
  #card = null;
  #unlocked = false;

  constructor(game) {
    super(game, 'ft-dim');
  }

  build(root, options) {
    this.#o = options;
    this.#card = element('div', 'ft-card', root);
    if (options.entitlement.openNow) this.#done();
    else if (options.reason === 'offer') this.#offer();
    else this.#gate();
  }

  #w(key, params) {
    const id = this.#o.words[key];
    return id ? this.#o.text(id, params) : '';
  }

  #button(parent, options) {
    const button = new Button(this.game.art, options);
    parent.appendChild(button.element);
    return button;
  }

  #clear() {
    this.#card.textContent = '';
  }

  #picture() {
    if (!this.#o.picture) return;
    const row = element('div', 'pic', this.#card);
    try {
      this.#o.picture(row);
    } catch (error) {
      row.remove();
    }
  }

  #field(numeric, length, onEnter) {
    const input = guardInput(element('input', 'in', this.#card));
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.maxLength = length;
    if (numeric) input.inputMode = 'numeric';
    else input.autocapitalize = 'characters';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') onEnter();
    });
    setTimeout(() => {
      try {
        input.focus();
      } catch (error) {
        /* tappable all the same */
      }
    }, 300);
    return input;
  }

  #offer() {
    const offer = this.#o.offer || {};
    this.#clear();
    this.#picture();
    element('h2', '', this.#card, offer.title ? this.#o.text(offer.title) : '');
    if (offer.text) element('p', '', this.#card, this.#o.text(offer.text));
    if (Array.isArray(offer.list) && offer.list.length) {
      const list = element('div', 'list', this.#card);
      offer.list.forEach((id, i) => {
        if (i) element('br', '', list);
        list.appendChild(document.createTextNode(this.#o.text(id)));
      });
    }
    this.#button(this.#card, { icon: 'wand', label: this.#w('code'), desc: this.#w('codeDesc'), kind: 'gold', wide: true, onPress: () => this.#gate() });
    this.#button(this.#card, { label: this.#w('keep'), desc: this.#w('keepDesc'), kind: 'alt', wide: true, onPress: () => this.done(false) });
  }

  #gate() {
    this.#clear();
    element('h2', '', this.#card, this.#w('gateTitle'));
    const a = 6 + Math.floor(Math.random() * 4);
    const b = 6 + Math.floor(Math.random() * 4);
    element('p', '', this.#card, this.#w('gateAsk', { a, b }));
    const submit = () => {
      if (parseInt(input.value, 10) === a * b) this.#code();
      else {
        error.textContent = this.#w('gateWrong');
        input.value = '';
      }
    };
    const input = this.#field(true, 3, submit);
    const error = element('div', 'err', this.#card, '');
    const row = element('div', 'row', this.#card);
    this.#button(row, { label: this.#w('back'), kind: 'alt', onPress: () => this.done(false) });
    this.#button(row, { label: this.#w('next'), kind: 'gold', onPress: submit });
  }

  #code() {
    const o = this.#o;
    this.#clear();
    element('h2', '', this.#card, this.#w('codeTitle'));
    element('p', '', this.#card, this.#w('codeText'));
    const submit = () => {
      if (o.hash(normalize(input.value)) === o.codeHash) {
        o.entitlement.unlock();
        this.#unlocked = true;
        if (o.sound) {
          try {
            this.game.sound.play(o.sound);
          } catch (e) {
            /* silent */
          }
        }
        this.#done();
        return;
      }
      error.textContent = input.value ? this.#w('codeWrong') : this.#w('codeEmpty');
      input.select();
    };
    const input = this.#field(false, 24, submit);
    input.placeholder = 'XXXXX-X-XXXXX';
    const error = element('div', 'err', this.#card, '');
    const row = element('div', 'row', this.#card);
    this.#button(row, { label: this.#w('back'), kind: 'alt', onPress: () => this.done(false) });
    this.#button(row, { icon: 'wand', label: this.#w('unlock'), kind: 'gold', onPress: submit });
  }

  #done() {
    this.#clear();
    this.#picture();
    element('h2', '', this.#card, this.#w('doneTitle'));
    element('p', '', this.#card, this.#w('doneText'));
    this.#button(this.#card, { icon: 'star', label: this.#w('done'), kind: 'gold', wide: true, onPress: () => this.done(true) });
  }

  onKey(event) {
    if (event.key === 'Escape') this.done(this.#unlocked || this.#o.entitlement.openNow);
  }
}

const SETTINGS = new WeakMap();

export function openOffer(game, reason = 'code', offerId = null) {
  const settings = SETTINGS.get(game);
  if (!settings) return Promise.resolve(false);
  const story = game.registry.get('service', 'story');
  const text = (id, params) => (story ? story.text(id, params) : String(id));
  return openScreen(game, new OfferScene(game), {
    ...settings,
    reason,
    offer: offerId ? settings.offers[offerId] : null,
    text,
  }).then((value) => !!value);
}

export function installOffer(game, options) {
  const settings = { offers: {}, words: {}, ...options };
  SETTINGS.set(game, settings);
  game.registry.add('story.command', 'offer', async (node, ctx) => {
    const id = ctx.value(node.offer);
    const key = `offer:${id}`;
    if (settings.entitlement.openNow || ctx.story.flag(key)) return undefined;
    ctx.story.setFlag(key, true);
    game.save.commit();
    await openOffer(game, 'offer', id);
    return undefined;
  });
}
