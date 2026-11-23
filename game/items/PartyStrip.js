/*
 * PartyStrip.js  (Hontori game layer: items)
 * Job: the party strip at the top left of the world, as in the current game (src/menu.js): one
 * round face per member with a small health bar, the lead ringed in gold, empty places dashed.
 * It shows while the world is shown and someone travels with the player. A tap opens the panel
 * registered as "party", when one exists.
 *
 * Public API (registry kind "system", id "party-strip"):
 *   new PartyStrip()
 *   start(game)     needs the items service (systems/items) for the party
 *
 * Its styles are the kit's (.hp-strip, .hp-slot in ui/styles.js).
 *
 * Events it listens to: "party:change", "scene:change"
 */

import { element } from '../../ui/dom.js';

export class PartyStrip {
  #game = null;
  #strip = null;
  #faces = new Map();
  #worldShown = false;
  #shown = '';

  start(game) {
    this.#game = game;
    this.#strip = element('button', 'hp-strip', game.ui.layer);
    this.#strip.type = 'button';
    this.#strip.hidden = true;
    this.#strip.addEventListener('click', () => this.#open());
    game.bus.on('party:change', () => this.#refresh());
    game.bus.on('scene:change', ({ base }) => {
      this.#worldShown = !!base && !!base.hud;
      this.#refresh();
    });
  }

  #party() {
    const items = this.#game.registry.get('service', 'items');
    return items && items.party ? items.party : null;
  }

  #open() {
    const game = this.#game;
    if (!game.scenes.top || !game.scenes.top.hud || !game.registry.has('panel', 'party')) return;
    game.ui.openPanel('party');
  }

  #face(key) {
    if (this.#faces.has(key)) return this.#faces.get(key);
    let source = null;
    try {
      source = this.#game.art.portrait('creature', key);
    } catch (error) {
      console.warn('PartyStrip: no face for', key, error);
    }
    /* keep the cache small: only faces of the party are ever asked for */
    if (this.#faces.size > 12) this.#faces.clear();
    this.#faces.set(key, source);
    return source;
  }

  #refresh() {
    const party = this.#party();
    const members = party ? party.members() : [];
    this.#strip.hidden = !this.#worldShown || !members.length;
    if (this.#strip.hidden) return;
    const shown = members.map((m) => `${m.key}:${m.hp}:${m.maxHp}`).join('|');
    if (shown === this.#shown) return;
    this.#shown = shown;
    this.#strip.textContent = '';
    const items = this.#game.registry.get('service', 'items');
    this.#strip.setAttribute('aria-label', items ? items.word('party') : '');
    for (let i = 0; i < party.max; i++) {
      const m = members[i];
      const slot = element('span', `hp-slot${m ? (i === 0 ? ' lead' : '') : ' empty'}`, this.#strip);
      if (!m) continue;
      const canvas = element('canvas', '', slot);
      canvas.width = 48;
      canvas.height = 48;
      const source = this.#face(m.key);
      if (source) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(source, 0, 0, 48, 48);
      }
      const bar = element('i', '', slot);
      const fill = element('b', '', bar);
      const frac = m.maxHp ? Math.max(0, Math.min(1, (m.hp == null ? m.maxHp : m.hp) / m.maxHp)) : 1;
      fill.style.width = `${Math.round(frac * 100)}%`;
    }
  }
}
