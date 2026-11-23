/*
 * Hud.js
 * Job: what is always on screen in the world: the top bar (time-of-day icon, place name, clock,
 * weather) and the column of round buttons at the top right. The buttons are not known here:
 * every system registers its own.
 *
 * Public API (registry kind "system"):
 *   new Hud()
 *   start(game)
 *
 * Registry kind it reads:
 *   "hud.button"   id -> { icon, label, order, open(game), enabled(game), refreshOn }
 *        icon: an icon name the art provider knows; label: the accessible name; order: lower is higher up;
 *        open: called on a tap (usually game.ui.openPanel(id)), also while the button is dimmed, so its
 *        owner can say in one short line why it does not open yet;
 *        enabled: optional; while it answers false the button is shown dimmed (class "off"), never hidden;
 *        refreshOn: optional event names after which enabled is asked again (besides entering a map)
 */

import { element, icon } from './dom.js';
import { fitText } from './TextFit.js';

function partOfDay(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function two(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export class Hud {
  #art;
  #theme;
  #bar;
  #top;
  #timeIcon;
  #weatherIcon;
  #place;
  #clock;
  #weatherSep;
  #weather;
  #shown = '';
  #dimmable = [];

  start(game) {
    this.#art = game.art;
    this.#theme = game.theme;
    const layer = game.ui.layer;
    this.#bar = element('div', 'ui-hud', layer);
    const icons = element('span', 'icons', this.#bar);
    this.#timeIcon = icons.appendChild(icon(game.art, game.theme.icons.time.day));
    this.#weatherIcon = icons.appendChild(icon(game.art, game.theme.icons.time.day));
    this.#place = element('span', 'place', this.#bar);
    element('span', 'sep', this.#bar);
    this.#clock = element('span', 'time', this.#bar);
    this.#weatherSep = element('span', 'sep', this.#bar);
    this.#weather = element('span', 'time', this.#bar);

    this.#top = element('div', 'ui-top', layer);
    const buttons = [...game.registry.all('hud.button')].sort((a, b) => a.order - b.order);
    for (const button of buttons) this.#addButton(game, button);

    this.#setVisible(false);
    game.bus.on('scene:change', ({ base }) => this.#setVisible(!!base && base.hud));
    game.bus.on('map:enter', ({ map, scene }) => this.#show(map, scene.env));
    const refresh = () => this.#refreshButtons(game);
    game.bus.on('map:enter', refresh);
    const events = new Set();
    for (const { refreshOn } of this.#dimmable) for (const name of refreshOn) events.add(name);
    for (const name of events) game.bus.on(name, refresh);
    game.bus.on('world:tick', ({ map, env }) => this.#show(map, env));
  }

  #refreshButtons(game) {
    for (const { button, enabled } of this.#dimmable) {
      let on = true;
      try {
        on = enabled(game) !== false;
      } catch (error) {
        on = true;
      }
      button.classList.toggle('off', !on);
      button.setAttribute('aria-disabled', on ? 'false' : 'true');
    }
  }

  #addButton(game, { icon: iconName, label, open, enabled, refreshOn }) {
    const button = element('button', 'ui-round', this.#top);
    if (typeof enabled === 'function') this.#dimmable.push({ button, enabled, refreshOn: Array.isArray(refreshOn) ? refreshOn : [] });
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.appendChild(icon(game.art, iconName));
    button.addEventListener('click', () => {
      /* one panel at a time: the buttons only answer while the world itself is on top */
      if (!game.scenes.top || !game.scenes.top.hud) return;
      try {
        open(game);
      } catch (error) {
        console.warn(`Hud: the "${label}" button failed`, error);
      }
    });
  }

  #setVisible(on) {
    this.#bar.hidden = !on;
    this.#top.hidden = !on;
    this.#fit();
  }

  /* the place name gives way to the clock and the weather; it can only be measured while shown */
  #fit() {
    if (!this.#bar.hidden) fitText(this.#place);
  }

  #show(map, env) {
    const hour = Math.floor(env.time);
    const clock = `${two(hour)}:${two(Math.floor((env.time - hour) * 60))}`;
    /* the time icon already shows sun or moon; weather is only named when there is some, and never indoors */
    const weather = env.indoor ? '' : (this.#theme.words.weather[env.weather] || '');
    const shown = `${map.name}|${clock}|${weather}`;
    if (shown === this.#shown) return;
    this.#shown = shown;

    this.#timeIcon.src = this.#art.iconUrl(this.#theme.icons.time[partOfDay(env.time)]);
    this.#weatherIcon.hidden = !weather;
    if (weather) this.#weatherIcon.src = this.#art.iconUrl(this.#theme.icons.weather[env.weather]);
    this.#clock.textContent = clock;
    this.#weatherSep.hidden = !weather;
    this.#weather.hidden = !weather;
    this.#weather.textContent = weather;
    this.#place.textContent = map.name;
    this.#fit();
  }
}
