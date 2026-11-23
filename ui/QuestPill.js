/*
 * QuestPill.js
 * Job: the small quest button under the top bar. It shows the quest icon; when a quest or step is new
 * it glows, slides the step's words out for a few seconds and keeps a dot until tapped. A tap shows the
 * current quest and step in a small card with a way into the quest log.
 *
 * Public API (registry kind "system"):
 *   new QuestPill(quests, { icon, words, visible(), moment(name) })
 *        quests: the Quests system; visible(): an extra rule for showing it; moment(name): a first-touch
 *        moment ('ui:questPill' on the first tap)
 *   start(game)
 *
 * It shows while the world is the lowest scene, visible() holds and a quest is active. It listens to
 * "quest:change", "map:enter", "world:tick" and "scene:change".
 */

import { element, icon } from './dom.js';
import { Button } from './Button.js';

const PEEK_MS = 3000;

export class QuestPill {
  #quests;
  #options;
  #game = null;
  #pill = null;
  #icon = null;
  #line = null;
  #pop = null;
  #popTitle = null;
  #popStep = null;
  #shownKey = '';
  #peek = 0;
  #told = false;

  constructor(quests, options = {}) {
    this.#quests = quests;
    this.#options = options;
  }

  start(game) {
    this.#game = game;
    const layer = game.ui.layer;
    this.#pill = element('button', 'ui-qpill', layer);
    this.#pill.type = 'button';
    this.#pill.hidden = true;
    this.#icon = this.#pill.appendChild(icon(game.art, this.#options.icon || 'scroll'));
    this.#line = element('span', '', this.#pill);
    this.#pill.addEventListener('pointerdown', (event) => event.stopPropagation());
    this.#pill.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!this.#worldOnTop()) return;
      this.#pill.classList.remove('new');
      this.#toggle();
    });

    this.#pop = element('div', 'ui-panel ui-qpop', layer);
    this.#popTitle = element('b', '', this.#pop);
    this.#popStep = element('p', '', this.#pop);
    this.#pop.addEventListener('pointerdown', (event) => event.stopPropagation());
    const words = this.#options.words || {};
    const open = new Button(game.art, { icon: this.#options.icon || 'scroll', label: words.log || 'Quest Log', kind: 'alt', small: true, wide: true,
      onPress: (event) => {
        event.stopPropagation();
        this.#toggle(false);
        if (this.#worldOnTop()) game.ui.openPanel('quests');
      } });
    this.#pop.appendChild(open.element);
    document.addEventListener('pointerdown', (event) => {
      if (this.#pop.classList.contains('on') && !this.#pop.contains(event.target) && !this.#pill.contains(event.target)) this.#toggle(false);
    }, true);

    const render = () => this.#render();
    game.bus.on('quest:change', render);
    game.bus.on('map:enter', render);
    game.bus.on('world:tick', render);
    game.bus.on('scene:change', render);
  }

  #worldOnTop() {
    const top = this.#game.scenes.top;
    return !!(top && top.hud);
  }

  #toggle(on = !this.#pop.classList.contains('on')) {
    if (on) {
      const id = this.#quests.current();
      if (!id) return;
      this.#popTitle.textContent = this.#quests.title(id);
      this.#popStep.textContent = this.#quests.stepText(id);
      if (!this.#told) {
        this.#told = true;
        this.#moment('ui:questPill');
      }
    }
    this.#pop.classList.toggle('on', on);
  }

  #render() {
    const pill = this.#pill;
    if (!pill) return;
    const id = this.#quests.current();
    const base = this.#game.scenes.base;
    const show = !!id && !!(base && base.hud) && this.#visible();
    pill.hidden = !show;
    if (!show) {
      this.#toggle(false);
      if (!id) this.#shownKey = '';
      return;
    }
    const step = this.#quests.nextStep(id);
    const key = `${id}|${step ? step.id : ''}`;
    const title = this.#quests.title(id);
    const line = this.#quests.stepText(id) || title;
    if (this.#line.textContent !== line) this.#line.textContent = line;
    pill.title = title;
    pill.setAttribute('aria-label', line === title ? title : `${title}: ${line}`);
    if (this.#pop.classList.contains('on')) {
      this.#popTitle.textContent = title;
      this.#popStep.textContent = this.#quests.stepText(id);
    }
    if (key === this.#shownKey) return;
    /* a new quest or step: glow, slide the words out for a moment, keep a dot until tapped */
    pill.classList.remove('flash');
    void pill.offsetWidth;
    pill.classList.add('flash', 'open');
    if (this.#shownKey) pill.classList.add('new');
    this.#shownKey = key;
    clearTimeout(this.#peek);
    this.#peek = setTimeout(() => pill.classList.remove('open'), PEEK_MS);
  }

  #visible() {
    try {
      return this.#options.visible ? !!this.#options.visible() : true;
    } catch (error) {
      return false;
    }
  }

  #moment(name) {
    try {
      if (this.#options.moment) this.#options.moment(name);
    } catch (error) {
      /* a moment nobody listens to is fine */
    }
  }
}
