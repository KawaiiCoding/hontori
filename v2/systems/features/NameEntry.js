/*
 * NameEntry.js  (engine: features)
 * Job: give a companion its own name: a card with its face, a title, one text field with a gentle
 * suggestion, "Later" and "Name it". Also the story command that asks for the lead's name.
 *
 * Public API:
 *   class NameEntryScene          enter({ title, current, ideas, portrait, words: { later, ok } })
 *                                 result: the cleaned name, or null for "Later"
 *   askName(game, options)        open it; a Promise of the name or null
 *   cleanName(text, max)          letters, digits, spaces, ' and - only, trimmed, at most max (12) long
 *   installNameEntry(game, { ideas, portraitOf(member), memberOf(target), words: { later, ok } })   (words are
 *        text ids; memberOf: the member an object target names, for a game that keeps some elsewhere)
 *        registers "story.command" "ask:name":
 *        { ask: 'name', target: 'lead' | index, title: textId, as: varName, then: [commands] }
 *        the lead of the party (registry "service" "items"), or the member at that index, gets the name; `as` keeps it in a variable;
 *        `then` runs only when a name was given
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen, guardInput } from './ScreenScene.js';

const MAX_LENGTH = 12;

export function cleanName(text, max = MAX_LENGTH) {
  return String(text || '').replace(/[^\p{L}\p{N} '-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max).trim();
}

export class NameEntryScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  #input = null;

  constructor(game) {
    super(game, 'ft-dim');
  }

  build(root, { title = '', current = '', ideas = [], portrait = null, words = {} }) {
    const card = element('div', 'ft-card', root);
    if (portrait) {
      const pic = element('div', 'pic', card);
      const canvas = element('canvas', 'big', pic);
      canvas.width = 96;
      canvas.height = 96;
      const g = canvas.getContext('2d');
      g.imageSmoothingEnabled = false;
      try {
        g.drawImage(portrait, 0, 0, 96, 96);
      } catch (error) {
        pic.remove();
      }
    }
    element('h3', '', card, title);
    const input = guardInput(element('input', 'in', card));
    input.maxLength = MAX_LENGTH;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.value = current || '';
    input.placeholder = ideas.length ? ideas[Math.floor(Math.random() * ideas.length)] : '';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.#confirm();
      } else if (event.key === 'Escape') this.done(null);
    });
    this.#input = input;
    const row = element('div', 'row', card);
    row.appendChild(new Button(this.game.art, { label: words.later || 'Later', kind: 'alt', onPress: () => this.done(null) }).element);
    row.appendChild(new Button(this.game.art, { label: words.ok || 'OK', kind: 'gold', onPress: () => this.#confirm() }).element);
    setTimeout(() => {
      try {
        if (this.#input) this.#input.focus();
      } catch (error) {
        /* a field that cannot take focus is still tappable */
      }
    }, 80);
  }

  exit() {
    this.#input = null;
    super.exit();
  }

  #confirm() {
    const input = this.#input;
    if (!input) return;
    const name = cleanName(input.value || input.placeholder);
    this.done(name || null);
  }
}

export function askName(game, options) {
  return openScreen(game, new NameEntryScene(game), options);
}

export function installNameEntry(game, { ideas = [], portraitOf = () => null, memberOf = () => null, words = {} } = {}) {
  game.registry.add('story.command', 'ask:name', async (node, ctx) => {
    const items = game.registry.get('service', 'items');
    const party = items && items.party;
    /* target: 'lead' (default), a party index, 'none' (only ask), or anything the game's memberOf knows */
    const target = node.target;
    const list = party && typeof party.members === 'function' ? party.members() : [];
    let member = null;
    if (target === 'none' || !party) member = null;
    else if (Number.isInteger(target)) member = list[target] || null;
    else if (target && typeof target === 'object') {
      try {
        member = memberOf(target) || null;
      } catch (error) {
        member = null;
      }
    } else member = party.lead();
    let portrait = null;
    try {
      portrait = member ? portraitOf(member) : null;
    } catch (error) {
      portrait = null;
    }
    const name = await askName(game, {
      title: node.title ? ctx.text(node.title) : '',
      current: member && member.nick ? member.nick : '',
      ideas,
      portrait,
      words: { later: words.later ? ctx.text(words.later) : undefined, ok: words.ok ? ctx.text(words.ok) : undefined },
    });
    if (!name) return undefined;
    if (member) {
      member.nick = name;
      party.changed();
      game.save.commit();
    }
    if (node.as) ctx.vars[node.as] = name;
    return Array.isArray(node.then) ? ctx.run(node.then) : undefined;
  });
}
